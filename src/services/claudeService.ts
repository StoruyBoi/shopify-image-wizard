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
  additionalDetails: any
): Promise<GenerateCodeResponse> {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    console.log("Sending image to Claude API...");
    console.log("Selected options:", options);
    
    // Fallback to simulated response if API call fails
    try {
      const response = await callClaudeAPI(base64Image, imageFile.type, options, additionalDetails);
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
  additionalDetails: any
): Promise<GenerateCodeResponse> {
  // Format the prompt based on the options
  const promptInstructions = createPromptInstructions(options, additionalDetails);
  
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
function createPromptInstructions(options: ImageOptions, additionalDetails: any): string {
  const { purpose } = options;
  
  // Extract requirements from additionalDetails
  const requirements = additionalDetails.description || 
                      additionalDetails.title || 
                      "No specific requirements provided.";
  
  // Replace placeholders in the template
  let prompt = customPromptTemplate
    .replace("${sectionType}", purpose)
    .replace("${requirements}", requirements);
  
  return prompt;
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
    
    // Extract HTML part
    const htmlMatch = content.match(/<html>([\s\S]*?)<\/html>/);
    const htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
    
    // Extract schema part
    const schemaMatch = content.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
    const schemaCode = schemaMatch ? `{% schema %}${schemaMatch[1].trim()}{% endschema %}` : '';
    
    // Extract CSS part (to be included with HTML)
    const cssMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    const cssCode = cssMatch ? `<style>${cssMatch[1].trim()}</style>` : '';
    
    // Combine HTML and CSS for the complete code
    const completeCode = htmlCode + (cssCode ? '\n\n' + cssCode : '');
    
    if (completeCode && schemaCode) {
      return {
        code: completeCode,
        shopifyLiquid: schemaCode
      };
    }
    
    // If we can't parse using the structured format, try to find any HTML/liquid and schema parts
    const fallbackHtmlMatch = content.match(/```(html|liquid)([\s\S]*?)```/);
    const fallbackSchemaMatch = content.match(/```(json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (fallbackHtmlMatch && fallbackSchemaMatch) {
      return {
        code: fallbackHtmlMatch[2].trim(),
        shopifyLiquid: `{% schema %}${fallbackSchemaMatch[4].trim()}{% endschema %}`
      };
    }
    
    // If still nothing, just try to extract any code blocks
    const codeBlocks = content.match(/```([\s\S]*?)```/g);
    if (codeBlocks && codeBlocks.length >= 2) {
      // Assume first block is HTML/Liquid, second is schema
      const htmlBlock = codeBlocks[0].replace(/```(html|liquid)?/g, '').trim();
      const schemaBlock = codeBlocks[1].includes('schema') ? 
                          codeBlocks[1].replace(/```(json|liquid)?/g, '').trim() :
                          `{% schema %}\n${codeBlocks[1].replace(/```(json|liquid)?/g, '').trim()}\n{% endschema %}`;
      
      return {
        code: htmlBlock,
        shopifyLiquid: schemaBlock
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

// The code below is the simulated response generator

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
    case 'banner':
      htmlCode = generateBannerSectionHTML();
      schemaCode = generateBannerSectionSchema();
      break;
    case 'collection':
      htmlCode = generateCollectionSectionHTML();
      schemaCode = generateCollectionSectionSchema();
      break;
    case 'announcement':
      htmlCode = generateAnnouncementHTML();
      schemaCode = generateAnnouncementSchema();
      break;
    case 'header':
      htmlCode = generateHeaderHTML();
      schemaCode = generateHeaderSchema();
      break;
    case 'footer':
      htmlCode = generateFooterHTML();
      schemaCode = generateFooterSchema();
      break;
    case 'image-with-text':
      htmlCode = generateImageWithTextHTML();
      schemaCode = generateImageWithTextSchema();
      break;
    case 'multicolumn':
      htmlCode = generateMulticolumnHTML();
      schemaCode = generateMulticolumnSchema();
      break;
    default:
      htmlCode = `<section class="unique-class-name-default" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-default page-width">
    <h2>{{ section.settings.heading }}</h2>
    <div class="image-container">
      <img src="{{ section.settings.image | img_url: 'master' }}" alt="{{ section.settings.image_alt }}" />
    </div>
  </div>
</section>`;
      schemaCode = `{% schema %}
{
  "name": "Custom Section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image alt text"
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
      "default": 50,
      "min": 0,
      "max": 200,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 200,
      "step": 10
    }
  ],
  "presets": [
    {
      "name": "Custom Section",
      "category": "Custom Content"
    }
  ]
}
{% endschema %}`;
  }
  
  return {
    code: htmlCode,
    shopifyLiquid: schemaCode
  };
}

// Generator functions for simulated responses
function generateProductSectionHTML(): string {
  return `<section class="unique-class-name-product" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-product page-width">
    <div class="product-gallery">
      {% for image in product.images limit: 5 %}
        <div class="product-image{% if forloop.first %} active{% endif %}">
          <img src="{{ image | img_url: 'large' }}" alt="{{ product.title | escape }}" loading="lazy" />
        </div>
      {% endfor %}
    </div>
    
    <div class="product-details">
      <h1 class="product-title">{{ product.title }}</h1>
      
      <div class="product-price">
        {% if product.compare_at_price > product.price %}
          <span class="regular-price">{{ product.compare_at_price | money }}</span>
          <span class="sale-price">{{ product.price | money }}</span>
        {% else %}
          <span class="regular-price">{{ product.price | money }}</span>
        {% endif %}
      </div>
      
      <div class="product-description">
        {{ product.description }}
      </div>
      
      <div class="product-form">
        {% form 'product', product %}
          <!-- Variant selector -->
          <select name="id">
            {% for variant in product.variants %}
              <option value="{{ variant.id }}">{{ variant.title }}</option>
            {% endfor %}
          </select>
          
          <!-- Quantity selector -->
          <div class="quantity-selector">
            <button type="button" class="quantity-decrease">-</button>
            <input type="number" name="quantity" value="1" min="1" />
            <button type="button" class="quantity-increase">+</button>
          </div>
          
          <!-- Add to cart button -->
          <button type="submit" class="add-to-cart-button">Add to Cart</button>
        {% endform %}
      </div>
    </div>
  </div>
</section>

<style>
.unique-class-name-product {
  background-color: #ffffff;
}

.unique-container-product {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.product-gallery {
  flex: 1;
  min-width: 300px;
}

.product-image {
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  display: block;
}

.product-details {
  flex: 1;
  min-width: 300px;
}

.product-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.product-price {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.regular-price {
  font-weight: bold;
}

.sale-price {
  color: #ff4d4d;
  margin-left: 0.5rem;
}

.product-description {
  margin-bottom: 2rem;
}

.product-form select,
.product-form .quantity-selector {
  margin-bottom: 1rem;
  width: 100%;
  padding: 0.5rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
}

.quantity-selector button {
  width: 2rem;
  height: 2rem;
  background: #f1f1f1;
  border: none;
  cursor: pointer;
}

.quantity-selector input {
  flex: 1;
  text-align: center;
  border: 1px solid #ddd;
  height: 2rem;
}

.add-to-cart-button {
  width: 100%;
  padding: 1rem;
  background: #4a4a4a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.add-to-cart-button:hover {
  background: #333;
}

@media (max-width: 768px) {
  .unique-container-product {
    flex-direction: column;
  }
}
</style>`;
}

function generateProductSectionSchema(): string {
  return `{% schema %}
{
  "name": "Product Section",
  "settings": [
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
      "default": 50,
      "min": 0,
      "max": 200,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 200,
      "step": 10
    },
    {
      "type": "select",
      "id": "gallery_layout",
      "label": "Gallery layout",
      "options": [
        {
          "value": "stacked",
          "label": "Stacked"
        },
        {
          "value": "thumbnail",
          "label": "Thumbnail"
        },
        {
          "value": "grid",
          "label": "Grid"
        }
      ],
      "default": "thumbnail"
    }
  ],
  "presets": [
    {
      "name": "Product Section",
      "category": "Product"
    }
  ]
}
{% endschema %}`;
}

function generateSliderSectionHTML(): string {
  return `<section class="unique-class-name-slider" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-slider page-width">
    <div class="slideshow" id="section-{{ section.id }}">
      {% for block in section.blocks %}
        <div class="slide">
          {% if block.settings.image != blank %}
            <img 
              src="{{ block.settings.image | img_url: 'master' }}" 
              alt="{{ block.settings.image_alt | escape }}"
              loading="lazy"
            />
          {% else %}
            <div class="placeholder-image">{{ 'image' | placeholder_svg_tag }}</div>
          {% endif %}
          
          {% if block.settings.show_overlay %}
            <div class="slide-overlay">
              {% if block.settings.heading != blank %}
                <h2 class="slide-heading">{{ block.settings.heading }}</h2>
              {% endif %}
              
              {% if block.settings.text != blank %}
                <div class="slide-text">{{ block.settings.text }}</div>
              {% endif %}
              
              {% if block.settings.button_label != blank and block.settings.button_link != blank %}
                <a href="{{ block.settings.button_link }}" class="slide-button">
                  {{ block.settings.button_label }}
                </a>
              {% endif %}
            </div>
          {% endif %}
        </div>
      {% endfor %}
    </div>
    
    {% if section.settings.show_dots %}
      <div class="slideshow-dots">
        {% for block in section.blocks %}
          <button class="dot" data-slide="{{ forloop.index0 }}"></button>
        {% endfor %}
      </div>
    {% endif %}
    
    {% if section.settings.show_arrows %}
      <button class="slideshow-arrow slideshow-arrow-prev">
        {% render 'icon-chevron-left' %}
      </button>
      <button class="slideshow-arrow slideshow-arrow-next">
        {% render 'icon-chevron-right' %}
      </button>
    {% endif %}
  </div>
</section>

<style>
.unique-class-name-slider {
  position: relative;
  overflow: hidden;
}

.unique-container-slider {
  position: relative;
}

.slideshow {
  position: relative;
  overflow: hidden;
}

.slide {
  position: relative;
  display: none;
}

.slide:first-child {
  display: block;
}

.slide img {
  width: 100%;
  display: block;
  height: auto;
}

.placeholder-image {
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background-color: #f0f0f0;
  position: relative;
}

.placeholder-image svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.slide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
}

.slide-heading {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.slide-text {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  max-width: 600px;
}

.slide-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: white;
  color: black;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s, color 0.3s;
}

.slide-button:hover {
  background-color: #f0f0f0;
}

.slideshow-dots {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
}

.dot.active {
  background-color: white;
}

.slideshow-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slideshow-arrow-prev {
  left: 1rem;
}

.slideshow-arrow-next {
  right: 1rem;
}

@media (max-width: 768px) {
  .slide-heading {
    font-size: 1.5rem;
  }
  
  .slide-text {
    font-size: 1rem;
  }
}
</style>`;
}

function generateSliderSectionSchema(): string {
  return `{% schema %}
{
  "name": "Slideshow",
  "settings": [
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
      "default": 0,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 0,
      "min": 0,
      "max": 100,
      "step": 10
    },
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
      "type": "checkbox",
      "id": "show_arrows",
      "label": "Show arrow navigation",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_dots",
      "label": "Show dot navigation",
      "default": true
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
          "id": "image_alt",
          "label": "Image alt text"
        },
        {
          "type": "checkbox",
          "id": "show_overlay",
          "label": "Show overlay content",
          "default": true
        },
        {
          "type": "text",
          "id": "heading",
          "label": "Heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text"
        },
        {
          "type": "text",
          "id": "button_label",
          "label": "Button label"
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
}
{% endschema %}`;
}

function generateBannerSectionHTML(): string {
  return `<section class="unique-class-name-banner" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-banner page-width">
    <div class="banner-container">
      {% if section.settings.image != blank %}
        <img 
          src="{{ section.settings.image | img_url: 'master' }}" 
          alt="{{ section.settings.image_alt | escape }}"
          loading="lazy"
          class="banner-image"
        />
      {% else %}
        <div class="placeholder-image">{{ 'image' | placeholder_svg_tag }}</div>
      {% endif %}
      
      {% if section.settings.show_overlay %}
        <div class="banner-overlay" style="background-color: {{ section.settings.overlay_color }}; opacity: {{ section.settings.overlay_opacity | divided_by: 100.0 }};">
          <div class="banner-content">
            {% if section.settings.heading != blank %}
              <h2 class="banner-heading">{{ section.settings.heading }}</h2>
            {% endif %}
            
            {% if section.settings.text != blank %}
              <div class="banner-text">{{ section.settings.text }}</div>
            {% endif %}
            
            {% if section.settings.button_label != blank %}
              <a href="{{ section.settings.button_link }}" class="banner-button">
                {{ section.settings.button_label }}
              </a>
            {% endif %}
          </div>
        </div>
      {% endif %}
    </div>
  </div>
</section>

<style>
.unique-class-name-banner {
  position: relative;
}

.banner-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.banner-image {
  width: 100%;
  display: block;
}

.placeholder-image {
  width: 100%;
  padding-top: 40%;
  background-color: #f0f0f0;
  position: relative;
}

.placeholder-image svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-content {
  text-align: center;
  color: white;
  padding: 2rem;
  max-width: 800px;
}

.banner-heading {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.banner-text {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.banner-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: white;
  color: black;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s, color 0.3s;
}

.banner-button:hover {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .banner-heading {
    font-size: 1.8rem;
  }
  
  .banner-text {
    font-size: 1rem;
  }
}
</style>`;
}

function generateBannerSectionSchema(): string {
  return `{% schema %}
{
  "name": "Image Banner",
  "settings": [
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
      "default": 20,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 20,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image alt text"
    },
    {
      "type": "checkbox",
      "id": "show_overlay",
      "label": "Show overlay",
      "default": true
    },
    {
      "type": "color",
      "id": "overlay_color",
      "label": "Overlay color",
      "default": "#000000"
    },
    {
      "type": "range",
      "id": "overlay_opacity",
      "min": 0,
      "max": 100,
      "step": 5,
      "unit": "%",
      "label": "Overlay opacity",
      "default": 30
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading"
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    }
  ],
  "presets": [
    {
      "name": "Image Banner",
      "category": "Image"
    }
  ]
}
{% endschema %}`;
}

function generateCollectionSectionHTML(): string {
  return `<section class="unique-class-name-collection" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-collection page-width">
    <div class="collection-header">
      <h2 class="collection-title">{{ section.settings.title | escape }}</h2>
      
      {% if section.settings.description != blank %}
        <div class="collection-description">{{ section.settings.description }}</div>
      {% endif %}
    </div>
    
    <div class="collection-grid" style="grid-template-columns: repeat({{ section.settings.columns_desktop }}, 1fr);">
      {% for product in collections[section.settings.collection].products limit: section.settings.products_to_show %}
        <div class="collection-item">
          <a href="{{ product.url | within: collection }}" class="collection-item-link">
            <div class="collection-item-image">
              {% if product.featured_image != blank %}
                <img 
                  src="{{ product.featured_image | img_url: 'medium' }}" 
                  alt="{{ product.featured_image.alt | escape }}"
                  loading="lazy"
                />
              {% else %}
                {{ 'product-1' | placeholder_svg_tag: 'placeholder-image' }}
              {% endif %}
            </div>
            
            <div class="collection-item-info">
              <h3 class="collection-item-title">{{ product.title | escape }}</h3>
              
              <div class="collection-item-price">
                {% if product.compare_at_price > product.price %}
                  <span class="price-sale">{{ product.price | money }}</span>
                  <span class="price-compare">{{ product.compare_at_price | money }}</span>
                {% else %}
                  <span class="price-regular">{{ product.price | money }}</span>
                {% endif %}
              </div>
            </div>
          </a>
        </div>
      {% endfor %}
    </div>
    
    {% if section.settings.show_view_all and section.settings.collection != blank %}
      <div class="collection-footer">
        <a href="{{ collections[section.settings.collection].url }}" class="view-all-button">
          {{ section.settings.view_all_text }}
        </a>
      </div>
    {% endif %}
  </div>
</section>

<style>
.unique-class-name-collection {
  background-color: #ffffff;
}

.collection-header {
  text-align: center;
  margin-bottom: 2rem;
}

.collection-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.collection-description {
  max-width: 700px;
  margin: 0 auto;
  color: #666;
}

.collection-grid {
  display: grid;
  gap: 1.5rem;
}

.collection-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.collection-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.collection-item-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.collection-item-image {
  position: relative;
  padding-top: 100%; /* 1:1 aspect ratio */
  overflow: hidden;
}

.collection-item-image img,
.collection-item-image .placeholder-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-item-info {
  padding: 1rem;
}

.collection-item-title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.collection-item-price {
  font-size: 0.9rem;
}

.price-regular,
.price-sale {
  font-weight: bold;
}

.price-sale {
  color: #e53e3e;
}

.price-compare {
  text-decoration: line-through;
  color: #888;
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.collection-footer {
  margin-top: 2rem;
  text-align: center;
}

.view-all-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.view-all-button:hover {
  background-color: #e0e0e0;
}

@media (max-width: 768px) {
  .collection-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .collection-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>`;
}

function generateCollectionSectionSchema(): string {
  return `{% schema %}
{
  "name": "Collection List",
  "settings": [
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
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Featured Collection"
    },
    {
      "type": "richtext",
      "id": "description",
      "label": "Description"
    },
    {
      "type": "collection",
      "id": "collection",
      "label": "Collection"
    },
    {
      "type": "range",
      "id": "products_to_show",
      "min": 2,
      "max": 12,
      "step": 1,
      "default": 4,
      "label": "Products to show"
    },
    {
      "type": "range",
      "id": "columns_desktop",
      "min": 1,
      "max": 5,
      "step": 1,
      "default": 4,
      "label": "Number of columns on desktop"
    },
    {
      "type": "checkbox",
      "id": "show_price",
      "label": "Show price",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_view_all",
      "label": "Show 'View all' button",
      "default": true
    },
    {
      "type": "text",
      "id": "view_all_text",
      "label": "View all button text",
      "default": "View all"
    }
  ],
  "presets": [
    {
      "name": "Collection List",
      "category": "Collection"
    }
  ]
}
{% endschema %}`;
}

function generateAnnouncementHTML(): string {
  return `<section class="unique-class-name-announcement" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-announcement page-width">
    <div class="announcement-bar" style="background-color: {{ section.settings.color_background }};">
      <div class="announcement-bar__content">
        {% if section.settings.text != blank %}
          {% if section.settings.link != blank %}
            <a href="{{ section.settings.link }}" class="announcement-bar__link">
              <p class="announcement-bar__message" style="color: {{ section.settings.color_text }};">
                {{ section.settings.text | escape }}
              </p>
            </a>
          {% else %}
            <p class="announcement-bar__message" style="color: {{ section.settings.color_text }};">
              {{ section.settings.text | escape }}
            </p>
          {% endif %}
        {% endif %}
      </div>
    </div>
  </div>
</section>

<style>
.unique-class-name-announcement {
  position: relative;
}

.announcement-bar {
  text-align: center;
  padding: 10px 0;
}

.announcement-bar__content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.announcement-bar__message {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.announcement-bar__link {
  text-decoration: none;
  display: block;
  width: 100%;
}

@media screen and (max-width: 768px) {
  .announcement-bar__message {
    font-size: 0.8rem;
  }
}
</style>`;
}

function generateAnnouncementSchema(): string {
  return `{% schema %}
{
  "name": "Announcement Bar",
  "settings": [
    {
      "type": "color",
      "id": "background_color",
      "label": "Section Background",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "default": 0,
      "min": 0,
      "max": 50,
      "step": 5
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 0,
      "min": 0,
      "max": 50,
      "step": 5
    },
    {
      "type": "text",
      "id": "text",
      "label": "Text",
      "default": "Announce something here"
    },
    {
      "type": "url",
      "id": "link",
      "label": "Link"
    },
    {
      "type": "color",
      "id": "color_background",
      "label": "Bar Background",
      "default": "#000000"
    },
    {
      "type": "color",
      "id": "color_text",
      "label": "Text Color",
      "default": "#FFFFFF"
    }
  ],
  "presets": [
    {
      "name": "Announcement Bar",
      "category": "Promotional"
    }
  ]
}
{% endschema %}`;
}

function generateHeaderHTML(): string {
  return `<section class="unique-class-name-header" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-header page-width">
    <div class="header" data-section-id="{{ section.id }}" data-section-type="header-section">
      <div class="header-wrapper">
        <div class="header-left">
          {% if section.settings.logo != blank %}
            <a href="/" class="header-logo-link">
              <img 
                src="{{ section.settings.logo | img_url: 'medium' }}" 
                alt="{{ section.settings.logo.alt | default: shop.name | escape }}"
                class="header-logo"
                width="{{ section.settings.logo_max_width }}"
              >
            </a>
          {% else %}
            <a href="/" class="header-shop-name">{{ shop.name }}</a>
          {% endif %}
        </div>

        <div class="header-center">
          <nav class="header-navigation" role="navigation">
            <ul class="header-menu">
              {% for link in section.settings.menu.links %}
                <li class="header-menu-item">
                  <a href="{{ link.url }}" class="header-menu-link">
                    {{ link.title }}
                  </a>
                  {% if link.links != blank %}
                    <ul class="header-submenu">
                      {% for child_link in link.links %}
                        <li class="header-submenu-item">
                          <a href="{{ child_link.url }}" class="header-submenu-link">
                            {{ child_link.title }}
                          </a>
                        </li>
                      {% endfor %}
                    </ul>
                  {% endif %}
                </li>
              {% endfor %}
            </ul>
          </nav>
        </div>

        <div class="header-right">
          {% if shop.customer_accounts_enabled %}
            <a href="{{ routes.account_url }}" class="header-account-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 18C16 15.7909 13.3137 14 10 14C6.68629 14 4 15.7909 4 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          {% endif %}
          
          <a href="{{ routes.search_url }}" class="header-search-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 19L14.65 14.65" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          
          <a href="{{ routes.cart_url }}" class="header-cart-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 1L1 5V17C1 17.5304 1.21071 18.0391 1.58579 18.4142C1.96086 18.7893 2.46957 19 3 19H17C17.5304 19 18.0391 18.7893 18.4142 18.4142C18.7893 18.0391 19 17.5304 19 17V5L15 1H5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 5H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 9C14 10.0609 13.5786 11.0783 12.8284 11.8284C12.0783 12.5786 11.0609 13 10 13C8.93913 13 7.92172 12.5786 7.17157 11.8284C6.42143 11.0783 6 10.0609 6 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="header-cart-count">{{ cart.item_count }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
.unique-class-name-header {
  position: relative;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
}

.header-left {
  flex: 1;
}

.header-logo-link {
  display: block;
}

.header-logo {
  max-height: 50px;
  width: auto;
}

.header-shop-name {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: inherit;
}

.header-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.header-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;
}

.header-menu-item {
  position: relative;
}

.header-menu-link {
  text-decoration: none;
  color: inherit;
  font-weight: 500;
  padding: 0.5rem 0;
  display: block;
}

.header-submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 0.5rem 0;
  list-style: none;
  display: none;
  z-index: 10;
}

.header-menu-item:hover .header-submenu {
  display: block;
}

.header-submenu-link {
  padding: 0.5rem 1rem;
  display: block;
  text-decoration: none;
  color: inherit;
}

.header-submenu-link:hover {
  background-color: #f5f5f5;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.header-account-link,
.header-search-link,
.header-cart-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  text-decoration: none;
  color: inherit;
  position: relative;
}

.header-account-link:hover,
.header-search-link:hover,
.header-cart-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.header-cart-count {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e53e3e;
  color: white;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

@media (max-width: 768px) {
  .header-center {
    display: none;
  }
  
  .header-right {
    gap: 0.5rem;
  }
}
</style>`;
}

function generateHeaderSchema(): string {
  return `{% schema %}
{
  "name": "Header",
  "settings": [
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
      "default": 0,
      "min": 0,
      "max": 50,
      "step": 5
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 0,
      "min": 0,
      "max": 50,
      "step": 5
    },
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo image"
    },
    {
      "type": "range",
      "id": "logo_max_width",
      "min": 50,
      "max": 250,
      "step": 10,
      "default": 100,
      "unit": "px",
      "label": "Logo max width"
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "Menu",
      "default": "main-menu"
    },
    {
      "type": "checkbox",
      "id": "show_announcement",
      "label": "Show announcement",
      "default": false
    },
    {
      "type": "text",
      "id": "announcement_text",
      "label": "Announcement text"
    }
  ]
}
{% endschema %}`;
}

function generateFooterHTML(): string {
  return `<section class="unique-class-name-footer" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-footer page-width">
    <footer class="footer" data-section-id="{{ section.id }}" data-section-type="footer-section">
      <div class="footer-wrapper">
        <div class="footer-top">
          {% if section.settings.show_newsletter %}
            <div class="footer-newsletter">
              <h3 class="footer-block-title">{{ section.settings.newsletter_title }}</h3>
              {% if section.settings.newsletter_text != blank %}
                <p class="footer-text">{{ section.settings.newsletter_text }}</p>
              {% endif %}
              
              {% form 'customer', id: 'ContactFooter' %}
                {% if form.posted_successfully? %}
                  <p class="form-success">{{ 'general.newsletter_form.confirmation' | t }}</p>
                {% endif %}
                <input type="hidden" name="contact[tags]" value="newsletter">
                <div class="footer-newsletter-form">
                  <input
                    type="email"
                    name="contact[email]"
                    id="NewsletterForm--{{ section.id }}"
                    class="footer-newsletter-input"
                    value="{{ form.email }}"
                    placeholder="{{ 'general.newsletter_form.email_placeholder' | t }}"
                    required
                  >
                  <button type="submit" class="footer-newsletter-submit">
                    {{ section.settings.newsletter_button_text }}
                  </button>
                </div>
              {% endform %}
            </div>
          {% endif %}
        </div>
        
        <div class="footer-links">
          {% for block in section.blocks %}
            {% case block.type %}
              {% when 'link_list' %}
                <div class="footer-block footer-block--menu">
                  {% if block.settings.title != blank %}
                    <h3 class="footer-block-title">{{ block.settings.title }}</h3>
                  {% endif %}
                  
                  {% if block.settings.menu != blank %}
                    <ul class="footer-menu">
                      {% for link in block.settings.menu.links %}
                        <li class="footer-menu-item">
                          <a href="{{ link.url }}" class="footer-link">{{ link.title }}</a>
                        </li>
                      {% endfor %}
                    </ul>
                  {% endif %}
                </div>
              {% when 'text' %}
                <div class="footer-block footer-block--text">
                  {% if block.settings.title != blank %}
                    <h3 class="footer-block-title">{{ block.settings.title }}</h3>
                  {% endif %}
                  
                  {% if block.settings.text != blank %}
                    <div class="footer-text">{{ block.settings.text }}</div>
                  {% endif %}
                </div>
            {% endcase %}
          {% endfor %}
        </div>
        
        <div class="footer-bottom">
          {% if section.settings.show_social %}
            <div class="footer-social">
              {%- if settings.social_twitter_link != blank -%}
                <a href="{{ settings.social_twitter_link }}" class="footer-social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 4.01C21 4.5 20.02 4.69 19 5C17.879 3.735 16.217 3.665 14.62 4.263C13.023 4.861 11.977 6.323 12 8.01V9.01C8.755 9.083 5.865 7.605 4 5.01C4 5.01 -0.182 12.946 8 16.01C6.128 17.247 4.261 18.088 2 18.01C5.308 19.687 8.913 20.322 12.034 19.503C15.614 18.565 18.556 15.906 19.685 11.952C20.0218 10.6867 20.189 9.3763 20.182 8.062C20.18 7.774 22 4.01 22 4.01Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              {%- endif -%}
              {%- if settings.social_facebook_link != blank -%}
                <a href="{{ settings.social_facebook_link }}" class="footer-social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              {%- endif -%}
              {%- if settings.social_instagram_link != blank -%}
                <a href="{{ settings.social_instagram_link }}" class="footer-social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80976 15.3801 9.21484 14.7852C8.61991 14.1902 8.22773 13.4229 8.09406 12.5922C7.9604 11.7615 8.09206 10.9099 8.47032 10.1584C8.84858 9.40685 9.45418 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87659 12.63 8C13.4789 8.12588 14.2648 8.52146 14.8717 9.12831C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17.5 6.5H17.51" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              {%- endif -%}
            </div>
          {% endif %}
          
          <div class="footer-copyright">
            <span>&copy; {{ 'now' | date: '%Y' }} {{ shop.name }}</span>
            <span>{{ section.settings.copyright_text }}</span>
          </div>
          
          {% if section.settings.show_payment_icons %}
            <div class="footer-payment">
              {% for type in shop.enabled_payment_types %}
                {{ type | payment_type_svg_tag: class: 'payment-icon' }}
              {% endfor %}
            </div>
          {% endif %}
        </div>
      </div>
    </footer>
  </div>
</section>

<style>
.unique-class-name-footer {
  background-color: #f5f5f5;
  color: #333;
}

.footer-wrapper {
  padding: 2rem 0;
}

.footer-top {
  margin-bottom: 2rem;
}

.footer-newsletter {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.footer-block-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.footer-text {
  margin-bottom: 1rem;
  color: #666;
}

.footer-newsletter-form {
  display: flex;
  gap: 0.5rem;
}

.footer-newsletter-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.footer-newsletter-submit {
  padding: 0.75rem 1.5rem;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.footer-newsletter-submit:hover {
  background-color: #444;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-block {
  min-width: 0;
}

.footer-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-menu-item {
  margin-bottom: 0.5rem;
}

.footer-link {
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #333;
}

.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
  gap: 1rem;
}

.footer-social {
  display: flex;
  gap: 1rem;
}

.footer-social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #eee;
  color: #333;
  transition: background-color 0.3s, color 0.3s;
}

.footer-social-link:hover {
  background-color: #333;
  color: white;
}

.footer-copyright {
  color: #666;
  font-size: 0.9rem;
}

.footer-payment {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.payment-icon {
  height: 24px;
  width: auto;
}

@media (max-width: 768px) {
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .footer-newsletter-form {
    flex-direction: column;
  }
  
  .footer-newsletter-submit {
    width: 100%;
  }
}
</style>`;
}

function generateFooterSchema(): string {
  return `{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#f5f5f5"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "checkbox",
      "id": "show_newsletter",
      "label": "Show newsletter",
      "default": true
    },
    {
      "type": "text",
      "id": "newsletter_title",
      "label": "Newsletter title"
    },
    {
      "type": "richtext",
      "id": "newsletter_text",
      "label": "Newsletter text"
    },
    {
      "type": "text",
      "id": "newsletter_button_text",
      "label": "Button text"
    },
    {
      "type": "checkbox",
      "id": "show_social",
      "label": "Show social icons",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_payment_icons",
      "label": "Show payment icons",
      "default": true
    },
    {
      "type": "text",
      "id": "copyright_text",
      "label": "Copyright text"
    }
  ],
  "blocks": [
    {
      "type": "link_list",
      "name": "Menu",
      "settings": [
        {
          "type": "text",
          "id": "title",
          "label": "Heading"
        },
        {
          "type": "link_list",
          "id": "menu",
          "label": "Menu"
        }
      ]
    },
    {
      "type": "text",
      "name": "Text",
      "settings": [
        {
          "type": "text",
          "id": "title",
          "label": "Heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Footer",
      "blocks": [
        {
          "type": "link_list"
        },
        {
          "type": "text"
        }
      ]
    }
  ]
}
{% endschema %}`;
}

function generateImageWithTextHTML(): string {
  return `<section class="unique-class-name-image-with-text" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-image-with-text page-width">
    <div class="image-with-text__grid" style="flex-direction: {% if section.settings.layout == 'text_first' %}row-reverse{% else %}row{% endif %};">
      <div class="image-with-text__image-container">
        {% if section.settings.image != blank %}
          <img
            src="{{ section.settings.image | img_url: 'master' }}"
            alt="{{ section.settings.image.alt | escape }}"
            loading="lazy"
            class="image-with-text__image"
          >
        {% else %}
          <div class="image-with-text__image image-with-text__image--placeholder placeholder-background">
            {{ 'image' | placeholder_svg_tag: 'placeholder-svg' }}
          </div>
        {% endif %}
      </div>

      <div class="image-with-text__text-container">
        {% if section.settings.title != blank %}
          <h2 class="image-with-text__heading">{{ section.settings.title | escape }}</h2>
        {% endif %}

        {% if section.settings.text != blank %}
          <div class="image-with-text__text">{{ section.settings.text }}</div>
        {% endif %}

        {% if section.settings.button_label != blank %}
          <a href="{{ section.settings.button_link }}" class="image-with-text__button">
            {{ section.settings.button_label | escape }}
          </a>
        {% endif %}
      </div>
    </div>
  </div>
</section>

<style>
.unique-class-name-image-with-text {
  background-color: #ffffff;
}

.image-with-text__grid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2rem;
}

.image-with-text__image-container {
  flex: 1;
  min-width: 300px;
}

.image-with-text__image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

.image-with-text__image--placeholder {
  padding-top: 75%; /* 4:3 aspect ratio */
  position: relative;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.placeholder-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-with-text__text-container {
  flex: 1;
  min-width: 300px;
}

.image-with-text__heading {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.image-with-text__text {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.image-with-text__button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #333;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.image-with-text__button:hover {
  background-color: #444;
}

@media (max-width: 768px) {
  .image-with-text__grid {
    flex-direction: column !important;
  }
  
  .image-with-text__heading {
    font-size: 1.5rem;
  }
}
</style>`;
}

function generateImageWithTextSchema(): string {
  return `{% schema %}
{
  "name": "Image with text",
  "settings": [
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
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "select",
      "id": "layout",
      "label": "Layout",
      "options": [
        {
          "value": "image_first",
          "label": "Image first"
        },
        {
          "value": "text_first",
          "label": "Text first"
        }
      ],
      "default": "image_first"
    },
    {
      "type": "text",
      "id": "title",
      "label": "Heading"
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    }
  ],
  "presets": [
    {
      "name": "Image with text",
      "category": "Image"
    }
  ]
}
{% endschema %}`;
}

function generateMulticolumnHTML(): string {
  return `<section class="unique-class-name-multicolumn" style="background-color: {{ section.settings.background_color }}; padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;">
  <div class="unique-container-multicolumn page-width">
    <div class="multicolumn__header">
      {% if section.settings.title != blank %}
        <h2 class="multicolumn__heading">{{ section.settings.title | escape }}</h2>
      {% endif %}
      {% if section.settings.subheading != blank %}
        <div class="multicolumn__subheading">{{ section.settings.subheading }}</div>
      {% endif %}
    </div>

    <div class="multicolumn__grid" style="grid-template-columns: repeat({{ section.settings.columns_desktop }}, 1fr);">
      {% for block in section.blocks %}
        <div class="multicolumn__column">
          {% if block.settings.image != blank %}
            <div class="multicolumn__image-wrapper">
              <img
                src="{{ block.settings.image | img_url: 'medium' }}"
                alt="{{ block.settings.image.alt | escape }}"
                loading="lazy"
                class="multicolumn__image"
              >
            </div>
          {% else %}
            <div class="multicolumn__image multicolumn__image--placeholder">
              {{ 'image' | placeholder_svg_tag: 'placeholder-svg' }}
            </div>
          {% endif %}

          {% if block.settings.title != blank %}
            <h3 class="multicolumn__title">{{ block.settings.title | escape }}</h3>
          {% endif %}

          {% if block.settings.text != blank %}
            <div class="multicolumn__text">{{ block.settings.text }}</div>
          {% endif %}

          {% if block.settings.button_label != blank %}
            <a href="{{ block.settings.button_link }}" class="multicolumn__button">
              {{ block.settings.button_label | escape }}
            </a>
          {% endif %}
        </div>
      {% endfor %}
    </div>
  </div>
</section>

<style>
.unique-class-name-multicolumn {
  background-color: #ffffff;
}

.multicolumn__header {
  text-align: center;
  margin-bottom: 2rem;
}

.multicolumn__heading {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.multicolumn__subheading {
  max-width: 700px;
  margin: 0 auto;
  color: #666;
}

.multicolumn__grid {
  display: grid;
  gap: 2rem;
}

.multicolumn__column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.multicolumn__image-wrapper {
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.multicolumn__image {
  width: 100%;
  height: auto;
  display: block;
}

.multicolumn__image--placeholder {
  padding-top: 100%; /* 1:1 aspect ratio */
  position: relative;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.placeholder-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.multicolumn__title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.multicolumn__text {
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.6;
}

.multicolumn__button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
  margin-top: auto;
}

.multicolumn__button:hover {
  background-color: #e0e0e0;
}

@media (max-width: 768px) {
  .multicolumn__grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .multicolumn__heading {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .multicolumn__grid {
    grid-template-columns: 1fr !important;
  }
}
</style>`;
}

function generateMulticolumnSchema(): string {
  return `{% schema %}
{
  "name": "Multicolumn",
  "settings": [
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
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "default": 50,
      "min": 0,
      "max": 100,
      "step": 10
    },
    {
      "type": "text",
      "id": "title",
      "label": "Heading"
    },
    {
      "type": "richtext",
      "id": "subheading",
      "label": "Subheading"
    },
    {
      "type": "select",
      "id": "columns_desktop",
      "label": "Number of columns on desktop",
      "options": [
        {
          "value": "2",
          "label": "2 columns"
        },
        {
          "value": "3",
          "label": "3 columns"
        },
        {
          "value": "4",
          "label": "4 columns"
        }
      ],
      "default": "3"
    }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "Column",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Image"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text"
        },
        {
          "type": "text",
          "id": "button_label",
          "label": "Button label"
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
      "name": "Multicolumn",
      "blocks": [
        {
          "type": "column"
        },
        {
          "type": "column"
        },
        {
          "type": "column"
        }
      ]
    }
  ]
}
{% endschema %}`;
}
