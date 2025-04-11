
import { ImageOptions } from '@/components/OptionsSelector';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

// API key for Anthropic/Claude - Note: In production, this should be handled by a backend service
const CLAUDE_API_KEY = "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";

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
    
    // Fallback to simulated response if API call fails
    try {
      const response = await callClaudeAPI(base64Image, imageFile.type, options, requirements);
      return response;
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

// Call the actual Claude API with the image
async function callClaudeAPI(
  base64Image: string,
  fileType: string, 
  options: ImageOptions,
  requirements: string
): Promise<GenerateCodeResponse> {
  // Format the prompt based on the options
  const promptInstructions = createPromptInstructions(options, requirements);
  
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
    
    // Parse the response
    return parseClaudeResponse(data);
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw error;
  }
}

// Helper function to create the prompt instructions based on options
function createPromptInstructions(options: ImageOptions, requirements: string): string {
  // Extract the section type from the purpose
  const sectionType = getSectionTypeFromPurpose(options.purpose);
  
  // Replace placeholders in the template
  let prompt = customPromptTemplate
    .replace("${sectionType}", sectionType)
    .replace("${requirements}", requirements || "No specific requirements provided.");
  
  return prompt;
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

// Helper function to get the media type
function getMediaType(fileType: string): string {
  return fileType || 'image/jpeg';
}

// Helper function to parse Claude's response
function parseClaudeResponse(response: any): GenerateCodeResponse {
  try {
    // Extract the content from Claude's response
    const content = response.content[0].text;
    
    // Try to extract HTML code and schema code sections
    const htmlMatch = content.match(/<html>([\s\S]*?)<\/html>/);
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    const schemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/);
    
    if (htmlMatch && schemaMatch) {
      const htmlCode = htmlMatch[1].trim();
      const styleCode = styleMatch ? styleMatch[1].trim() : '';
      const schemaCode = schemaMatch[1].trim();
      
      return {
        code: `${htmlCode}\n\n<style>\n${styleCode}\n</style>`,
        shopifyLiquid: `{% schema %}\n${schemaCode}\n{% endschema %}`
      };
    }
    
    // Fallback to another format if the first approach fails
    const codeMatch = content.match(/```(html|liquid)([\s\S]*?)```/);
    const schemaMatchAlt = content.match(/```(json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (codeMatch && schemaMatchAlt) {
      return {
        code: codeMatch[2].trim(),
        shopifyLiquid: `{% schema %}${schemaMatchAlt[4].trim()}{% endschema %}`
      };
    }
    
    // If we can't parse it properly, throw an error
    throw new Error("Could not parse Claude response");
  } catch (error) {
    console.error("Error parsing Claude response:", error, response);
    throw new Error("Failed to parse the response from Claude. Falling back to simulated response.");
  }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
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

// The code below is the simulated response generator that we'll use as a fallback
// if the API call fails or for testing purposes

function generateSimulatedResponse(options: ImageOptions): GenerateCodeResponse {
  const { purpose } = options;
  
  // Generate different code snippets based on section type
  let htmlCode = '';
  let schemaCode = '';
  
  switch (purpose) {
    case 'product':
      htmlCode = generateProductSectionHTML();
      schemaCode = generateProductSectionSchema();
      break;
    case 'slider':
      htmlCode = generateSliderSectionHTML();
      schemaCode = generateSliderSectionSchema();
      break;
    default:
      htmlCode = `<div class="section-container">
  <!-- Default section based on image analysis -->
  <div class="section-content">
    <h2>{{ section.settings.heading }}</h2>
    <div class="image-container">
      <img src="{{ section.settings.image | img_url: 'master' }}" alt="{{ section.settings.image_alt }}" />
    </div>
  </div>
</div>`;
      schemaCode = `{
  "name": "Custom Section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Section Heading"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image alt text",
      "default": "Descriptive alt text"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#f9f9f9"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    }
  ],
  "presets": [
    {
      "name": "Custom Section",
      "category": "Custom Content"
    }
  ]
}`;
  }
  
  return {
    code: htmlCode,
    shopifyLiquid: schemaCode
  };
}

// Simplified generator functions for simulation
function generateProductSectionHTML(): string {
  return `<div class="unique-class-name-product-section">
  <div class="unique-container-product-section page-width">
    <div class="product-gallery">
      {% if section.settings.image != blank %}
        <img src="{{ section.settings.image | img_url: 'master' }}" alt="Lorem ipsum product" />
      {% endif %}
    </div>
    <div class="product-details">
      <h2>{{ section.settings.title | default: 'Lorem Ipsum Product' }}</h2>
      <div class="product-description">
        <p>{{ section.settings.description | default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id dolor id nibh ultricies vehicula ut id elit.' }}</p>
      </div>
      <div class="product-price">
        <span>{{ section.settings.price | default: '$99.99' }}</span>
      </div>
      <button class="product-button">{{ section.settings.button_text | default: 'Add to Cart' }}</button>
    </div>
  </div>
</div>

<style>
.unique-class-name-product-section {
  width: 100%;
}
.unique-container-product-section {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}
.product-gallery {
  flex: 1;
  min-width: 300px;
}
.product-gallery img {
  width: 100%;
  border-radius: 8px;
}
.product-details {
  flex: 1;
  min-width: 300px;
}
.product-price {
  font-size: 24px;
  font-weight: bold;
  margin: 15px 0;
}
.product-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>`;
}

function generateProductSectionSchema(): string {
  return `{
  "name": "Product Section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Product Title",
      "default": "Lorem Ipsum Product"
    },
    {
      "type": "richtext",
      "id": "description",
      "label": "Product Description",
      "default": "<p>Lorem ipsum dolor sit amet</p>"
    },
    {
      "type": "text",
      "id": "price",
      "label": "Product Price",
      "default": "$99.99"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Add to Cart"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Product Image"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    }
  ],
  "presets": [
    {
      "name": "Product Section",
      "category": "Products"
    }
  ]
}`;
}

function generateSliderSectionHTML(): string {
  return `<div class="unique-class-name-slideshow">
  <div class="unique-container-slideshow page-width">
    <div class="slideshow-wrapper">
      <div class="slideshow-slides">
        {% for block in section.blocks %}
          <div class="slideshow-slide">
            {% if block.settings.image != blank %}
              <img src="{{ block.settings.image | img_url: 'master' }}" alt="{{ block.settings.heading | escape }}" />
            {% endif %}
            <div class="slideshow-content">
              <h2>{{ block.settings.heading | default: 'Lorem Ipsum Slide' }}</h2>
              <p>{{ block.settings.text | default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }}</p>
              {% if block.settings.button_label != blank and block.settings.button_link != blank %}
                <a href="{{ block.settings.button_link }}" class="slideshow-button">
                  {{ block.settings.button_label }}
                </a>
              {% endif %}
            </div>
          </div>
        {% endfor %}
      </div>
      <div class="slideshow-controls">
        <button class="slideshow-prev">Previous</button>
        <button class="slideshow-next">Next</button>
      </div>
    </div>
  </div>
</div>

<style>
.unique-class-name-slideshow {
  width: 100%;
}
.slideshow-wrapper {
  position: relative;
}
.slideshow-slides {
  display: flex;
  overflow: hidden;
}
.slideshow-slide {
  flex: 0 0 100%;
  position: relative;
}
.slideshow-slide img {
  width: 100%;
  height: auto;
  display: block;
}
.slideshow-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background-color: rgba(0,0,0,0.5);
  color: white;
}
.slideshow-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.slideshow-button {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
</style>`;
}

function generateSliderSectionSchema(): string {
  return `{
  "name": "Slideshow",
  "settings": [
    {
      "type": "checkbox",
      "id": "autoplay",
      "label": "Auto-rotate slides",
      "default": true
    },
    {
      "type": "range",
      "id": "autoplay_speed",
      "min": 3,
      "max": 9,
      "step": 1,
      "unit": "s",
      "label": "Change slides every",
      "default": 5
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 40,
      "min": 0,
      "max": 100,
      "step": 4
    }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Slide",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Image"
        },
        {
          "type": "text",
          "id": "heading",
          "label": "Heading",
          "default": "Slide heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text",
          "default": "<p>Lorem ipsum dolor sit amet</p>"
        },
        {
          "type": "text",
          "id": "button_label",
          "label": "Button label",
          "default": "Button label"
        },
        {
          "type": "url",
          "id": "button_link",
          "label": "Button link"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Slideshow",
      "blocks": [
        {
          "type": "slide"
        },
        {
          "type": "slide"
        }
      ]
    }
  ]
}`;
}
