import { useRef, useState } from 'react';
import { Upload, Folder, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePhotoProcessor } from '@/hooks/usePhotoProcessor';

export function FolderUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useGemini, setUseGemini] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { stats, processFolder, stopProcessing } = usePhotoProcessor();

  const handleFolderSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const folderName = files[0].webkitRelativePath.split('/')[0];
    await processFolder(files, folderName, useGemini, apiKey);
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

          <Collapsible open={showSettings} onOpenChange={setShowSettings}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-gemini">Use Gemini API</Label>
                <Switch
                  id="use-gemini"
                  checked={useGemini}
                  onCheckedChange={setUseGemini}
                />
              </div>
              
              {useGemini && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">Gemini API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a 
                      href="https://ai.google.dev/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
              )}
              
              {!useGemini && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                  <p className="font-medium mb-1">Using Ollama (Local)</p>
                  <p>Make sure Ollama is running with the llava model:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded mt-1 block">
                    ollama pull llava && ollama serve
                  </code>
                </div>
              )}
            </CollapsibleContent>
            </Collapsible>

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
            <Button onClick={handleFolderSelect} size="lg" className="w-full">
              <Upload className="w-5 h-5 mr-2" />
              Select Photo Folder
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            // @ts-ignore - webkitdirectory is not in TypeScript types but works in browsers
            webkitdirectory="true"
            className="hidden"
            onChange={handleFilesSelected}
            accept="image/*"
          />
        </div>
      </CardContent>
    </Card>
  );
}