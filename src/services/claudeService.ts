
import { ImageOptions } from '@/components/OptionsSelector';
import { fileToBase64, generateShopifyCode } from './api/claudeApi';
import { generateSimulatedResponse } from './mockResponses';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

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
    
    // Generate image description based on file (for now, just the filename)
    const imageDescription = `Image filename: ${imageFile.name}`;
    
    // Fallback to simulated response if API call fails
    try {
      // Call the Claude API with the sectionType, requirements, and image description
      const response = await generateShopifyCode(
        getSectionTypeFromPurpose(options.purpose),
        requirements,
        imageDescription
      );
      
      console.log("Claude API response received");
      
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

// Helper function to convert purpose to a section type
function getSectionTypeFromPurpose(purpose: string): string {
  const sectionTypeMap: Record<string, string> = {
    'product': 'Product Section',
    'slider': 'Slideshow',
    'banner': 'Image Banner',
    'collection': 'Collection List',
    'announcement': 'Announcement Bar',
    'header': 'Header',
    'footer': 'Footer',
    'image-with-text': 'Image with Text',
    'multicolumn': 'Multi-column'
  };
  
  return sectionTypeMap[purpose] || 'Custom Section';
}

// Helper function to parse Claude's response
function parseClaudeResponse(response: string): GenerateCodeResponse {
  try {
    if (!response) {
      throw new Error("Empty response from Claude API");
    }
    
    // Try to extract HTML code and schema code sections using different patterns
    // First try the explicit HTML and schema tags
    const htmlMatch = response.match(/<html>([\s\S]*?)<\/html>/i);
    const styleMatch = response.match(/<style>([\s\S]*?)<\/style>/i);
    const schemaMatch = response.match(/{% schema %}([\s\S]*?){% endschema %}/i);
    
    if (htmlMatch) {
      const htmlCode = htmlMatch[1].trim();
      const styleCode = styleMatch ? styleMatch[1].trim() : '';
      const schemaCode = schemaMatch ? schemaMatch[1].trim() : '';
      
      return {
        code: styleCode ? `${htmlCode}\n\n<style>\n${styleCode}\n</style>` : htmlCode,
        shopifyLiquid: schemaCode ? `{% schema %}\n${schemaCode}\n{% endschema %}` : ''
      };
    }
    
    // Fallback to code blocks format
    const codeMatches = response.match(/```(?:html|liquid)([\s\S]*?)```/g);
    const schemaMatchAlt = response.match(/```(?:json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (codeMatches && codeMatches.length > 0) {
      // Extract HTML/CSS from first code block
      const htmlContent = codeMatches[0].replace(/```(?:html|liquid)/g, '').replace(/```/g, '').trim();
      
      // Try to find schema in content or in another code block
      let schemaContent = '';
      if (schemaMatchAlt && schemaMatchAlt[3]) {
        schemaContent = schemaMatchAlt[3].trim();
      } else {
        // Look for schema in the content directly
        const directSchemaMatch = response.match(/{% schema %}([\s\S]*?){% endschema %}/);
        if (directSchemaMatch) {
          schemaContent = directSchemaMatch[1].trim();
        }
      }
      
      return {
        code: htmlContent,
        shopifyLiquid: schemaContent ? `{% schema %}\n${schemaContent}\n{% endschema %}` : ''
      };
    }
    
    // Last fallback: Just return the content as is
    console.log("Using fallback response parsing");
    
    return {
      code: response,
      shopifyLiquid: ''
    };
  } catch (error) {
    console.error("Error parsing Claude response:", error);
    throw new Error("Failed to parse the response from Claude. Falling back to simulated response.");
  }
}
