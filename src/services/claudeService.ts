
import { ImageOptions } from '@/components/OptionsSelector';
import { supabase } from "@/lib/supabase";

/**
 * Claude API integration for Shopify Liquid code generation
 */
export async function generateCodeFromImage(
  imageFile: File,
  options: ImageOptions,
  requirements: string
): Promise<{ code: string; shopifyLiquid: string }> {
  try {
    console.info('Selected options:', JSON.stringify(options));
    console.info('Requirements:', requirements);
    
    // Convert image to base64
    const imageUrl = await fileToBase64WithPrefix(imageFile);
    
    
    const { data, error } = await supabase.functions.invoke('generate-code', {
      body: { 
        imageUrl, 
        options, 
        requirements 
      }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || "Failed to call the edge function");
    }
    
    if (!data || !data.success) {
      console.error('API response error:', data);
      throw new Error(data?.error || "Failed to generate code");
    }
    
    return {
      code: data.code || '',
      shopifyLiquid: data.shopifyLiquid || ''
    };
  } catch (error: any) {
    console.error('Failed to generate code:', error);
    throw new Error(error.message || "An unexpected error occurred");
  }
}

// Helper function to convert File to base64 with data URL prefix
export function fileToBase64WithPrefix(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

// Modified version for string base64 data without the prefix
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
