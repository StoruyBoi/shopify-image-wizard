
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Bot, AlertCircle, Terminal } from 'lucide-react';
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
  const [displaySchema, setDisplaySchema] = useState<string>('');
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  
  // Animation timers
  useEffect(() => {
    if (isProcessing && !isGeneratingAnimation) {
      setIsGeneratingAnimation(true);
      setDisplayCode('');
      setDisplaySchema('');
      setCurrentLine(0);
    }
    
    if (!isProcessing && generatedCode && isGeneratingAnimation) {
      // Start the animated typing effect when code is ready
      let codeLines = generatedCode.code.split('\n');
      let schemaLines = generatedCode.shopifyLiquid.split('\n');
      let codeCurrent = '';
      let schemaCurrent = '';
      let lineIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (lineIndex < codeLines.length) {
          codeCurrent += codeLines[lineIndex] + '\n';
          setDisplayCode(codeCurrent);
          setCurrentLine(lineIndex);
          lineIndex++;
        } else if (lineIndex < codeLines.length + schemaLines.length) {
          const schemaIndex = lineIndex - codeLines.length;
          schemaCurrent += schemaLines[schemaIndex] + '\n';
          setDisplaySchema(schemaCurrent);
          lineIndex++;
        } else {
          clearInterval(typingInterval);
          setIsGeneratingAnimation(false);
          setDisplayCode(generatedCode.code);
          setDisplaySchema(generatedCode.shopifyLiquid);
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
                    Demo Mode: Using Sample Code
                  </p>
                  <p className="text-sm text-yellow-700">
                    This demo is using sample code due to CORS restrictions. In a production environment, 
                    you would need a backend proxy server to make requests to the Claude API.
                  </p>
                  <div className="mt-3 p-3 bg-white/60 rounded border border-yellow-100 text-xs font-mono text-yellow-800">
                    <p className="mb-1"><span className="font-semibold">Frontend:</span> React app (localhost:8080)</p>
                    <p className="mb-1"><span className="font-semibold">Backend Proxy:</span> Simple Express server</p>
                    <p><span className="font-semibold">API:</span> Claude API (api.anthropic.com)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <CodePreview 
            code={isGeneratingAnimation ? displayCode : generatedCode.code} 
            title="HTML/Liquid Template" 
            isGenerating={isGeneratingAnimation}
            currentLine={currentLine}
          />
          
          <CodePreview 
            code={isGeneratingAnimation ? displaySchema : generatedCode.shopifyLiquid} 
            title="Shopify Schema" 
            isGenerating={isGeneratingAnimation}
          />
        </div>
      )}
    </div>
  );
};

export default PreviewArea;
