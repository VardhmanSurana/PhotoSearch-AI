import { useState, useCallback } from 'react';
import { db, PhotoRecord, FolderRecord } from '@/lib/database';
import { SecurityManager } from '@/lib/security';
import { PerformanceManager } from '@/lib/performance';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateImageDescription as generateMistralDescription } from '@/lib/mistral';
import { IMAGE_PROMPT } from '@/lib/Prompts';

export interface ProcessingStats {
  total: number;
  processed: number;
  errors: number;
  isProcessing: boolean;
}

export function usePhotoProcessor() {
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    processed: 0,
    errors: 0,
    isProcessing: false
  });
  const { toast } = useToast();

  const processFolder = useCallback(async (
    files: FileList,
    folderName: string,
    model: 'gemini' | 'ollama' | 'mistral' = 'gemini',
    apiKey?: string
  ) => {

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast({
        title: "No images found",
        description: "Please select a folder containing image files.",
        variant: "destructive"
      });
      return;
    }

    // Security validation
    const batchValidation = SecurityManager.validateBatch(imageFiles);
    if (!batchValidation.valid) {
      toast({
        title: "Batch validation failed",
        description: batchValidation.error,
        variant: "destructive"
      });
      return;
    }

    // Validate individual files
    const invalidFiles = imageFiles.filter(file => {
      const validation = SecurityManager.validateImageFile(file);
      return !validation.valid;
    });

    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} invalid files`,
        description: "Some files were skipped due to security restrictions.",
        variant: "destructive"
      });
    }

    const validFiles = imageFiles.filter(file => {
      const validation = SecurityManager.validateImageFile(file);
      return validation.valid;
    });

    setStats({
      total: validFiles.length,
      processed: 0,
      errors: 0,
      isProcessing: true
    });

    // Determine effective folder path for database
    let effectiveFolderPath: string;
    let effectiveFolderName: string;

    if (files[0].webkitRelativePath) {
      effectiveFolderPath = files[0].webkitRelativePath.split('/')[0];
      effectiveFolderName = folderName; // Use the passed folderName
    } else {
      // For single/multiple file uploads
      effectiveFolderPath = "__individual_uploads__"; // A unique identifier for individual uploads
      effectiveFolderName = "Individual Uploads"; // A user-friendly name
    }

    // Create or update folder record
    let folder = await db.folders.where('path').equals(effectiveFolderPath).first();

    if (!folder) {
      const folderId = await db.folders.add({
        name: effectiveFolderName,
        path: effectiveFolderPath,
        photoCount: validFiles.length, // This will be updated later
        lastScanned: new Date()
      });
      folder = await db.folders.get(folderId);
    } else {
      // Update existing folder record
      await db.folders.update(folder.id!, {
        photoCount: (folder.photoCount || 0) + validFiles.length, // Increment photo count
        lastScanned: new Date()
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process images using performance manager
    const results = await PerformanceManager.processBatch(
      validFiles,
      async (file) => {
        try {
          // Check if already processed
          // Use a more robust path for checking existing photos
          const photoDbPath = file.webkitRelativePath || `${effectiveFolderPath}/${file.name}`;

          const existing = await db.photos
            .where('path')
            .equals(photoDbPath)
            .first();

          if (existing && existing.processed === 1) {
            processedCount++;
            setStats(prev => ({ ...prev, processed: processedCount }));
            return { success: true, file: file.name };
          }

          // Generate description
          let description = "";
          let classification = "";
          let extracted_text = "";

          const parseAIResponse = (responseText: string) => {
            const descMatch = responseText.match(/Description: ([\s\S]*?)\nClassification:/);
            const classMatch = responseText.match(/Classification: ([^\n]*)/);
            const textMatch = responseText.match(/Extracted Text: ([\s\S]*)/);

            return {
              description: descMatch ? descMatch[1].trim() : "",
              classification: classMatch ? classMatch[1].trim() : "Other",
              extracted_text: textMatch ? textMatch[1].trim() : "N/A",
            };
          };

          const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          };

          const fileToGenerativePart = async (file: File) => {
            const base64 = await fileToBase64(file);
            return {
              inlineData: {
                data: base64.split(',')[1],
                mimeType: file.type
              }
            };
          };

          if (model === 'gemini') {
            if (!apiKey) {
              throw new Error('Gemini API key not set');
            }
            try {
              const genAI = new GoogleGenerativeAI(apiKey);
              const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
              const imageData = await fileToGenerativePart(file);
              const prompt = IMAGE_PROMPT;
              const result = await geminiModel.generateContent([prompt, imageData]);
              const response = await result.response;
              const parsed = parseAIResponse(response.text());
              description = parsed.description;
              classification = parsed.classification;
              extracted_text = parsed.extracted_text;
            } catch (error) {
              console.error('Gemini processing error:', error);
              throw new Error('Failed to process image with Gemini');
            }
          } else if (model === 'ollama') {
            try {
              const base64 = await fileToBase64(file);
              const response = await fetch(`http://localhost:11434/api/generate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'llava',
                  prompt: IMAGE_PROMPT,
                  images: [base64.split(',')[1]],
                  stream: false
                })
              });
              if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
              }
              const data = await response.json();
              const parsed = parseAIResponse(data.response);
              description = parsed.description;
              classification = parsed.classification;
              extracted_text = parsed.extracted_text;
            } catch (error) {
              console.error('Ollama processing error:', error);
              throw new Error('Failed to process image with Ollama. Make sure Ollama is running locally.');
            }
          } else if (model === 'mistral') {
            try {
              const base64 = await fileToBase64(file);
              const result = await generateMistralDescription(base64.split(',')[1], IMAGE_PROMPT);
              if (result.success && result.description) {
                const parsed = parseAIResponse(result.description);
                description = parsed.description;
                classification = parsed.classification;
                extracted_text = parsed.extracted_text;
              } else {
                throw new Error(result.description || "Mistral description generation failed.");
              }
            } catch (error) {
              console.error('Mistral processing error:', error);
              throw new Error('Failed to process image with Mistral.');
            }
          }

          // Create optimized thumbnail
          const thumbnail = await PerformanceManager.compressImage(file, 300, 300, 0.8);

          // Save to database
          const photoData: PhotoRecord = {
            path: photoDbPath, // Use the robust path
            description,
            classification,
            extracted_text,
            folderId: folder!.id!.toString(),
            filename: file.name,
            size: file.size,
            lastModified: file.lastModified,
            thumbnail,
            processed: 1,
            createdAt: new Date()
          };

          if (existing) {
            await db.photos.update(existing.id!, photoData);
          } else {
            await db.photos.add(photoData);
          }

          processedCount++;
          setStats(prev => ({ ...prev, processed: processedCount }));
          return { success: true, file: file.name };
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          errorCount++;
          setStats(prev => ({ ...prev, errors: errorCount }));
          throw error;
        }
      },
      3, // batch size
      1000 // delay between batches
    );

    setStats(prev => ({ ...prev, isProcessing: false }));

    toast({
      title: "Processing complete",
      description: `Processed ${processedCount} images with ${errorCount} errors.`,
      variant: processedCount > 0 ? "default" : "destructive"
    });
  }, [toast]);

  const stopProcessing = useCallback(() => {
    setStats(prev => ({ ...prev, isProcessing: false }));
  }, []);

  return {
    stats,
    processFolder,
    stopProcessing
  };
}