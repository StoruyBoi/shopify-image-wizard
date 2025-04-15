
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, options, requirements } = await req.json();
    
    console.log('Received request with options:', JSON.stringify(options));
    console.log('Requirements:', requirements);
    
    // Call Claude API
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    
    if (!CLAUDE_API_KEY) {
      console.error("Claude API key not found");
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Build system prompt based on the options
    const purposePrompt = options.purpose === 'product' 
      ? 'product listing with images, title, price and description' 
      : options.purpose === 'slider' 
        ? 'image carousel or slider component' 
        : options.purpose === 'banner' 
          ? 'promotional banner or hero section'
          : 'website section';
    
    const systemPrompt = `
      You are a Shopify expert who specializes in converting website designs to Shopify Liquid code.
      Your task is to analyze the uploaded image of a ${purposePrompt} and generate the HTML and Liquid code needed to recreate it.
      Include both the HTML structure and necessary CSS styles.
      Structure your response as follows:
      1. A brief description of what you see in the image
      2. The HTML + Liquid code to recreate it
    `;
    
    // Build user prompt with the requirements
    const userPrompt = `
      Here's an image of a ${purposePrompt} design. 
      Please generate the Shopify Liquid code to recreate this design with the following requirements:
      ${requirements}
      
      Make sure the code follows Shopify best practices and is responsive.
      Format the code for easy copy-pasting into a Shopify theme.
    `;
    
    console.log("Calling Claude API...");
    
    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg", // Assuming JPEG, but should dynamically determine
                  data: imageUrl.split(",")[1], // Remove data URL prefix
                },
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate code", details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const data = await response.json();
    console.log("Claude response received");
    
    // Extract the HTML/Liquid content
    const generatedContent = data.content[0].text;
    
    // Basic separation of HTML and Liquid (simple approach)
    const htmlPattern = /```html([\s\S]*?)```/;
    const liquidPattern = /```liquid([\s\S]*?)```/;
    
    let htmlMatch = generatedContent.match(htmlPattern);
    let liquidMatch = generatedContent.match(liquidPattern);
    
    // If specific language blocks aren't found, look for generic code blocks
    if (!htmlMatch && !liquidMatch) {
      const codeBlockPattern = /```([\s\S]*?)```/;
      const codeMatch = generatedContent.match(codeBlockPattern);
      
      if (codeMatch) {
        // Use the generic code block
        htmlMatch = codeMatch;
        liquidMatch = codeMatch;
      }
    }
    
    const code = htmlMatch ? htmlMatch[1].trim() : generatedContent;
    const shopifyLiquid = liquidMatch ? liquidMatch[1].trim() : code;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        code, 
        shopifyLiquid,
        fullResponse: generatedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-code function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
