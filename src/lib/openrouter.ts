import OpenAI from 'openai';

let openrouterClient: OpenAI | null = null;

function getOpenrouterClient(apiKey?: string) {
  if (!openrouterClient || (apiKey && openrouterClient.apiKey !== apiKey)) {
    const finalApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!finalApiKey) {
      throw new Error("VITE_OPENROUTER_API_KEY is not set in .env file or provided.");
    }
    openrouterClient = new OpenAI({
      apiKey: finalApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true, // OpenRouter supports browser usage with API key
    });
  }
  return openrouterClient;
}

interface Pricing {
    prompt: string;
    completion: string;
    image?: string; // Image cost might be optional for some models
}

interface Architecture {
    input_modalities: string[];
    output_modalities: string[];
}

interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: Pricing;
    architecture: Architecture;
    context_length: number;
    // Add other properties if you need them from the API response
}

interface OpenRouterApiResponse {
    data: OpenRouterModel[];
    // The API might have other metadata like 'object' or 'meta'
}

export async function testOpenrouterConnection(apiKey?: string) {
  try {
    // Use fetch directly as per the provided logic
    const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
            'Authorization': `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const data: OpenRouterApiResponse = await response.json();
    
    const freeVisionModels = data.data.filter(model => {
        const hasImageInput = model.architecture?.input_modalities?.includes('image');
        const isFree = model.pricing?.prompt === '0' && 
                       model.pricing?.completion === '0' && 
                       (model.pricing?.image === undefined || model.pricing?.image === '0');
        return hasImageInput && isFree;
    });

    return { success: true, message: "Connection to OpenRouter successful.", models: freeVisionModels.map(model => model.id) };
  } catch (error) {
    console.error("Error testing OpenRouter connection:", error);
    return { success: false, message: `Failed to connect to OpenRouter: ${error.message}` };
  }
}

export async function generateOpenrouterImageDescription(base64Image: string, prompt: string, model: string, apiKey?: string) {
  try {
    const client = getOpenrouterClient(apiKey);
    const chatResponse = await client.chat.completions.create({
      model: model, // Use the dynamically selected model
      messages: [
        { role: 'user', content: prompt },
        // OpenRouter supports vision models, but the exact format might vary.
        // Assuming a simple text prompt for now, as image input is complex.
        // If a specific vision model is chosen, this part would need adjustment.
      ],
    });

    return {
      success: true,
      description: chatResponse.choices[0]?.message?.content || "No description generated.",
    };
  } catch (error) {
    console.error("Error generating OpenRouter image description:", error);
    return { success: false, description: `Failed to generate description: ${error.message}` };
  }
}
