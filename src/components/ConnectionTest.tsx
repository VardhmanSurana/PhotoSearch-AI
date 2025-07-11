import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Wifi } from 'lucide-react';
import { db } from '@/lib/database';
import { imageProcessor } from '@/lib/imageProcessor';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test IndexedDB connection
    try {
      await db.photos.limit(1).toArray();
      testResults.push({
        name: 'Database Connection',
        status: 'success',
        message: 'IndexedDB connection successful'
      });
    } catch (error) {
      testResults.push({
        name: 'Database Connection',
        status: 'error',
        message: `Database error: ${error}`
      });
    }

    // Test Ollama connection
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const hasLlava = data.models?.some((model: any) => model.name.includes('llava:7b'));
        testResults.push({
          name: 'Ollama Connection',
          status: hasLlava ? 'success' : 'warning',
          message: hasLlava 
            ? 'Ollama running with llava:7b model' 
            : 'Ollama running but llava:7b model not found'
        });
      } else {
        testResults.push({
          name: 'Ollama Connection',
          status: 'warning',
          message: 'Ollama not accessible (use Gemini instead)'
        });
      }
    } catch (error) {
      testResults.push({
        name: 'Ollama Connection',
        status: 'warning',
        message: 'Ollama not running (use Gemini instead)'
      });
    }

    // Test file API support
    try {
      if ('showDirectoryPicker' in window) {
        testResults.push({
          name: 'File System API',
          status: 'success',
          message: 'Modern file picker available'
        });
      } else {
        testResults.push({
          name: 'File System API',
          status: 'warning',
          message: 'Using fallback file input'
        });
      }
    } catch (error) {
      testResults.push({
        name: 'File System API',
        status: 'warning',
        message: 'Limited file access'
      });
    }

    // Test WebWorker support
    if (typeof Worker !== 'undefined') {
      testResults.push({
        name: 'WebWorker Support',
        status: 'success',
        message: 'Background processing available'
      });
    } else {
      testResults.push({
        name: 'WebWorker Support',
        status: 'warning',
        message: 'Processing will block UI'
      });
    }

    setResults(testResults);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          System Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing} 
          className="w-full"
        >
          {testing ? 'Running Tests...' : 'Run Connection Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
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

        {results.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Recommendations:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Use Gemini API for reliable image processing</li>
              <li>• Enable CORS for Ollama if using locally</li>
              <li>• Modern browsers provide better file access</li>
              <li>• Process images in small batches to avoid timeouts</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}