
import React, { useState, useEffect } from 'react';
import { Battery, Info, Crown, Check } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/use-user";

interface CreditsDisplayProps {
  currentCredits: number;
  maxCredits: number;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  currentCredits, 
  maxCredits 
}) => {
  const { toast } = useToast();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business'>('free');
  const [isUpdating, setIsUpdating] = useState(false);
  const { setUserCredits, user } = useUser();
  
  // Calculate percentage for visual display
  const percentage = Math.round((currentCredits / maxCredits) * 100);
  
  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  // Determine color based on remaining credits
  const getColorClass = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleUpgradeClick = () => {
    setIsUpgradeOpen(true);
    setSelectedPlan('pro'); // Default to pro plan
  };
  
  const handleUpgradePlan = async () => {
    if (!user) {
      // If user is not logged in, let them view the plans, but show a message
      // when they try to actually upgrade
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your plan.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Set the new max credits based on the selected plan
      const newMaxCredits = selectedPlan === 'free' ? 3 : selectedPlan === 'pro' ? 50 : 999;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: selectedPlan,
          max_credits: newMaxCredits,
          // Reset credits_used to give them full credits immediately
          credits_used: 0
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update UI state
      setUserCredits({
        current: newMaxCredits,
        max: newMaxCredits
      });
      
      toast({
        title: "Plan Upgraded",
        description: `You've successfully upgraded to the ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan!`,
      });
      
      setIsUpgradeOpen(false);
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Upgrade Failed",
        description: "There was a problem upgrading your plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 py-1 px-2 rounded-full bg-muted/30 text-xs font-medium cursor-help group">
              <Battery className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">
                {currentCredits}/{maxCredits} Credits
              </span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-in-out ${getColorClass()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 hidden group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgradeClick();
                }}
              >
                <Crown className="h-3 w-3 text-primary" />
              </Button>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="max-w-[200px]">
            <p>Free plan: {currentCredits} of {maxCredits} daily credits remaining</p>
            <p className="text-xs text-muted-foreground mt-1">Credits reset every 24 hours</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade your plan</DialogTitle>
            <DialogDescription>
              Get more credits and features with our premium plans
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div 
              className={`rounded-lg border p-4 relative cursor-pointer transition-all ${selectedPlan === 'free' ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedPlan('free')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-full">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium">Free Plan</h3>
                </div>
                {selectedPlan === 'free' && (
                  <div className="text-primary bg-primary/10 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="h-2" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentCredits}/{maxCredits}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">3 credits per day</p>
                <p className="text-sm text-muted-foreground">Basic features</p>
              </div>
            </div>

            <div 
              className={`rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer transition-all ${selectedPlan === 'pro' ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedPlan('pro')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-1.5 rounded-full">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium">Pro Plan</h3>
                </div>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Popular
                </span>
                {selectedPlan === 'pro' && (
                  <div className="text-primary bg-primary/10 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">$9.99/month</p>
                <p className="text-sm">50 credits per day</p>
                <p className="text-sm">Advanced features</p>
                <p className="text-sm">Priority support</p>
              </div>
            </div>

            <div 
              className={`rounded-lg border p-4 cursor-pointer transition-all ${selectedPlan === 'business' ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedPlan('business')}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-1.5 rounded-full">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-medium">Business Plan</h3>
                </div>
                {selectedPlan === 'business' && (
                  <div className="text-primary bg-primary/10 p-1 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">$24.99/month</p>
                <p className="text-sm">Unlimited credits</p>
                <p className="text-sm">All premium features</p>
                <p className="text-sm">Dedicated support</p>
                <p className="text-sm">API access</p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={handleUpgradePlan}
            disabled={isUpdating}
          >
            {isUpdating ? 'Upgrading...' : user ? 'Upgrade Now' : 'Login to Upgrade'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreditsDisplay;
