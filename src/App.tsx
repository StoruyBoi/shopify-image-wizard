
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
import { supabase } from "./lib/supabase";
import { Session, User } from '@supabase/supabase-js';
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const stored = localStorage.getItem('isLoggedIn');
    return stored ? JSON.parse(stored) : false;
  });
  
  const [userCredits, setUserCredits] = useState(() => {
    const stored = localStorage.getItem('userCredits');
    return stored ? JSON.parse(stored) : { current: 3, max: 3 };
  });
  
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setIsLoggedIn(!!session);
        
        if (session?.user) {
          setTimeout(() => {
            supabase
              .from('profiles')
              .select('credits_used, max_credits')
              .eq('id', session.user.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setUserCredits({
                    current: data.max_credits - data.credits_used,
                    max: data.max_credits
                  });
                }
              });
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);
  
  useEffect(() => {
    localStorage.setItem('userCredits', JSON.stringify(userCredits));
  }, [userCredits]);
  
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
                  <Route 
                    path="/" 
                    element={
                      <Index />
                    } 
                  />
                  <Route path="/auth" element={<Auth />} />
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
