
interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

// Helper function to parse Claude's response
export function parseClaudeResponse(response: any): GenerateCodeResponse {
  try {
    // Extract the content from Claude's response
    const content = response.content && response.content[0] && response.content[0].text 
      ? response.content[0].text 
      : '';
    
    if (!content) {
      throw new Error("Empty response from Claude API");
    }
    
    // Try to extract HTML code and schema code sections using different patterns
    // First try the explicit HTML and schema tags
    const htmlMatch = content.match(/<html>([\s\S]*?)<\/html>/i);
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/i);
    const schemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/i);
    
    if (htmlMatch && schemaMatch) {
      const htmlCode = htmlMatch[1].trim();
      const styleCode = styleMatch ? styleMatch[1].trim() : '';
      
      return {
        code: `${htmlCode}\n\n<style>\n${styleCode}\n</style>`,
        shopifyLiquid: `{% schema %}\n${schemaMatch[1].trim()}\n{% endschema %}`
      };
    }
    
    // Fallback to code blocks format
    const codeMatches = content.match(/```(?:html|liquid)([\s\S]*?)```/g);
    const schemaMatchAlt = content.match(/```(?:json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (codeMatches && codeMatches.length > 0) {
      // Extract HTML/CSS from first code block
      const htmlContent = codeMatches[0].replace(/```(?:html|liquid)/g, '').replace(/```/g, '').trim();
      
      // Try to find schema in content or in another code block
      let schemaContent = '';
      if (schemaMatchAlt && schemaMatchAlt[3]) {
        schemaContent = schemaMatchAlt[3].trim();
      } else {
        // Look for schema in the content directly
        const directSchemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/);
        if (directSchemaMatch) {
          schemaContent = directSchemaMatch[1].trim();
        }
      }
      
      return {
        code: htmlContent,
        shopifyLiquid: schemaContent ? `{% schema %}\n${schemaContent}\n{% endschema %}` : ''
      };
    }
    
    // Last fallback: Just return the content as is
    console.log("Using fallback response parsing");
    
    return {
      code: content,
      shopifyLiquid: ''
    };
  } catch (error) {
    console.error("Error parsing Claude response:", error, response);
    throw new Error("Failed to parse the response from Claude. Falling back to simulated response.");
  }
}
