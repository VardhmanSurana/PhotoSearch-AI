import { useRef, useState } from 'react';
import { Upload, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePhotoProcessor } from '@/hooks/usePhotoProcessor';

export function FolderUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'ollama' | 'mistral'>(() => {
    return localStorage.getItem('selectedModel') as 'gemini' | 'ollama' | 'mistral' || 'gemini';
  });
  
  const { stats, processFolder, stopProcessing } = usePhotoProcessor();

  const handleFolderSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSingleFileSelect = () => {
    singleFileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const folderName = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : 'Single Upload';
    const apiKey = localStorage.getItem('geminiApiKey') || ''; // Gemini API key is still needed for Gemini model
    await processFolder(files, folderName, selectedModel, apiKey);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Folder className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Photo Folder</h3>
            <p className="text-muted-foreground">
              Select a folder containing your photos to start AI-powered search
            </p>
          </div>

          <div className="space-y-2">
            <Label>AI Model for Processing</Label>
            <RadioGroup
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as 'gemini' | 'ollama' | 'mistral')}
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mistral" id="mistral-upload" />
                <Label htmlFor="mistral-upload">Mistral AI</Label>
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
            <div className="flex flex-col gap-4">
              <Button onClick={handleFolderSelect} size="lg" className="w-full">
                <Folder className="w-5 h-5 mr-2" />
                Select Photo Folder
              </Button>
              <Button onClick={handleSingleFileSelect} size="lg" className="w-full" variant="outline">
                <Upload className="w-5 h-5 mr-2" />
                Upload Single/Multiple Images
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            // @ts-expect-error - webkitdirectory is not in TypeScript types but works in browsers
            webkitdirectory="true"
            className="hidden"
            onChange={handleFilesSelected}
            accept="image/*"
          />
          <input
            ref={singleFileInputRef}
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
}