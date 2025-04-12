
import React from 'react';
import { Loader2 } from 'lucide-react';
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
  isProcessing,
  generatedCode
}) => {
  if (!isProcessing && !generatedCode) return null;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isProcessing && (
        <div className="rounded-lg border p-6 glass flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="mt-6 font-medium">Processing your image...</p>
          <p className="text-sm text-muted-foreground mt-2">This might take a few seconds</p>
        </div>
      )}

      {/* Code Preview */}
      {generatedCode && (
        <div className="space-y-5">
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
