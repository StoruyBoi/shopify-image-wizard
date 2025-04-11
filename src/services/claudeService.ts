
import { ImageOptions } from '@/components/OptionsSelector';
import { callClaudeAPI, fileToBase64 } from './api/claudeApi';
import { createPromptInstructions, getCustomPrompt, setCustomPrompt } from './promptTemplate';
import { parseClaudeResponse } from './responseParser';
import { generateSimulatedResponse } from './mockResponses';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

export { getCustomPrompt, setCustomPrompt };

export async function generateCodeFromImage(
  imageFile: File,
  options: ImageOptions,
  requirements: string
): Promise<GenerateCodeResponse> {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    console.log("Sending image to Claude API...");
    console.log("Selected options:", options);
    console.log("Requirements:", requirements);
    
    // Fallback to simulated response if API call fails
    try {
      // Format the prompt based on the options
      const promptInstructions = createPromptInstructions(options, requirements);
      
      // Call the Claude API
      const response = await callClaudeAPI(base64Image, imageFile.type, promptInstructions);
      
      console.log("Claude API response received", response);
      
      // Parse the response
      const parsedResponse = parseClaudeResponse(response);
      console.log("Parsed response:", parsedResponse);
      
      return parsedResponse;
    } catch (apiError) {
      console.error("Error calling Claude API:", apiError);
      console.log("Falling back to simulated response");
      
      // Fallback to simulated response
      return generateSimulatedResponse(options);
    }
  } catch (error) {
    console.error("Error generating code from image:", error);
    throw new Error("Failed to generate code from image. Please try again.");
  }
}
