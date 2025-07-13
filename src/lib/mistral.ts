import { Mistral } from "@mistralai/mistralai";

let mistral: Mistral | null = null;

function getMistralClient(apiKey?: string) {
  if (!mistral || (apiKey && mistral.apiKey !== apiKey)) {
    const finalApiKey = apiKey || import.meta.env.VITE_MISTRAL_API_KEY;
    if (!finalApiKey) {
      throw new Error("MISTRAL_API_KEY is not set in .env file or provided.");
    }
    mistral = new Mistral({ apiKey: finalApiKey });
  }
  return mistral;
}

export async function testMistralConnection(apiKey?: string) {
  try {
    const client = getMistralClient(apiKey);
    // A simple request to test the connection
    await client.models.list();
    return { success: true, message: "Connection to Mistral AI successful." };
  } catch (error) {
    console.error("Error testing Mistral connection:", error);
    return { success: false, message: "Failed to connect to Mistral AI." };
  }
}

export async function generateImageDescription(base64Image: string, prompt: string, apiKey?: string) {
  try {
    const client = getMistralClient(apiKey);
    const chatResponse = await client.chat.complete({
      model: "pixtral-12b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              imageUrl: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
    });

    return {
      success: true,
      description: chatResponse.choices[0].message.content,
    };
  } catch (error) {
    console.error("Error generating image description:", error);
    return { success: false, description: "Failed to generate description." };
  }
}