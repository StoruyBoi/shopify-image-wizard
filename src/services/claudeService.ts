
import { ImageOptions } from '@/components/OptionsSelector';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

// API key for Anthropic/Claude - Note: In production, this should be handled by a backend service
const CLAUDE_API_KEY = "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";

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
  const { purpose, showPrice, showRating, includeText } = options;
  
  return `
    I need you to analyze this image of a website section and generate Shopify Liquid code that recreates it.
    
    Section type: ${purpose}
    Features to include:
    ${showPrice ? '- Show prices' : '- Do not show prices'}
    ${showRating ? '- Show ratings' : '- Do not show ratings'}
    ${includeText ? '- Include text content' : '- Minimize text content'}
    
    Additional details: ${JSON.stringify(additionalDetails)}
    
    Please provide your response in the following format:
    1. First, generate the HTML/Liquid template code for the section
    2. Then, generate the Shopify schema code that would be used for the section
    
    Format your response as a JSON object with two properties:
    {
      "code": "HTML/Liquid template code here",
      "shopifyLiquid": "Shopify schema code here"
    }
    
    IMPORTANT: Make sure your response is ONLY the JSON object with no additional text.
  `;
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
    
    // Try to extract JSON from the response text
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/{[\s\S]*"code":[\s\S]*"shopifyLiquid":[\s\S]*}/);
    
    if (jsonMatch) {
      // Parse the JSON content
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const cleanJsonStr = jsonStr.replace(/```json|```/g, '').trim();
      const parsedJson = JSON.parse(cleanJsonStr);
      
      if (parsedJson.code && parsedJson.shopifyLiquid) {
        return {
          code: parsedJson.code,
          shopifyLiquid: parsedJson.shopifyLiquid
        };
      }
    }
    
    // Fallback: Try to find HTML/liquid code and schema code sections
    const htmlMatch = content.match(/```(html|liquid)([\s\S]*?)```/);
    const schemaMatch = content.match(/```(json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (htmlMatch && schemaMatch) {
      return {
        code: htmlMatch[2].trim(),
        shopifyLiquid: `{% schema %}${schemaMatch[4].trim()}{% endschema %}`
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
  const { purpose, showPrice, showRating, includeText } = options;
  
  // Generate different code snippets based on section type
  let htmlCode = '';
  let schemaCode = '';
  
  switch (purpose) {
    case 'product':
      htmlCode = generateProductSectionHTML(showPrice, showRating, includeText);
      schemaCode = generateProductSectionSchema(showPrice, showRating, includeText);
      break;
    case 'slider':
      htmlCode = generateSliderSectionHTML(includeText);
      schemaCode = generateSliderSectionSchema();
      break;
    case 'banner':
      htmlCode = generateBannerSectionHTML(includeText);
      schemaCode = generateBannerSectionSchema(includeText);
      break;
    case 'collection':
      htmlCode = generateCollectionSectionHTML(showPrice, includeText);
      schemaCode = generateCollectionSectionSchema(showPrice);
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
      htmlCode = generateImageWithTextHTML(includeText);
      schemaCode = generateImageWithTextSchema();
      break;
    case 'multicolumn':
      htmlCode = generateMulticolumnHTML(includeText);
      schemaCode = generateMulticolumnSchema();
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
      schemaCode = `{% schema %}
{
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

// Keep all the generator helper functions for fallback
function generateProductSectionHTML(showPrice: boolean, showRating: boolean, includeText: boolean): string {
  return `<div class="product-section">
  <div class="product-container">
    <div class="product-gallery">
      {% for image in product.images %}
        <div class="product-image{% if forloop.first %} active{% endif %}">
          <img 
            src="{{ image | img_url: 'large' }}" 
            alt="{{ product.title | escape }}"
            loading="lazy"
          />
        </div>
      {% endfor %}
    </div>
    
    <div class="product-details">
      ${includeText ? '<h1 class="product-title">{{ product.title }}</h1>' : ''}
      
      ${showPrice ? `<div class="product-price">
        {% if product.compare_at_price > product.price %}
          <span class="regular-price">{{ product.compare_at_price | money }}</span>
          <span class="sale-price">{{ product.price | money }}</span>
        {% else %}
          <span class="regular-price">{{ product.price | money }}</span>
        {% endif %}
      </div>` : ''}
      
      ${showRating ? `<div class="product-rating">
        {% render 'product-rating', product: product %}
      </div>` : ''}
      
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
</div>`;
}

function generateProductSectionSchema(showPrice: boolean, showRating: boolean, includeText: boolean): string {
  return `{% schema %}
{
  "name": "Product Section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Product Details"
    },
    ${showPrice ? `{
      "type": "checkbox",
      "id": "show_price",
      "label": "Show price",
      "default": true
    },` : ''}
    ${showRating ? `{
      "type": "checkbox",
      "id": "show_rating",
      "label": "Show rating",
      "default": true
    },` : ''}
    ${includeText ? `{
      "type": "checkbox",
      "id": "show_title",
      "label": "Show product title",
      "default": true
    },` : ''}
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

function generateSliderSectionHTML(includeText: boolean): string {
  return `<div class="slideshow-section">
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
            ${includeText ? `{% if block.settings.heading != blank %}
              <h2 class="slide-heading">{{ block.settings.heading }}</h2>
            {% endif %}
            
            {% if block.settings.text != blank %}
              <div class="slide-text">{{ block.settings.text }}</div>
            {% endif %}
            
            {% if block.settings.button_label != blank and block.settings.button_link != blank %}
              <a href="{{ block.settings.button_link }}" class="slide-button">
                {{ block.settings.button_label }}
              </a>
            {% endif %}` : ''}
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
</div>`;
}

function generateSliderSectionSchema(): string {
  return `{% schema %}
{
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
          "label": "Image alt text",
          "default": "Decorative image"
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
          "label": "Heading",
          "default": "Slide heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text",
          "default": "<p>Pair text with an image to create a powerful message</p>"
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
}
{% endschema %}`;
}

function generateBannerSectionHTML(includeText: boolean): string {
  return `<div class="banner-section">
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
        ${includeText ? `<div class="banner-content">
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
        </div>` : ''}
      </div>
    {% endif %}
  </div>
</div>`;
}

function generateBannerSectionSchema(includeText: boolean): string {
  return `{% schema %}
{
  "name": "Image Banner",
  "settings": [
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image alt text",
      "default": "Decorative banner image"
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
    }${includeText ? `,
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Banner heading"
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text",
      "default": "<p>Add a brief description</p>"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Button label",
      "default": "Shop now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button link"
    }` : ''}
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

function generateCollectionSectionHTML(showPrice: boolean, includeText: boolean): string {
  return `<div class="collection-section">
  <div class="collection-header">
    ${includeText ? `<h2 class="collection-title">{{ section.settings.title | escape }}</h2>
    
    {% if section.settings.description != blank %}
      <div class="collection-description">{{ section.settings.description }}</div>
    {% endif %}` : ''}
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
            
            ${showPrice ? `<div class="collection-item-price">
              {% if product.compare_at_price > product.price %}
                <span class="price-sale">{{ product.price | money }}</span>
                <span class="price-compare">{{ product.compare_at_price | money }}</span>
              {% else %}
                <span class="price-regular">{{ product.price | money }}</span>
              {% endif %}
            </div>` : ''}
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
</div>`;
}

function generateCollectionSectionSchema(showPrice: boolean): string {
  return `{% schema %}
{
  "name": "Collection List",
  "settings": [
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
    ${showPrice ? `{
      "type": "checkbox",
      "id": "show_price",
      "label": "Show price",
      "default": true
    },` : ''}
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
  return `<div class="announcement-bar" style="background-color: {{ section.settings.color_background }};">
  <div class="page-width">
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
</div>`;
}

function generateAnnouncementSchema(): string {
  return `{% schema %}
{
  "name": "Announcement Bar",
  "settings": [
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
      "label": "Background",
      "default": "#000000"
    },
    {
      "type": "color",
      "id": "color_text",
      "label": "Text",
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
  return `<div class="header" data-section-id="{{ section.id }}" data-section-type="header-section">
  <div class="header-wrapper page-width">
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
          {% render 'icon-account' %}
        </a>
      {% endif %}
      
      <a href="{{ routes.search_url }}" class="header-search-link">
        {% render 'icon-search' %}
      </a>
      
      <a href="{{ routes.cart_url }}" class="header-cart-link">
        {% render 'icon-cart' %}
        <span class="header-cart-count">{{ cart.item_count }}</span>
      </a>
    </div>
  </div>
</div>`;
}

function generateHeaderSchema(): string {
  return `{% schema %}
{
  "name": "Header",
  "settings": [
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
      "label": "Announcement text",
      "default": "Announce something here"
    }
  ]
}
{% endschema %}`;
}

function generateFooterHTML(): string {
  return `<footer class="footer" data-section-id="{{ section.id }}" data-section-type="footer-section">
  <div class="footer-wrapper page-width">
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
              {% render 'icon-twitter' %}
            </a>
          {%- endif -%}
          {%- if settings.social_facebook_link != blank -%}
            <a href="{{ settings.social_facebook_link }}" class="footer-social-link">
              {% render 'icon-facebook' %}
            </a>
          {%- endif -%}
          {%- if settings.social_instagram_link != blank -%}
            <a href="{{ settings.social_instagram_link }}" class="footer-social-link">
              {% render 'icon-instagram' %}
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
</footer>`;
}

function generateFooterSchema(): string {
  return `{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_newsletter",
      "label": "Show newsletter",
      "default": true
    },
    {
      "type": "text",
      "id": "newsletter_title",
      "label": "Newsletter title",
      "default": "Subscribe to our newsletter"
    },
    {
      "type": "richtext",
      "id": "newsletter_text",
      "label": "Newsletter text",
      "default": "<p>Get updates on sales, new releases and more</p>"
    },
    {
      "type": "text",
      "id": "newsletter_button_text",
      "label": "Button text",
      "default": "Subscribe"
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
      "label": "Copyright text",
      "default": "All rights reserved."
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
          "label": "Heading",
          "default": "Quick links"
        },
        {
          "type": "link_list",
          "id": "menu",
          "label": "Menu",
          "default": "footer"
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
          "label": "Heading",
          "default": "About us"
        },
        {
          "type": "richtext",
          "id": "text",
          "label": "Text",
          "default": "<p>Store information, company mission, and more.</p>"
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

function generateImageWithTextHTML(includeText: boolean): string {
  return `<div class="image-with-text" data-section-id="{{ section.id }}">
  <div class="image-with-text__container page-width">
    <div class="image-with-text__grid">
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

      ${includeText ? `<div class="image-with-text__text-container">
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
      </div>` : ''}
    </div>
  </div>
</div>`;
}

function generateImageWithTextSchema(): string {
  return `{% schema %}
{
  "name": "Image with text",
  "settings": [
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
      "label": "Heading",
      "default": "Image with text"
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text",
      "default": "<p>Pair text with an image to focus on your chosen product, collection, or blog post. Add details on availability, style, or even provide a review.</p>"
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

function generateMulticolumnHTML(includeText: boolean): string {
  return `<div class="multicolumn" data-section-id="{{ section.id }}">
  <div class="page-width">
    ${includeText ? `<div class="multicolumn__header">
      {% if section.settings.title != blank %}
        <h2 class="multicolumn__heading">{{ section.settings.title | escape }}</h2>
      {% endif %}
      {% if section.settings.subheading != blank %}
        <div class="multicolumn__subheading">{{ section.settings.subheading }}</div>
      {% endif %}
    </div>` : ''}

    <div class="multicolumn__grid grid--{{ section.settings.columns_desktop }}-col-desktop grid--{{ section.settings.columns_mobile }}-col-mobile">
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

          ${includeText ? `{% if block.settings.title != blank %}
            <h3 class="multicolumn__title">{{ block.settings.title | escape }}</h3>
          {% endif %}

          {% if block.settings.text != blank %}
            <div class="multicolumn__text">{{ block.settings.text }}</div>
          {% endif %}

          {% if block.settings.button_label != blank %}
            <a href="{{ block.settings.button_link }}" class="multicolumn__button">
              {{ block.settings.button_label | escape }}
            </a>
          {% endif %}` : ''}
        </div>
      {% endfor %}
    </div>
  </div>
</div>`;
}

function generateMulticolumnSchema(): string {
  return `{% schema %}
{
  "name": "Multicolumn",
  "tag": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "default": "Multicolumn",
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
    },
    {
      "type": "select",
      "id": "columns_mobile",
      "label": "Number of columns on mobile",
      "options": [
        {
          "value": "1",
          "label": "1 column"
        },
        {
          "value": "2",
          "label": "2 columns"
        }
      ],
      "default": "1"
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
          "default": "Column title",
          "label": "Heading"
        },
        {
          "type": "richtext",
          "id": "text",
          "default": "<p>Pair text with an image to focus on your chosen product, collection, or blog post.</p>",
          "label": "Text"
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

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
