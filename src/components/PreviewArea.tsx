
import React, { useState, useEffect } from 'react';
import { Loader2, Bot, AlertCircle, Terminal, Server, ArrowRight } from 'lucide-react';
import CodePreview from './CodePreview';
import { Skeleton } from './ui/skeleton';

interface PreviewAreaProps {
  previewUrl: string | null;
  isProcessing: boolean;
  generatedCode?: {
    code: string;
    shopifyLiquid: string;
  } | null;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ 
  previewUrl,
  isProcessing,
  generatedCode
}) => {
  const [displayCode, setDisplayCode] = useState<string>('');
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  
  // Helper to combine code and schema into a single Shopify section
  const combineCodeAndSchema = (code: string, schema: string): string => {
    // Remove HTML tags if present
    const cleanCode = code.replace(/<\/?html>/g, '').trim();
    return `<!-- HTML/Liquid Template for Shopify Section -->\n${cleanCode}\n\n${schema}`;
  };
  
  // Get the combined code for display
  const getCombinedCode = (): string => {
    if (!generatedCode) return '';
    return combineCodeAndSchema(generatedCode.code, generatedCode.shopifyLiquid);
  };
  
  // Animation timers
  useEffect(() => {
    if (isProcessing && !isGeneratingAnimation) {
      setIsGeneratingAnimation(true);
      setDisplayCode('');
      setCurrentLine(0);
    }
    
    if (!isProcessing && generatedCode && isGeneratingAnimation) {
      // Start the animated typing effect when code is ready
      const combinedCode = combineCodeAndSchema(generatedCode.code, generatedCode.shopifyLiquid);
      let codeLines = combinedCode.split('\n');
      let codeCurrent = '';
      let lineIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (lineIndex < codeLines.length) {
          codeCurrent += codeLines[lineIndex] + '\n';
          setDisplayCode(codeCurrent);
          setCurrentLine(lineIndex);
          lineIndex++;
        } else {
          clearInterval(typingInterval);
          setIsGeneratingAnimation(false);
          setDisplayCode(combinedCode);
        }
      }, 50); // Speed of typing animation
      
      return () => clearInterval(typingInterval);
    }
  }, [isProcessing, generatedCode, isGeneratingAnimation]);

  if (!isProcessing && !generatedCode) return null;

  return (
    <div className="space-y-6 rounded-lg border p-5 glass">
      {/* Loading State */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="mt-6 font-medium">Analyzing your design...</p>
          <p className="text-sm text-muted-foreground mt-2">This might take a few seconds</p>
          
          <div className="w-full max-w-lg mt-8">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            <div className="mt-6 bg-background/50 rounded-md p-3 border border-dashed border-muted overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-primary" />
                <p className="text-xs font-mono text-primary">Generating code...</p>
              </div>
              <div className="animate-pulse space-y-1 font-mono text-xs">
                <div className="h-3 bg-muted w-5/6 rounded" />
                <div className="h-3 bg-muted w-3/4 rounded" />
                <div className="h-3 bg-muted w-4/5 rounded" />
                <div className="h-3 bg-muted w-2/3 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Preview */}
      {generatedCode && (
        <div className="space-y-5">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/20 rounded-full p-3 flex-shrink-0">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Your Shopify code is ready!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                I've analyzed your requirements and created Shopify Liquid code that matches your needs.
                You can copy this code directly into your Shopify theme.
              </p>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium mb-2">
                    CORS Limitation: Using Mock Code
                  </p>
                  <p className="text-sm text-yellow-700">
                    This demo is using sample code due to CORS restrictions that prevent browser-based 
                    applications from directly calling the Claude API.
                  </p>
                  <div className="mt-3 p-3 bg-white/60 rounded border border-yellow-100 text-xs font-mono text-yellow-800">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5" />
                        <span className="font-medium">Next.js Solution:</span>
                      </p>
                      <p className="pl-5 flex items-start">
                        <ArrowRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Create API route at <code>pages/api/claude.js</code></span>
                      </p>
                      <p className="pl-5 flex items-start">
                        <ArrowRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Add Claude API key to <code>.env.local</code></span>
                      </p>
                      <p className="pl-5 flex items-start">
                        <ArrowRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Update client fetch to call your API route</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <CodePreview 
            code={isGeneratingAnimation ? displayCode : getCombinedCode()} 
            title="HTML/Liquid Template" 
            isGenerating={isGeneratingAnimation}
            currentLine={currentLine}
          />
        </div>
      )}
    </div>
  );
};

export default PreviewArea;
