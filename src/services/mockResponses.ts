
import { ImageOptions } from '@/components/OptionsSelector';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

export function generateSimulatedResponse(options: ImageOptions): GenerateCodeResponse {
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
