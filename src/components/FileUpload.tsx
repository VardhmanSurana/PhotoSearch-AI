import React, { useState, ChangeEvent, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePhotoProcessor } from '@/hooks/usePhotoProcessor';

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selectedModel') || 'gemini';
  });

  const { stats, processFolder, stopProcessing } = usePhotoProcessor();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const apiKey = localStorage.getItem('geminiApiKey') || '';
    await processFolder(files, 'Individual Uploads', selectedModel === 'gemini', apiKey);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
            <p className="text-muted-foreground">
              Select individual or multiple photos to start AI-powered search
            </p>
          </div>

          <div className="space-y-2">
            <Label>AI Model for Processing</Label>
            <RadioGroup
              value={selectedModel}
              onValueChange={setSelectedModel}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="gemini-upload" />
                <Label htmlFor="gemini-upload">Gemini API</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ollama" id="ollama-upload" />
                <Label htmlFor="ollama-upload">Ollama (Local)</Label>
              </div>
            </RadioGroup>
          </div>

          {stats.isProcessing ? (
            <div className="space-y-3">
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.processed / stats.total) * 100}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Processing {stats.processed} of {stats.total} images
                {stats.errors > 0 && ` (${stats.errors} errors)`}
              </div>
              <Button onClick={stopProcessing} variant="outline">
                Stop Processing
              </Button>
            </div>
          ) : (
            <Button onClick={handleFileSelect} size="lg" className="w-full">
              <Upload className="w-5 h-5 mr-2" />
              Select Photos
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
            accept="image/*"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;