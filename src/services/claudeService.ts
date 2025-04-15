
import { ImageOptions } from '@/components/OptionsSelector';

/**
 * Claude API integration for Shopify Liquid code generation
 * 
 * Note: In production, this would connect to a backend proxy server that
 * would handle the Claude API calls to avoid CORS and secure API keys.
 */

export async function generateCodeFromImage(
  imageFile: File,
  options: ImageOptions,
  requirements: string
): Promise<{ code: string; shopifyLiquid: string }> {
  // Extract section type from options
  const sectionType = options.purpose === 'custom' && options.customType 
    ? options.customType 
    : options.purpose;
  
  try {
    console.info('Selected options:', JSON.stringify(options));
    console.info('Requirements:', requirements);
    
    // In a production environment, this would call a backend API
    // that handles the Claude API request with proper authentication
    // const response = await fetch('/api/claude/generate', {
    //   method: 'POST',
    //   body: formData
    // });
    
    // For now, use the mock response until backend is implemented
    const generatedCode = getMockResponseText(sectionType);
    
    // Parse the generated code into separate components
    const parsedCode = parseGeneratedCode(generatedCode);
    
    return parsedCode;
  } catch (error) {
    console.error('Failed to generate code:', error);
    // Fall back to mock response in case of error
    return getMockResponse(sectionType);
  }
}

export async function generateShopifyCode(
  sectionType: string,
  requirements: string,
  imageDescriptions: string
): Promise<string> {
  // In a production environment, this would call the Claude API through a backend proxy
  return getMockResponseText(sectionType);
}

// Function to create mock response for demonstration purposes
function getMockResponseText(sectionType: string): string {
  return `<html>
<!-- HTML code for the section -->
<div class="section-${sectionType} container">
  <div class="section-${sectionType}__header">
    <h2 class="section-${sectionType}__title">{{ section.settings.heading }}</h2>
    <p class="section-${sectionType}__description">{{ section.settings.subheading }}</p>
  </div>
  
  <div class="section-${sectionType}__content">
    {% if section.settings.image != blank %}
      <div class="section-${sectionType}__image-wrapper">
        <img src="{{ section.settings.image | img_url: 'master' }}" alt="{{ section.settings.image_alt | escape }}" class="section-${sectionType}__image" loading="lazy">
      </div>
    {% endif %}
    
    <div class="section-${sectionType}__text-content">
      <h3 class="section-${sectionType}__subtitle">{{ section.settings.content_title }}</h3>
      <div class="section-${sectionType}__rich-text">{{ section.settings.content_text }}</div>
      
      {% if section.settings.button_label != blank %}
        <a href="{{ section.settings.button_link }}" class="section-${sectionType}__button">
          {{ section.settings.button_label }}
        </a>
      {% endif %}
    </div>
  </div>
</div>
</html>

<style>
.section-${sectionType} {
  padding: var(--section-padding);
  background-color: {{ section.settings.background_color }};
  color: {{ section.settings.text_color }};
}

.section-${sectionType}__header {
  text-align: {{ section.settings.content_alignment }};
  margin-bottom: 2rem;
}

.section-${sectionType}__title {
  font-size: {{ section.settings.heading_size }}px;
  margin-bottom: 1rem;
}

.section-${sectionType}__content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
}

.section-${sectionType}__image-wrapper {
  flex: 1 1 300px;
}

.section-${sectionType}__image {
  width: 100%;
  height: auto;
  display: block;
}

.section-${sectionType}__text-content {
  flex: 1 1 300px;
}

.section-${sectionType}__button {
  display: inline-block;
  background-color: {{ section.settings.button_background }};
  color: {{ section.settings.button_text_color }};
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1.5rem;
  transition: opacity 0.2s ease;
}

.section-${sectionType}__button:hover {
  opacity: 0.9;
}

@media screen and (max-width: 749px) {
  .section-${sectionType}__content {
    flex-direction: {% if section.settings.enable_mobile_stack %}column{% else %}row{% endif %};
  }
  
  .section-${sectionType}__title {
    font-size: calc({{ section.settings.heading_size }}px * 0.8);
  }
}
</style>

{% schema %}
{
  "name": "${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section",
  "settings": [
    {
      "type": "header",
      "content": "Content"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Featured ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "Showcase your best ${sectionType} with a beautiful layout"
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
      "default": "${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} image"
    },
    {
      "type": "text",
      "id": "content_title",
      "label": "Content title",
      "default": "${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Features"
    },
    {
      "type": "richtext",
      "id": "content_text",
      "label": "Content text",
      "default": "<p>Use this text to share information about your ${sectionType} with your customers.</p>"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label",
      "default": "Learn more"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    },
    {
      "type": "header",
      "content": "Style"
    },
    {
      "type": "range",
      "id": "heading_size",
      "min": 20,
      "max": 60,
      "step": 5,
      "default": 40,
      "label": "Heading size (px)"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background color",
      "default": "#FFFFFF"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text color",
      "default": "#333333"
    },
    {
      "type": "color",
      "id": "button_background",
      "label": "Button background",
      "default": "#4A4A4A"
    },
    {
      "type": "color",
      "id": "button_text_color",
      "label": "Button text color",
      "default": "#FFFFFF"
    },
    {
      "type": "select",
      "id": "content_alignment",
      "label": "Content alignment",
      "options": [
        {
          "value": "left",
          "label": "Left"
        },
        {
          "value": "center",
          "label": "Center"
        },
        {
          "value": "right",
          "label": "Right"
        }
      ],
      "default": "left"
    },
    {
      "type": "range",
      "id": "padding_top",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "label": "Padding top (px)"
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "label": "Padding bottom (px)"
    },
    {
      "type": "checkbox",
      "id": "enable_mobile_stack",
      "label": "Stack content on mobile",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section",
      "category": "Custom"
    }
  ]
}
{% endschema %}`;
}

// Function to get mock response as an object
function getMockResponse(sectionType: string): { code: string; shopifyLiquid: string } {
  const responseText = getMockResponseText(sectionType);
  return parseGeneratedCode(responseText);
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

// Parse the generated code into components
function parseGeneratedCode(generatedCode: string): { code: string; shopifyLiquid: string } {
  // Initialize the output
  let result = {
    code: '',
    shopifyLiquid: ''
  };

  // Regular expressions to extract different parts
  const htmlRegex = /<html>([\s\S]*?)<\/html>/;
  const schemaRegex = /{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/;
  const styleRegex = /<style>([\s\S]*?)<\/style>/;
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;

  // Extract HTML content
  const htmlMatch = generatedCode.match(htmlRegex);
  if (htmlMatch && htmlMatch[1]) {
    result.code = htmlMatch[1].trim();
    
    // Add style if available
    const styleMatch = generatedCode.match(styleRegex);
    if (styleMatch && styleMatch[1]) {
      result.code += `\n\n<style>\n${styleMatch[1].trim()}\n</style>`;
    }
    
    // Add script if available
    const scriptMatch = generatedCode.match(scriptRegex);
    if (scriptMatch && scriptMatch[1]) {
      result.code += `\n\n<script>\n${scriptMatch[1].trim()}\n</script>`;
    }
  } else {
    // If no HTML tags, assume the first part is HTML
    const parts = generatedCode.split(/{%\s*schema\s*%}/);
    if (parts.length > 0) {
      result.code = parts[0].trim();
    }
  }

  // Extract schema content
  const schemaMatch = generatedCode.match(schemaRegex);
  if (schemaMatch && schemaMatch[1]) {
    result.shopifyLiquid = `{% schema %}\n${schemaMatch[1].trim()}\n{% endschema %}`;
  }

  return result;
}
