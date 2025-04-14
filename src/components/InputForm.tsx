
import React, { useState } from 'react';
import { ImageOptions } from './OptionsSelector';
import { Button } from './ui/button';
import { Info } from 'lucide-react';

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
