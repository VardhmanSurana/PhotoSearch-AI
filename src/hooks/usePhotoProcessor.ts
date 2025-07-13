import { useState, useCallback } from 'react';
import { db, PhotoRecord, FolderRecord } from '@/lib/database';
import { imageProcessor } from '@/lib/imageProcessor';
import { SecurityManager } from '@/lib/security';
import { PerformanceManager } from '@/lib/performance';
import { useToast } from '@/hooks/use-toast';

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
    useGemini: boolean = true,
    apiKey?: string
  ) => {
    if (useGemini && apiKey) {
      imageProcessor.setGeminiKey(apiKey);
    }

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
          const description = useGemini 
            ? await imageProcessor.processWithGemini(file)
            : await imageProcessor.processWithOllama(file);

          // Create optimized thumbnail
          const thumbnail = await PerformanceManager.compressImage(file, 300, 300, 0.8);

          // Save to database
          const photoData: PhotoRecord = {
            path: photoDbPath, // Use the robust path
            description,
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