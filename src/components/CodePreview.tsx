
import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Code as CodeIcon, Download, Terminal } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
  codeRef?: React.RefObject<HTMLPreElement>;
  isGenerating?: boolean;
  currentLine?: number;
}

const CodePreview: React.FC<CodePreviewProps> = ({ 
  code, 
  language = 'liquid', 
  title = 'Generated Shopify Liquid Code',
  codeRef: externalCodeRef,
  isGenerating = false,
  currentLine = 0
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const internalCodeRef = useRef<HTMLPreElement>(null);
  const codeRef = externalCodeRef || internalCodeRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Code copied to clipboard",
      description: "You can now paste it into your Shopify theme editor",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopify-${language}-code.liquid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Code downloaded",
      description: "You can now use it in your Shopify theme editor",
    });
  };

  // Add syntax highlighting effect
  useEffect(() => {
    if (codeRef.current) {
      // Escape HTML entities first
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };
      
      const escapedCode = escapeHtml(code);
      
      // Simple syntax highlighting for Liquid
      const highlightedCode = escapedCode
        .replace(/({%.*?%})/g, '<span class="text-blue-400">$1</span>')
        .replace(/({{.*?}})/g, '<span class="text-green-400">$1</span>')
        .replace(/(&lt;.*?&gt;)/g, '<span class="text-purple-400">$1</span>');
      
      codeRef.current.innerHTML = highlightedCode;
      
      // Auto-scroll to the latest line when generating
      if (isGenerating && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [code, codeRef, isGenerating]);

  return (
    <div className="rounded-lg border overflow-hidden glass">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <CodeIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{title}</h3>
          {isGenerating && (
            <div className="flex items-center gap-1.5 ml-2 text-xs text-primary font-mono">
              <Terminal className="h-3 w-3 animate-pulse" />
              <span className="animate-pulse">Generating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            disabled={isGenerating}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            disabled={isGenerating}
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
      </div>
      
      <div className="p-4 bg-muted/10 relative">
        <div 
          ref={containerRef}
          className="overflow-y-auto max-h-96"
        >
          <pre 
            ref={codeRef}
            className={`text-xs md:text-sm p-2 rounded bg-background/50 border ${isGenerating ? 'border-primary/40' : 'border-border'}`}
          >
            <code>{code}</code>
          </pre>
          
          {isGenerating && code && (
            <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground text-xs py-1 px-2 rounded">
              Line {code.split('\n').length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
