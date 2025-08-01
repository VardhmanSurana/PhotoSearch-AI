import OpenAI from 'openai';

let openrouterClient: OpenAI | null = null;

function getOpenrouterClient(apiKey?: string) {
  if (!openrouterClient || (apiKey && openrouterClient.apiKey !== apiKey)) {
    const finalApiKey = apiKey || import.meta.env.OPENROUTER_API_KEY;
    if (!finalApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set in .env file or provided.");
    }
    openrouterClient = new OpenAI({
      apiKey: finalApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
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
    const client = getOpenrouterClient(apiKey);
    const models = await client.models.list();
    
    const freeVisionModels = models.data.filter(model => {
      const architecture = (model as any).architecture;
      const pricing = (model as any).pricing;
        const hasImageInput = architecture?.input_modalities?.includes('image');
        const isFree = pricing?.prompt === '0' &&
                       pricing?.completion === '0' &&
                       (pricing?.image === undefined || pricing?.image === '0');
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
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const description = chatResponse.choices[0]?.message?.content || "No description generated.";

    return {
      success: true,
      description: description,
    };
  } catch (error) {
    console.error("Error generating OpenRouter image description:", error);
    return { success: false, description: `Failed to generate description: ${error.message}` };
  }
}
