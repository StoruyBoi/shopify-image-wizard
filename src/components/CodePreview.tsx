
import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Code as CodeIcon, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
  codeRef?: React.RefObject<HTMLPreElement>;
}

const CodePreview: React.FC<CodePreviewProps> = ({ 
  code, 
  language = 'liquid', 
  title = 'Generated Shopify Liquid Code',
  codeRef: externalCodeRef
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const internalCodeRef = useRef<HTMLPreElement>(null);
  const codeRef = externalCodeRef || internalCodeRef;

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
    
    // Determine file extension based on content
    let extension = 'liquid';
    if (code.includes('{% schema %}')) {
      extension = 'liquid';
    } else if (code.includes('<style>')) {
      extension = 'html';
    }
    
    // Generate a more descriptive filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sectionType = title.toLowerCase().replace(/\s+/g, '-');
    a.download = `shopify-${sectionType}-${timestamp}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Code downloaded",
      description: "You can now use it in your Shopify theme editor",
    });
  };

  // Enhanced syntax highlighting
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
      
      // More comprehensive syntax highlighting for Shopify Liquid
      let highlightedCode = escapedCode
        // Liquid tags
        .replace(/({%.*?%})/g, '<span class="text-blue-500 font-semibold">$1</span>')
        // Liquid variables
        .replace(/({{.*?}})/g, '<span class="text-green-500 font-semibold">$1</span>')
        // HTML tags
        .replace(/(&lt;[\/]?[a-zA-Z0-9\-]+)(\s.*?)?(&gt;)/g, '<span class="text-purple-500">$1$2$3</span>')
        // HTML attributes
        .replace(/(\s+[a-zA-Z0-9\-_]+)=(&quot;.*?&quot;)/g, '<span class="text-yellow-500">$1</span>=<span class="text-orange-400">$2</span>')
        // CSS properties
        .replace(/([a-zA-Z\-]+:)(.*?)(;)/g, '<span class="text-pink-400">$1</span><span class="text-blue-300">$2</span><span class="text-pink-400">$3</span>')
        // Comments
        .replace(/(&lt;!--.*?--&gt;)/g, '<span class="text-gray-500">$1</span>')
        // JSON keys in schema
        .replace(/(&quot;[a-zA-Z0-9_\-]+&quot;)(\s*:)/g, '<span class="text-yellow-400">$1</span>$2');
      
      // Apply schema-specific highlighting
      if (highlightedCode.includes('schema')) {
        highlightedCode = highlightedCode
          .replace(/({% schema %})/, '<span class="text-red-500 font-bold">$1</span>')
          .replace(/({% endschema %})/, '<span class="text-red-500 font-bold">$1</span>');
      }
      
      codeRef.current.innerHTML = highlightedCode;
      
      // Add line numbers
      const addLineNumbers = () => {
        if (!codeRef.current) return;
        
        const codeLines = code.split('\n');
        if (codeLines.length > 5) {
          const linesContainer = document.createElement('div');
          linesContainer.className = 'line-numbers';
          linesContainer.style.position = 'absolute';
          linesContainer.style.left = '0';
          linesContainer.style.top = '0';
          linesContainer.style.padding = '0.5rem 0';
          linesContainer.style.borderRight = '1px solid rgba(100, 100, 100, 0.2)';
          linesContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          linesContainer.style.textAlign = 'right';
          linesContainer.style.userSelect = 'none';
          linesContainer.style.color = 'rgba(100, 100, 100, 0.6)';
          linesContainer.style.fontSize = 'inherit';
          linesContainer.style.fontFamily = 'monospace';
          
          for (let i = 1; i <= codeLines.length; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.textContent = String(i);
            lineNumber.style.padding = '0 0.5rem';
            linesContainer.appendChild(lineNumber);
          }
          
          const parentContainer = codeRef.current.parentElement;
          if (parentContainer) {
            parentContainer.style.position = 'relative';
            parentContainer.style.paddingLeft = '2.5rem';
            parentContainer.appendChild(linesContainer);
          }
        }
      };
      
      // Only add line numbers for longer code blocks
      if (code.split('\n').length > 5) {
        // Remove existing line numbers if any
        const existingLineNumbers = codeRef.current.parentElement?.querySelector('.line-numbers');
        if (existingLineNumbers) {
          existingLineNumbers.remove();
        }
        
        // Add new line numbers
        setTimeout(addLineNumbers, 0);
      }
    }
  }, [code, codeRef]);

  return (
    <div className="rounded-lg border overflow-hidden glass">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <CodeIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
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
      </div>
      
      <div className="p-4 bg-muted/10 relative">
        <pre 
          ref={codeRef}
          className="text-xs md:text-sm overflow-x-auto max-h-[400px] p-4 rounded bg-background/80 border font-mono"
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;
