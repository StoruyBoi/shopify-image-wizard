
import React from 'react';
import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-app-purple" />
          <h1 className="text-xl font-bold text-white">Shopify Image Wizard</h1>
        </div>
        <div className="text-sm text-gray-400">
          Powered by Claude 3.7
        </div>
      </div>
    </header>
  );
};

export default Header;
