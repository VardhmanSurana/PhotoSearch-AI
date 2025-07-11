import { GoogleGenerativeAI } from '@google/generative-ai';

export class ImageProcessor {
  private geminiKey: string | null = null;
  private ollamaUrl: string = 'http://localhost:11434';

  setGeminiKey(key: string) {
    this.geminiKey = key;
  }

  setOllamaUrl(url: string) {
    this.ollamaUrl = url;
  }

  async processWithGemini(imageFile: File): Promise<string> {
    if (!this.geminiKey) {
      throw new Error('Gemini API key not set');
    }

    try {
      const genAI = new GoogleGenerativeAI(this.geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const imageData = await this.fileToGenerativePart(imageFile);
      const prompt = "Describe this image in detail, focusing on objects, people, activities, colors, and setting. Be descriptive but concise.";

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini processing error:', error);
      throw new Error('Failed to process image with Gemini');
    }
  }

  async processWithOllama(imageFile: File): Promise<string> {
    try {
      const base64 = await this.fileToBase64(imageFile);
      
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llava',
          prompt: 'Describe this image in detail, focusing on objects, people, activities, colors, and setting.',
          images: [base64.split(',')[1]], // Remove data:image/... prefix
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama processing error:', error);
      throw new Error('Failed to process image with Ollama. Make sure Ollama is running locally.');
    }
  }

  private async fileToGenerativePart(file: File) {
    const base64 = await this.fileToBase64(file);
    return {
      inlineData: {
        data: base64.split(',')[1],
        mimeType: file.type
      }
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async createThumbnail(file: File, maxSize: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}

export const imageProcessor = new ImageProcessor();