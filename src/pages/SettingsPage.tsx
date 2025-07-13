import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';



import { Settings as SettingsIcon, Wifi, CheckCircle, XCircle, AlertCircle, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { testMistralConnection } from '@/lib/mistral';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'ollama' | 'mistral'>(() => {
    return localStorage.getItem('selectedModel') as 'gemini' | 'ollama' | 'mistral' || 'gemini';
  });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('geminiApiKey') || '';
  });
  const [mistralApiKey, setMistralApiKey] = useState(() => {
    return localStorage.getItem('mistralApiKey') || '';
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  const handleSaveGeminiApiKey = () => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
    toast({
      title: "Gemini API Key saved!",
      description: "Your Gemini API key has been successfully saved.",
    });
  };

  const handleSaveMistralApiKey = () => {
    localStorage.setItem('mistralApiKey', mistralApiKey);
    toast({
      title: "Mistral API Key saved!",
      description: "Your Mistral API key has been successfully saved.",
    });
  };

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResults([]);
    const results: TestResult[] = [];

    if (selectedModel === 'gemini') {
      if (geminiApiKey) {
        // In a real application, you would make an actual API call to Gemini
        // For this example, we'll just simulate a successful connection
        results.push({
          name: 'Gemini API Connection',
          status: 'success',
          message: 'Gemini API key is present (simulated success)',
        });
      } else {
        results.push({
          name: 'Gemini API Connection',
          status: 'error',
          message: 'Gemini API Key is not set.',
        });
      }
    } else if (selectedModel === 'ollama') {
      try {
        const response = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          const hasLlava = data.models?.some((model: { name: string }) => model.name.includes('llava:7b'));
          results.push({
            name: 'Ollama Connection',
            status: hasLlava ? 'success' : 'warning',
            message: hasLlava
              ? 'Ollama running with llava:7b model'
              : 'Ollama running but llava:7b model not found',
          });
        } else {
          results.push({
            name: 'Ollama Connection',
            status: 'warning',
            message: 'Ollama not accessible (check if running)',
          });
        }
      } catch (error) {
        results.push({
          name: 'Ollama Connection',
          status: 'error',
          message: `Ollama not running: ${error}`,
        });
      }
    } else if (selectedModel === 'mistral') {
        const result = await testMistralConnection(mistralApiKey);
        results.push({
            name: 'Mistral API Connection',
            status: result.success ? 'success' : 'error',
            message: result.message,
        });
    }
    setTestResults(results);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-yellow-50">Warning</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select AI Model</Label>
            <RadioGroup
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as 'gemini' | 'ollama' | 'mistral')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="gemini" />
                <img src="/geminilogo.png" alt="Gemini Logo" className="w-5 h-5" />
                <Label htmlFor="gemini">Gemini API</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ollama" id="ollama" />
                <img src="/ollamalogo.png" alt="Ollama Logo" className="w-5 h-5" />
                <Label htmlFor="ollama">Ollama (Local)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mistral" id="mistral" />
                <img src="/mistrallogo.png" alt="Mistral AI Logo" className="w-5 h-5" />
                <Label htmlFor="mistral">Mistral AI</Label>
              </div>
            </RadioGroup>
          </div>

          {selectedModel === 'gemini' && (
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
                <Button onClick={handleSaveGeminiApiKey}>Save</Button>
              </div>
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

          {selectedModel === 'mistral' && (
            <div className="space-y-2">
              <Label htmlFor="mistral-api-key">Mistral API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="mistral-api-key"
                  type="password"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                  placeholder="Enter your Mistral API key"
                />
                <Button onClick={handleSaveMistralApiKey}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://console.mistral.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Mistral AI Platform
                </a>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={runConnectionTest} disabled={testing} className="w-full">
              <Wifi className="w-4 h-4 mr-2" />
              {testing ? 'Running Tests...' : 'Run Connection Test'}
            </Button>
            {testResults.length > 0 && (
              <div className="space-y-3 mt-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                        <p className="text-xs text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <span className="text-sm text-muted-foreground">Current theme: {theme}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
