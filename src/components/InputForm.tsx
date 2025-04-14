
import React, { useState } from 'react';
import { ImageOptions } from './OptionsSelector';
import { Button } from './ui/button';
import { Info, Server, ArrowRight } from 'lucide-react';

interface InputFormProps {
  selectedOptions: ImageOptions;
  onSubmit: (requirements: string) => void;
}

const InputForm: React.FC<InputFormProps> = ({ selectedOptions, onSubmit }) => {
  const [requirements, setRequirements] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequirements(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(requirements);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-5 glass">
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium mb-1">
          Requirements
        </label>
        <textarea
          id="requirements"
          name="requirements"
          value={requirements}
          onChange={handleChange}
          rows={5}
          className="w-full p-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base resize-none"
          placeholder="Enter specific requirements for your section (optional)"
        />
        
        <div className="mt-3 p-3 bg-blue-50/30 border border-blue-200 rounded-md flex items-start gap-2 text-sm">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700">
            <p className="font-medium mb-1">Demo Mode Active</p>
            <p>Due to CORS restrictions, this demo uses mock responses instead of actual Claude API calls.</p>
          </div>
        </div>

        <div className="mt-3 p-4 bg-green-50/30 border border-green-200 rounded-md">
          <h4 className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
            <Server className="h-4 w-4" />
            Next.js Implementation Guide
          </h4>
          <p className="text-xs text-green-700 mb-2">
            To use the actual Claude API, create a Next.js API route that acts as a proxy:
          </p>
          <div className="bg-white/60 rounded text-xs p-3 font-mono text-green-900 space-y-1 overflow-x-auto">
            <p className="whitespace-nowrap">
              <span className="text-green-600">// pages/api/generate.js</span>
            </p>
            <p className="whitespace-nowrap">export default async function handler(req, res) {'{'}</p>
            <p className="whitespace-nowrap pl-2">if (req.method !== 'POST') return res.status(405).end();</p>
            <p className="whitespace-nowrap pl-2">const {'{ sectionType, requirements, imageBase64 }'} = req.body;</p>
            <p className="whitespace-nowrap pl-2">const response = await fetch('https://api.anthropic.com/v1/messages', {'{'}</p>
            <p className="whitespace-nowrap pl-4">method: 'POST',</p>
            <p className="whitespace-nowrap pl-4">headers: {'{'}</p>
            <p className="whitespace-nowrap pl-6">'x-api-key': process.env.CLAUDE_API_KEY,</p>
            <p className="whitespace-nowrap pl-6">'anthropic-version': '2023-06-01',</p>
            <p className="whitespace-nowrap pl-6">'content-type': 'application/json'</p>
            <p className="whitespace-nowrap pl-4">{'}'},</p>
            <p className="whitespace-nowrap pl-4">body: JSON.stringify({/* Claude request body */})</p>
            <p className="whitespace-nowrap pl-2">{'}'});</p>
            <p className="whitespace-nowrap pl-2">const data = await response.json();</p>
            <p className="whitespace-nowrap pl-2">return res.status(200).json(data);</p>
            <p className="whitespace-nowrap">{'}'}</p>
          </div>
          <div className="mt-2 flex items-center text-xs text-green-700">
            <ArrowRight className="h-3 w-3 mr-1" />
            <span>Then update the client code to call this API route instead of directly calling Claude.</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full py-6 bg-gradient-to-r from-app-purple to-app-blue hover:opacity-90 transition-opacity"
      >
        Generate Shopify Code
      </Button>
    </form>
  );
};

export default InputForm;
