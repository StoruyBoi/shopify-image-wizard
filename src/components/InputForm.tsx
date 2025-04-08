
import React from 'react';
import { ImageOptions } from './OptionsSelector';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-200 mb-3">Additional Information</h3>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-app-purple focus:border-transparent outline-none"
          placeholder="Enter title text"
        />
      </div>

      {selectedOptions.purpose !== 'product' && (
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-app-purple focus:border-transparent outline-none"
            placeholder="Enter description text"
          />
        </div>
      )}

      {selectedOptions.showPrice && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
            Price
          </label>
          <input
            id="price"
            name="price"
            type="text"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-app-purple focus:border-transparent outline-none"
            placeholder="e.g. $99.99"
          />
        </div>
      )}

      {(selectedOptions.purpose === 'banner' || selectedOptions.purpose === 'slider') && (
        <div>
          <label htmlFor="callToAction" className="block text-sm font-medium text-gray-300 mb-1">
            Call-to-Action Text
          </label>
          <input
            id="callToAction"
            name="callToAction"
            type="text"
            value={formData.callToAction}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-app-purple focus:border-transparent outline-none"
            placeholder="e.g. Shop Now"
          />
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-gradient-to-r from-app-purple to-app-blue rounded-md text-white font-medium hover:opacity-90 transition-opacity"
      >
        Generate Image
      </button>
    </form>
  );
};

export default InputForm;
