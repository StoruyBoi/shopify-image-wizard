
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { SidebarProvider } from "./components/ui/sidebar";
import { createContext, useState, useEffect, useContext } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

// User context to manage authentication state
interface UserContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  userCredits: {
    current: number;
    max: number;
  };
  setUserCredits: React.Dispatch<React.SetStateAction<{
    current: number;
    max: number;
  }>>;
  activeChat: string | null;
  setActiveChat: React.Dispatch<React.SetStateAction<string | null>>;
}

export const UserContext = createContext<UserContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  userCredits: { current: 3, max: 3 },
  setUserCredits: () => {},
  activeChat: null,
  setActiveChat: () => {}
});

export const useUser = () => useContext(UserContext);

const App = () => {
  // Check local storage for login state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const stored = localStorage.getItem('isLoggedIn');
    return stored ? JSON.parse(stored) : false;
  });
  
  // Check local storage for credits
  const [userCredits, setUserCredits] = useState(() => {
    const stored = localStorage.getItem('userCredits');
    return stored ? JSON.parse(stored) : { current: 3, max: 3 };
  });
  
  // Track active chat
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  // Persist login state and credits to localStorage
  useEffect(() => {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);
  
  useEffect(() => {
    localStorage.setItem('userCredits', JSON.stringify(userCredits));
  }, [userCredits]);
  
  // Reset credits daily
  useEffect(() => {
    const checkAndResetCredits = () => {
      const lastReset = localStorage.getItem('lastCreditReset');
      const now = new Date().setHours(0, 0, 0, 0); // Start of today
      
      if (!lastReset || parseInt(lastReset) < now) {
        setUserCredits(prev => ({ ...prev, current: prev.max }));
        localStorage.setItem('lastCreditReset', now.toString());
      }
    };
    
    checkAndResetCredits();
    
    // Check daily
    const interval = setInterval(checkAndResetCredits, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <UserContext.Provider value={{ 
            isLoggedIn, 
            setIsLoggedIn, 
            userCredits, 
            setUserCredits,
            activeChat,
            setActiveChat
          }}>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SidebarProvider>
          </UserContext.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
