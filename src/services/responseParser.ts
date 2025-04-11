
interface GenerateCodeResponse {
  code: string;
  shopifyLiquid: string;
}

// Helper function to parse Claude's response
export function parseClaudeResponse(response: any): GenerateCodeResponse {
  try {
    // Extract the content from Claude's response
    const content = response.content[0].text;
    
    // Try to extract HTML code and schema code sections
    const htmlMatch = content.match(/<html>([\s\S]*?)<\/html>/);
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    const schemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/);
    
    if (htmlMatch && schemaMatch) {
      const htmlCode = htmlMatch[1].trim();
      const styleCode = styleMatch ? styleMatch[1].trim() : '';
      const schemaCode = schemaMatch[1].trim();
      
      return {
        code: `${htmlCode}\n\n<style>\n${styleCode}\n</style>`,
        shopifyLiquid: `{% schema %}\n${schemaCode}\n{% endschema %}`
      };
    }
    
    // Fallback to another format if the first approach fails
    const codeMatch = content.match(/```(html|liquid)([\s\S]*?)```/);
    const schemaMatchAlt = content.match(/```(json|liquid)([\s\S]*?)({% schema %})([\s\S]*?)({% endschema %})([\s\S]*?)```/);
    
    if (codeMatch && schemaMatchAlt) {
      return {
        code: codeMatch[2].trim(),
        shopifyLiquid: `{% schema %}${schemaMatchAlt[4].trim()}{% endschema %}`
      };
    }
    
    // If we can't parse it properly, throw an error
    throw new Error("Could not parse Claude response");
  } catch (error) {
    console.error("Error parsing Claude response:", error, response);
    throw new Error("Failed to parse the response from Claude. Falling back to simulated response.");
  }
}
