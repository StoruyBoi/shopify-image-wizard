
import { ImageOptions } from '@/components/OptionsSelector';

// Store your custom prompt template
let customPromptTemplate = `You are a Shopify theme developer tasked with creating a new section for a theme. Follow these instructions to create the section based on the given requirements:

1. General Guidelines:
   - Use unique class names for each section to avoid CSS conflicts.
   - All text should be placeholder content (e.g., Lorem Ipsum).
   - Follow the main structure provided below for all sections.

2. Create a Shopify section of type: \${sectionType}

3. Implement the following specific requirements:
\${requirements}

4. Use this base structure for the section:

<section class="unique-class-name-\${sectionType.toLowerCase().replace(/\\s/g, '-')}" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-\${sectionType.toLowerCase().replace(/\\s/g, '-')} page-width">
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

Remember to use unique class names throughout the section to avoid conflicts with other sections. Ensure all text content is placeholder text (Lorem Ipsum). Your final output should only include the HTML, CSS, and schema code for the section, without any additional explanations or notes.`;

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

// Helper function to create the prompt instructions based on options
export function createPromptInstructions(options: ImageOptions, requirements: string): string {
  // Extract the section type from the purpose
  const sectionType = getSectionTypeFromPurpose(options.purpose);
  
  // Replace placeholders in the template
  let prompt = customPromptTemplate
    .replace("${sectionType}", sectionType)
    .replace("${requirements}", requirements || "No specific requirements provided.");
  
  return prompt;
}

// Helper function to convert purpose to a section type
export function getSectionTypeFromPurpose(purpose: string): string {
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
