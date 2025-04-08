
import React from 'react';
import { Check } from 'lucide-react';

export type ImagePurpose = 'product' | 'slider' | 'banner' | 'collection';
export type ImageOptions = {
  purpose: ImagePurpose;
  showRating?: boolean;
  showPrice?: boolean;
  includeText?: boolean;
};

const options: Array<{
  value: ImagePurpose;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'product',
    title: 'Product Image',
    description: 'Optimized for product displays',
    icon: '🛍️'
  },
  {
    value: 'slider',
    title: 'Slider Image',
    description: 'For homepage carousels',
    icon: '🔄'
  },
  {
    value: 'banner',
    title: 'Banner',
    description: 'For promotional banners',
    icon: '🏷️'
  },
  {
    value: 'collection',
    title: 'Collection',
    description: 'For product categories',
    icon: '📦'
  }
];

interface OptionsSelectorProps {
  selectedOptions: ImageOptions;
  onOptionsChange: (options: ImageOptions) => void;
}

const OptionsSelector: React.FC<OptionsSelectorProps> = ({ 
  selectedOptions, 
  onOptionsChange 
}) => {
  const handlePurposeSelect = (purpose: ImagePurpose) => {
    onOptionsChange({ ...selectedOptions, purpose });
  };

  const handleToggleOption = (option: keyof Omit<ImageOptions, 'purpose'>) => {
    onOptionsChange({ 
      ...selectedOptions, 
      [option]: !selectedOptions[option] 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-200 mb-3">Image Purpose</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handlePurposeSelect(option.value)}
              className={`p-4 rounded-lg border transition-all cursor-pointer
                ${selectedOptions.purpose === option.value 
                  ? 'border-app-purple bg-app-purple/10' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-200">{option.title}</h4>
                    {selectedOptions.purpose === option.value && (
                      <Check className="h-4 w-4 text-app-purple" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-200 mb-3">Additional Options</h3>
        <div className="space-y-2">
          <div 
            onClick={() => handleToggleOption('showPrice')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.showPrice 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }
            `}
          >
            <span className="text-gray-300">Show Price</span>
            {selectedOptions.showPrice && <Check className="h-4 w-4 text-app-purple" />}
          </div>
          
          <div 
            onClick={() => handleToggleOption('showRating')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.showRating 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }
            `}
          >
            <span className="text-gray-300">Show Rating</span>
            {selectedOptions.showRating && <Check className="h-4 w-4 text-app-purple" />}
          </div>
          
          <div 
            onClick={() => handleToggleOption('includeText')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.includeText 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }
            `}
          >
            <span className="text-gray-300">Include Text Overlay</span>
            {selectedOptions.includeText && <Check className="h-4 w-4 text-app-purple" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsSelector;
