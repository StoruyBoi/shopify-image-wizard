
import React from 'react';
import { Check } from 'lucide-react';

export type ImagePurpose = 'product' | 'slider' | 'banner' | 'collection' | 'announcement' | 'footer' | 'header' | 'image-with-text' | 'multicolumn';
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
    title: 'Product Section',
    description: 'Product details with images and info',
    icon: '🛍️'
  },
  {
    value: 'slider',
    title: 'Slideshow',
    description: 'Multiple images in a carousel',
    icon: '🔄'
  },
  {
    value: 'banner',
    title: 'Image Banner',
    description: 'Large image with overlay text',
    icon: '🏷️'
  },
  {
    value: 'collection',
    title: 'Collection List',
    description: 'Grid of product collections',
    icon: '📦'
  },
  {
    value: 'announcement',
    title: 'Announcement Bar',
    description: 'Top of page announcements',
    icon: '📢'
  },
  {
    value: 'header',
    title: 'Header',
    description: 'Navigation menu and logo',
    icon: '🔝'
  },
  {
    value: 'footer',
    title: 'Footer',
    description: 'Links and info at page bottom',
    icon: '🔚'
  },
  {
    value: 'image-with-text',
    title: 'Image with Text',
    description: 'Image alongside text content',
    icon: '📝'
  },
  {
    value: 'multicolumn',
    title: 'Multi-column',
    description: 'Content in multiple columns',
    icon: '🏛️'
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
        <h3 className="text-base font-medium mb-3">Shopify Section Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handlePurposeSelect(option.value)}
              className={`p-3 rounded-lg border transition-all cursor-pointer
                ${selectedOptions.purpose === option.value 
                  ? 'border-app-purple bg-app-purple/10' 
                  : 'border-border bg-card/50 hover:border-muted-foreground/50'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <div className="text-xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{option.title}</h4>
                    {selectedOptions.purpose === option.value && (
                      <Check className="h-3.5 w-3.5 text-app-purple" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-medium mb-3">Additional Options</h3>
        <div className="space-y-2">
          <div 
            onClick={() => handleToggleOption('showPrice')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.showPrice 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-border bg-card/50 hover:border-muted-foreground/50'
              }
            `}
          >
            <span>Show Price</span>
            {selectedOptions.showPrice && <Check className="h-4 w-4 text-app-purple" />}
          </div>
          
          <div 
            onClick={() => handleToggleOption('showRating')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.showRating 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-border bg-card/50 hover:border-muted-foreground/50'
              }
            `}
          >
            <span>Show Rating</span>
            {selectedOptions.showRating && <Check className="h-4 w-4 text-app-purple" />}
          </div>
          
          <div 
            onClick={() => handleToggleOption('includeText')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between
              ${selectedOptions.includeText 
                ? 'border-app-purple bg-app-purple/10' 
                : 'border-border bg-card/50 hover:border-muted-foreground/50'
              }
            `}
          >
            <span>Include Text Overlay</span>
            {selectedOptions.includeText && <Check className="h-4 w-4 text-app-purple" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsSelector;
