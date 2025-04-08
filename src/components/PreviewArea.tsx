
import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface PreviewAreaProps {
  previewUrl: string | null;
  isProcessing: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ previewUrl, isProcessing }) => {
  if (!previewUrl && !isProcessing) return null;

  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-medium text-gray-200">Preview</h3>
        {previewUrl && !isProcessing && (
          <button className="flex items-center gap-1 text-sm text-app-purple hover:text-app-blue transition-colors">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        )}
      </div>
      
      <div className="p-6 flex items-center justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-12 w-12 text-app-purple animate-spin mb-4" />
            <p className="text-gray-400">Processing your image...</p>
            <p className="text-sm text-gray-500 mt-2">This might take a few seconds</p>
          </div>
        ) : previewUrl ? (
          <div className="relative max-w-full">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full h-auto rounded-md shadow-lg" 
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PreviewArea;
