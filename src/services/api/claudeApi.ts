
/**
 * Claude API integration for Shopify Liquid code generation
 */

export async function generateShopifyCode(
  sectionType: string,
  requirements: string,
  imageDescriptions: string
) {
  try {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.warn('Claude API key is missing. Using mock response.');
      return getMockResponse(sectionType);
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [
          { 
            role: "user", 
            content: createPrompt(sectionType, requirements, imageDescriptions) 
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error calling Claude API');
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating code:', error);
    // Return a mock response in case of error
    return getMockResponse(sectionType);
  }
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

// Mock response for fallback when API key is missing or for development
function getMockResponse(sectionType: string): string {
  return `<html>
<!-- Shopify ${sectionType} Section HTML -->
<div class="section-${sectionType.toLowerCase().replace(/\s+/g, '-')}" data-section-id="{{ section.id }}">
  <div class="section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__inner">
    <h2 class="section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__heading">{{ section.settings.heading }}</h2>
    <div class="section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__content">
      <p>This is a mock response for a ${sectionType} section. Please set up a Claude API key to get real responses.</p>
    </div>
  </div>
</div>
</html>

<style>
.section-${sectionType.toLowerCase().replace(/\s+/g, '-')} {
  padding: {{ section.settings.padding_top }}px 0 {{ section.settings.padding_bottom }}px;
  background-color: {{ section.settings.background_color }};
}

.section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__heading {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: {{ section.settings.content_alignment }};
}

.section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__content {
  text-align: {{ section.settings.content_alignment }};
}
</style>

{% schema %}
{
  "name": "${sectionType}",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${sectionType} Heading"
    },
    {
      "type": "select",
      "id": "content_alignment",
      "label": "Content Alignment",
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
      "default": "center"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#FFFFFF"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "unit": "px"
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "unit": "px"
    }
  ],
  "presets": [
    {
      "name": "${sectionType}",
      "category": "Custom"
    }
  ]
}
{% endschema %}`;
}
