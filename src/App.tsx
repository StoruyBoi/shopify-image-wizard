
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { SidebarProvider } from "./components/ui/sidebar";
import { createContext, useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { supabase } from "./lib/supabase";
import { Session, User } from '@supabase/supabase-js';

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
  user: User | null;
  session: Session | null;
}

export const UserContext = createContext<UserContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  userCredits: { current: 3, max: 3 },
  setUserCredits: () => {},
  activeChat: null,
  setActiveChat: () => {},
  user: null,
  session: null
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userCredits, setUserCredits] = useState({ current: 3, max: 3 });
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  // Set up auth listeners
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user || null);
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

    // Check for existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoggedIn(!!session);
      
      if (session?.user) {
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Reset credits daily
  useEffect(() => {
    const checkAndResetCredits = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('credits_used, max_credits, updated_at')
          .eq('id', user.id)
          .single();
        
        if (data) {
          const lastUpdate = new Date(data.updated_at);
          const today = new Date();
          
          // Check if last update was before today (different day)
          if (lastUpdate.getDate() !== today.getDate() || 
              lastUpdate.getMonth() !== today.getMonth() || 
              lastUpdate.getFullYear() !== today.getFullYear()) {
            
            // Reset credits
            const { error } = await supabase
              .from('profiles')
              .update({ credits_used: 0, updated_at: new Date().toISOString() })
              .eq('id', user.id);
            
            if (!error) {
              setUserCredits({
                current: data.max_credits,
                max: data.max_credits
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check or reset credits:", error);
      }
    };
    
    if (isLoggedIn) {
      checkAndResetCredits();
      
      // Check once per hour
      const interval = setInterval(checkAndResetCredits, 1000 * 60 * 60);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user]);

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
            setActiveChat,
            user,
            session
          }}>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
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
