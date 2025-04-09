
import React, { useState } from 'react';
import { Check, Copy, Code as CodeIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ 
  code, 
  language = 'liquid', 
  title = 'Generated Shopify Liquid Code' 
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Code copied to clipboard",
      description: "You can now paste it into your Shopify theme editor",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border overflow-hidden glass">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <CodeIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="p-4 bg-muted/10 relative">
        <pre className="text-xs md:text-sm overflow-x-auto max-h-96 p-2 rounded bg-background/50 border">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;
