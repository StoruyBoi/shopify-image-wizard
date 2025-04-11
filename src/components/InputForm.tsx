
import React from 'react';
import { ImageOptions } from './OptionsSelector';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface InputFormProps {
  selectedOptions: ImageOptions;
  onSubmit: (formData: FormData) => void;
}

interface FormData {
  title?: string;
  description?: string;
}

const InputForm: React.FC<InputFormProps> = ({ selectedOptions, onSubmit }) => {
  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-5 glass">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title (Brief description)
        </label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full bg-background"
          placeholder="Enter a title for your section"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Requirements
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base resize-none"
          placeholder="Enter specific requirements for the section (colors, layout, features, etc.)"
        />
      </div>

      <Button
        type="submit"
        className="w-full py-6 bg-gradient-to-r from-app-purple to-app-blue hover:opacity-90 transition-opacity"
      >
        Generate Code
      </Button>
    </form>
  );
};

export default InputForm;
