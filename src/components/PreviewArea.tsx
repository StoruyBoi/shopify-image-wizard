
import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface PreviewAreaProps {
  previewUrl: string | null;
  isProcessing: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ previewUrl, isProcessing }) => {
  if (!previewUrl && !isProcessing) return null;

  return (
    <div className="rounded-lg border overflow-hidden glass">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-medium">Preview</h3>
        {previewUrl && !isProcessing && (
          <Button variant="ghost" size="sm" className="gap-1 text-sm hover:text-primary">
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
  );
};

export default PreviewArea;
