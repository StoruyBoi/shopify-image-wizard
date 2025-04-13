
import React from 'react';
import { Loader2, Bot, AlertCircle } from 'lucide-react';
import CodePreview from './CodePreview';

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
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Due to CORS restrictions, this is using sample code. In a production environment, 
                    you would need a backend proxy server to make requests to the Claude API.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <CodePreview 
            code={generatedCode.code} 
            title="HTML/Liquid Template" 
          />
          
          <CodePreview 
            code={generatedCode.shopifyLiquid} 
            title="Shopify Schema" 
          />
        </div>
      )}
    </div>
  );
};

export default PreviewArea;
