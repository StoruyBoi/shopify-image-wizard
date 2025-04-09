
import { ImageOptions } from '@/components/OptionsSelector';

interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

export async function generateCodeFromImage(
  imageFile: File,
  options: ImageOptions,
  additionalDetails: any
): Promise<GenerateCodeResponse> {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);
  
  // Prepare the API request to Claude 3.7
  const systemPrompt = `You are an expert Shopify theme developer. 
  Analyze the uploaded image and generate Shopify Liquid code that recreates this UI element as a ${options.purpose} section.
  Return valid, well-structured Shopify Liquid code with appropriate HTML, CSS, and Liquid syntax.
  Focus on accuracy and maintain the visual style shown in the image.
  Include comments explaining key parts of the code.`;
  
  try {
    // In a production app, this would be an actual API call to Claude 3.7
    // This is a placeholder that simulates the response while you implement the actual API
    
    // Simulated response for development
    const simulatedResponse: GenerateCodeResponse = {
      code: `<div class="shopify-section">
  <!-- Generated ${options.purpose} section based on the image -->
  <div class="section-container">
    <div class="section-content">
      ${options.includeText ? '<h2>{{ section.settings.heading }}</h2>' : ''}
      ${options.showPrice ? '<div class="price">{{ product.price | money }}</div>' : ''}
      ${options.showRating ? '<div class="rating">★★★★☆</div>' : ''}
    </div>
  </div>
</div>`,
      shopifyLiquid: `{% schema %}
{
  "name": "${capitalizeFirstLetter(options.purpose)} Section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Section Heading"
    }${options.showPrice ? ',\n    {\n      "type": "product",\n      "id": "product",\n      "label": "Product"\n    }' : ''}
  ],
  "presets": [
    {
      "name": "${capitalizeFirstLetter(options.purpose)} Section",
      "category": "Custom Content"
    }
  ]
}
{% endschema %}`
    };
    
    return simulatedResponse;
  } catch (error) {
    console.error("Error generating code from image:", error);
    throw new Error("Failed to generate code from image. Please try again.");
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

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
