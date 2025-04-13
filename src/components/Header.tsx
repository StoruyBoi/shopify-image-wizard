
import React from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import CreditsDisplay from './CreditsDisplay';
import UserSettingsMenu from './UserSettingsMenu';

interface HeaderProps {
  userCredits?: {
    current: number;
    max: number;
  };
}

const Header: React.FC<HeaderProps> = ({ 
  userCredits = { current: 1, max: 3 } 
}) => {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-gradient-to-br from-app-purple to-app-blue flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Shopify Image Wizard</h1>
        </div>
        <div className="flex items-center gap-4">
          <CreditsDisplay 
            currentCredits={userCredits.current} 
            maxCredits={userCredits.max} 
          />
          <div className="text-sm text-muted-foreground hidden md:block">
            Powered by Claude 3.7
          </div>
          <ThemeToggle />
          <UserSettingsMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
