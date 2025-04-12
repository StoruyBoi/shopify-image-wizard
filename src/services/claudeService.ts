
import { ImageOptions } from '@/components/OptionsSelector';
import { fileToBase64, generateShopifyCode } from './api/claudeApi';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

<<<<<<< HEAD
// API key for Anthropic/Claude - Note: In production, this should be handled by a backend service
const CLAUDE_API_KEY = "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";

// Store your custom prompt template
let customPromptTemplate = `
 You are a Shopify theme developer tasked with creating a new section for a theme. Follow these instructions to create the section based on the given requirements:

1. General Guidelines:
   - Use unique class names for each section to avoid CSS conflicts.
   - All text should be placeholder content (e.g., Lorem Ipsum).
   - Follow the main structure provided below for all sections.
     -Invalid schema: setting with id="slides_per_view_mobile" step invalid. Range settings must have at least 3 steps
    {System Prompt
Set a system prompt (optional)
Drop here to insert into user message
Max 100 files at 5MB each
User
      "min": 1,
      "max": 3,
    }
2. Create a Shopify section of type: <section_type>{{SECTION_TYPE}}</section_type>

3. Implement the following specific requirements:
<specific_requirements>
{{SPECIFIC_REQUIREMENTS}}
</specific_requirements>

4. Use this base structure for the section:

<section class="unique-class-name-{{SECTION_TYPE}}" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-{{SECTION_TYPE}} page-width">
    <!-- Section content goes here -->
  </div>
</section>

5. Schema Structure:
   - Include settings for background color, padding top, and padding bottom.
   - Add any additional settings required for the specific section type.
   - Ensure the schema name does not exceed 25 characters.
   - Do not use "default" values for videos.

6. For images, use this structure:
<img src="{{ section.settings.image | img_url: 'master'}}" alt="Image description" />

7. For videos, use this structure:
{% if section.settings.video != blank %}
  <video src="{{ section.settings.video.sources[1].url }}" loop muted playsinline autoplay style="width: 100%; display: block; border-radius: 10px;"></video>
{% endif %}

8. CSS Guidelines:
   - Use the parent CSS class for styling consistency.
   - Create styles specific to the section type.

9. Output your response in the following structure:
   <html>
   <!-- HTML code for the section -->
   </html>

   <style>
   /* CSS code for the section */
   </style>

   {% schema %}
   // JSON schema for the section
   {% endschema %}

Remember to use unique class names throughout the section to avoid conflicts with other sections. Ensure all text content is placeholder text (Lorem Ipsum). Your final output should only include the HTML, CSS, and schema code for the section, without any additional explanations or notes.
 
`;

export function setCustomPrompt(prompt: string) {
  if (prompt && prompt.trim()) {
    customPromptTemplate = prompt;
    console.log("Custom prompt template set successfully");
    return true;
  }
  return false;
}

export function getCustomPrompt(): string {
  return customPromptTemplate;
}

=======
>>>>>>> 9c975e400d8920c5e6b36f030905d2dcc953c76f
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
    
    // Call the Claude API with the sectionType, requirements, and image description
    const response = await generateShopifyCode(
      getSectionTypeFromPurpose(options.purpose, options.customType),
      requirements,
      imageDescription
    );
    
    console.log("Claude API response received");
    
    // Parse the response
    const parsedResponse = parseClaudeResponse(response);
    console.log("Parsed response:", parsedResponse);
    
    return parsedResponse;
  } catch (error) {
    console.error("Error generating code from image:", error);
    throw new Error("Failed to generate code from image. Please try again.");
  }
}

// Helper function to convert purpose to a section type
function getSectionTypeFromPurpose(purpose: string, customType?: string): string {
  if (purpose === 'custom' && customType) {
    return customType;
  }
  
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
    throw new Error("Failed to parse the response from Claude.");
  }
}
