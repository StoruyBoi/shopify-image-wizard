
import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Settings, 
  LogOut, 
  User,
  Moon, 
  Sun,
  Trash2,
  Mail,
  Key,
  Globe,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "./ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { clearAllChats } from '@/services/chatHistoryService';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import { useNavigate } from 'react-router-dom';

const UserSettingsMenu = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, setIsLoggedIn, userCredits, setUserCredits } = useUser();
  const [userProfile, setUserProfile] = useState<{email: string; name?: string} | null>(null);
  
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setUserProfile(data);
        } else {
          setUserProfile({
            email: user.email || '',
          });
        }
      }
    };
    
    if (isLoggedIn) {
      getProfile();
    }
  }, [isLoggedIn]);
  
  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      setIsLoginDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account",
      });
      
      setIsSignupDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      clearAllChats();
      toast({
        title: "History cleared",
        description: "All your conversation history has been removed",
        variant: "destructive"
      });
    }
  };
  
  // Function to get initials from email or name
  const getInitials = () => {
    if (!userProfile) return 'U';
    
    if (userProfile.name) {
      return userProfile.name.charAt(0).toUpperCase();
    }
    
    return userProfile.email.charAt(0).toUpperCase();
  };
  
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) throw error;
      
      setIsLoginDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{isLoggedIn ? getInitials() : 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {isLoggedIn ? "User Account" : "Not logged in"}
              </p>
              {isLoggedIn && userProfile && (
                <p className="text-xs text-muted-foreground">{userProfile.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoggedIn ? (
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleThemeToggle}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) : (
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  setIsLoginDialogOpen(true);
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                <span>Log in</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault(); 
                  setIsSignupDialogOpen(true);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Sign up</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleThemeToggle}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-primary">
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade plan</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {isLoggedIn ? (
            <>
              <DropdownMenuItem className="text-destructive/80" onClick={handleClearHistory}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Clear history</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem className="text-destructive/80" onClick={handleClearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Clear history</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log in to your account</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </DialogFooter>
          </form>
          <div className="mt-2 text-center">
            <Button 
              variant="outline" 
              className="w-full mb-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Globe className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Don't have an account?{" "}
              <button 
                className="text-primary hover:underline"
                onClick={() => {
                  setIsLoginDialogOpen(false);
                  setIsSignupDialogOpen(true);
                }}
                type="button"
              >
                Sign up
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Up Dialog */}
      <Dialog open={isSignupDialogOpen} onOpenChange={setIsSignupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create an account</DialogTitle>
            <DialogDescription>
              Enter your details to create a new account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </DialogFooter>
          </form>
          <div className="mt-2 text-center">
            <Button 
              variant="outline" 
              className="w-full mb-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Globe className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <button 
                className="text-primary hover:underline"
                onClick={() => {
                  setIsSignupDialogOpen(false);
                  setIsLoginDialogOpen(true);
                }}
                type="button"
              >
                Log in
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserSettingsMenu;
