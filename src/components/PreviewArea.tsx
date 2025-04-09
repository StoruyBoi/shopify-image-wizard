
import React from 'react';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
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
  if (!previewUrl && !isProcessing && !generatedCode) return null;

  const handleDownload = () => {
    if (previewUrl) {
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = 'shopify-section-preview.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <div className="rounded-lg border overflow-hidden glass">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Image Preview</h3>
          </div>
          {previewUrl && !isProcessing && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-sm hover:text-primary"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          )}
        </div>
        
        <div className="p-6 flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
              </div>
              <p className="mt-6 font-medium">Processing your image...</p>
              <p className="text-sm text-muted-foreground mt-2">This might take a few seconds</p>
            </div>
          ) : previewUrl ? (
            <div className="relative max-w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-app-blue/5 pointer-events-none rounded-md"></div>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full h-auto rounded-md relative z-10 shadow-lg" 
              />
            </div>
          ) : null}
        </div>
      </div>

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
