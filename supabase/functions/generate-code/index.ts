
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, options, requirements } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate Shopify Liquid code for a ${options.purpose} section based on the provided image and requirements.\n\nRequirements: ${requirements}\n\nPlease provide both HTML/CSS code and the Shopify schema section. Format the response with HTML code first, followed by the schema code.`
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageUrl.split(',')[1]
                }
              }
            ]
          }
        ],
      }),
    });

    const data = await response.json();
    
    // Extract the response content
    const generatedText = data.content?.[0]?.text || '';
    
    // Parse the generated code to extract HTML and schema
    const htmlMatch = generatedText.match(/<html>([\s\S]*?)<\/html>/);
    const schemaMatch = generatedText.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
    
    const code = htmlMatch ? htmlMatch[1].trim() : '';
    const shopifyLiquid = schemaMatch ? `{% schema %}\n${schemaMatch[1].trim()}\n{% endschema %}` : '';
    
    return new Response(
      JSON.stringify({ 
        code, 
        shopifyLiquid, 
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
