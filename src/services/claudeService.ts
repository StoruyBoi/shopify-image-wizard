import { ImageOptions } from '@/components/OptionsSelector';

/**
 * Claude API integration for Shopify Liquid code generation
 * 
 * IMPORTANT: This code handles CORS issues by using a mock response.
 * In a production environment, you would need to use a backend proxy server to 
 * avoid CORS issues and securely handle API keys.
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
    
    // Always use mock response to bypass CORS issues
    console.info('Using mock response for demonstration (bypassing Claude API due to CORS restrictions)');
    const generatedCode = getMockResponseText(sectionType);
    
    console.info('Response received');
    
    // Parse the generated code into separate components
    const parsedCode = parseGeneratedCode(generatedCode);
    console.info('Parsed response:', JSON.stringify(parsedCode));
    
    return parsedCode;
  } catch (error) {
    console.error('Failed to generate code:', error);
    // Fall back to mock response in case of error
    return getMockResponse(sectionType);
  }
}

/**
 * This function would normally call a backend proxy to avoid CORS issues.
 * 
 * If you were using Next.js, you could create an API route like:
 * - app/api/generate/route.ts (Next.js 13+)
 * - pages/api/generate.ts (Next.js 12 and below)
 *
 * The frontend would call your own API which would then call Claude's API server-side.
 * 
 * Example of Next.js API route:
 * ```
 * // app/api/generate/route.ts
 * export async function POST(request: Request) {
 *   const { sectionType, requirements, imageBase64 } = await request.json();
 *   
 *   const response = await fetch('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: {
 *       'x-api-key': process.env.CLAUDE_API_KEY,
 *       'anthropic-version': '2023-06-01',
 *       'content-type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       model: "claude-3-5-sonnet-20241022",
 *       max_tokens: 4000,
 *       messages: [
 *         { 
 *           role: "user", 
 *           content: createPrompt(sectionType, requirements, imageBase64) 
 *         }
 *       ]
 *     }),
 *   });
 *
 *   const data = await response.json();
 *   return Response.json({ generatedCode: data.content[0].text });
 * }
 * ```
 */
export async function generateShopifyCode(
  sectionType: string,
  requirements: string,
  imageDescriptions: string
): Promise<string> {
  // Always return mock response since we can't call Claude API directly due to CORS
  console.info('CORS restrictions prevent direct API calls - using mock data');
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

function createPrompt(sectionType: string, requirements: string, imageDescriptions: string = ''): string {
  return `You are ShopifyExpert, an elite AI developer specializing in flawless Shopify Liquid code. Create a production-ready ${sectionType} section for Shopify.
  
REFERENCE IMAGES:
${imageDescriptions || 'No reference images provided.'}

SECTION REQUIREMENTS:
${requirements}
## LIBRARY IMPLEMENTATION

### SLIDER LIBRARIES
- INCLUDE proper initialization with section.id
- ADD all required CSS and JS via CDN
- USE defensive loading with library check
- IMPLEMENT responsive breakpoints
- PROVIDE schema controls for all slider options



## CRITICAL DEVELOPMENT RULES
- ALL range inputs MUST have default values divisible by step value
  ✓ CORRECT: step: 5, default: 0, 5, 10, 15...
  ✗ WRONG: step: 5, default: 12, 23, 37...
- ALL color fields MUST have proper hex defaults (#FFFFFF format)
- NO circular references in schema
- Range inputs MUST have (max-min) evenly divisible by step
  ✓ CORRECT: min: 1000, max: 9500, step: 500 → (9500-1000)/500 = 17 (integer)
  ✗ WRONG: min: 1000, max: 9900, step: 500 → (9900-1000)/500 = 17.8 (not an integer)
### 2. CLASS NAMING SYSTEM
- MANDATORY: Use BEM methodology
  * Block: section-${sectionType.toLowerCase().replace(/\\s+/g, '-')}
  * Element: section-${sectionType.toLowerCase().replace(/\\s+/g, '-')}__element
  * Modifier: section-${sectionType.toLowerCase().replace(/\\s+/g, '-')}__element--modifier
- NEVER use generic class names (container, wrapper, button, etc.)
- ADD data-section-id="{{ section.id }}" to root element
- NAMESPACE JS variables with section ID to prevent global conflicts


### 3. RESPONSIVE DESIGN
- Mobile-first CSS approach required
- Include specific breakpoints: 749px, 989px, 1199px
- Use responsive settings in schema for mobile adjustments
- Add mobile-specific classes as needed


### 4. ASSET HANDLING
- ALWAYS check if assets exist before rendering
- Use proper srcset and sizes attributes for responsive images
- Implement lazy loading for all images
- Set explicit width/height to prevent layout shift
- SVG icons can be used directly in the template code


### SLIDER SETTINGS (WHEN USING SLIDERS)
- enable_slider: Checkbox (true)
- autoplay: Checkbox (false)
- autoplay_speed: Range (1000-9500ms, step: 500, default: 3000)
- show_arrows: Checkbox (true)
- show_dots: Checkbox (true)
- infinite_loop: Checkbox (true)
- slides_to_show: Range (1-8, step: 1, default: 3)
- slides_to_scroll: Range (1-8, step: 1, default: 1)
- slide_padding: Range (0-50px, step: 5, default: 10)
- transition_speed: Range (200-1000ms, step: 100, default: 500)



### UNIVERSAL SETTINGS (REQUIRED IN ALL SECTIONS)
- Section heading group:
* heading: Text input with default
* heading_size: Select (small, medium, large)
* heading_color: Color picker (#000000)
- Layout controls:
* padding_top: Range (0-100px, step: 5, default: 30)
* padding_bottom: Range (0-100px, step: 5, default: 30)
* background_color: Color picker (#FFFFFF)
* text_color: Color picker (#333333)
* content_alignment: Select (left, center, right)
- Mobile controls:
* custom_class: Text input
* enable_mobile_stack: Checkbox (true)
* 

### IMAGE SETTINGS (WHEN USING IMAGES)
- image: Image picker
- image_width: Range (50-100, step: 5, default: 100)
- image_height: Range (auto, custom)
- image_fit: Select (cover, contain, fill)
- mobile_image: Image picker (optional)



Please create a complete, production-ready Shopify section that implements all these requirements. Include HTML, CSS, and JSON schema. Follow these specifications:

1. Use unique class names with the pattern "section-${sectionType.toLowerCase().replace(/\\s+/g, '-')}-[element]" to avoid CSS conflicts
2. Make all text content placeholder (Lorem Ipsum)
3. Include these standard settings in schema: background_color, padding_top, padding_bottom
4. Make the section fully responsive for mobile, tablet and desktop
5. Add appropriate comments explaining the code
6. Follow modern Shopify best practices
7. Fully Dynamic , Customizable 
8. Think where you can use section schema and wher you can use Block Schema 

For images, use this structure:
<img src="{{ section.settings.image | img_url: 'master'}}" alt="{{ section.settings.image_alt | escape }}" loading="lazy">

For videos, use this structure:
{% if section.settings.video != blank %}
  <video src="{{ section.settings.video.sources[1].url }}" loop muted playsinline autoplay style="width: 100%; display: block;"></video>
{% endif %}

Structure your response exactly like this:

<html>
<!-- HTML code for the section -->
</html>

<!-- List any required CDN links that should be added to theme.liquid -->

<script>
// Any JavaScript required for the section
</script>

<style>
/* CSS code for the section */
</style>

{% schema %}
{
  // JSON schema for the section
}
{% endschema %}`;
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
