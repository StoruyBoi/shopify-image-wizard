
import React from 'react';
import { Battery, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditsDisplayProps {
  currentCredits: number;
  maxCredits: number;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  currentCredits, 
  maxCredits 
}) => {
  // Calculate percentage for visual display
  const percentage = Math.round((currentCredits / maxCredits) * 100);
  
  // Determine color based on remaining credits
  const getColorClass = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 py-1 px-2 rounded-full bg-muted/30 text-xs font-medium cursor-help">
            <Battery className="h-3.5 w-3.5" />
            <span>
              {currentCredits}/{maxCredits} Credits
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getColorClass()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Free plan: {currentCredits} of {maxCredits} daily credits remaining</p>
          <p className="text-xs text-muted-foreground mt-1">Credits reset every 24 hours</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreditsDisplay;
