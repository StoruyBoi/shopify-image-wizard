
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
  price?: string;
  callToAction?: string;
}

const InputForm: React.FC<InputFormProps> = ({ selectedOptions, onSubmit }) => {
  const [formData, setFormData] = React.useState<FormData>({
    title: '',
    description: '',
    price: '',
    callToAction: '',
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
          Title
        </label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full bg-background"
          placeholder="Enter title text"
        />
      </div>

      {selectedOptions.purpose !== 'product' && (
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 rounded-md border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base resize-none"
            placeholder="Enter description text"
          />
        </div>
      )}

      {selectedOptions.showPrice && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price
          </label>
          <Input
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full bg-background"
            placeholder="e.g. $99.99"
          />
        </div>
      )}

      {(selectedOptions.purpose === 'banner' || selectedOptions.purpose === 'slider') && (
        <div>
          <label htmlFor="callToAction" className="block text-sm font-medium mb-1">
            Call-to-Action Text
          </label>
          <Input
            id="callToAction"
            name="callToAction"
            value={formData.callToAction}
            onChange={handleChange}
            className="w-full bg-background"
            placeholder="e.g. Shop Now"
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full py-6 bg-gradient-to-r from-app-purple to-app-blue hover:opacity-90 transition-opacity"
      >
        Generate Image
      </Button>
    </form>
  );
};

export default InputForm;
