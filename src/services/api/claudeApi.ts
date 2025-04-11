
// API key for Anthropic/Claude - Note: In production, this should be handled by a backend service
const CLAUDE_API_KEY = "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";

// Helper function to get the media type
export function getMediaType(fileType: string): string {
  return fileType || 'image/jpeg';
}

// Helper function to convert File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

// Call the actual Claude API with the image
export async function callClaudeAPI(
  base64Image: string,
  fileType: string, 
  promptInstructions: string
): Promise<any> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptInstructions
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: getMediaType(fileType),
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Claude API error:", errorData);
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Claude API response:", data);
    
    return data;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw error;
  }
}
