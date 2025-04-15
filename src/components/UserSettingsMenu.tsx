
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
  Globe,
  Loader2,
  Camera,
  Edit,
  Clock
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
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import { useNavigate } from 'react-router-dom';

interface UserSettingsMenuProps {
  onClose?: () => void;
}

const UserSettingsMenu = ({ onClose }: UserSettingsMenuProps) => {
  const { theme, setTheme } = useTheme();
  const { toast } = toast();
  const navigate = useNavigate();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, setIsLoggedIn, userCredits, setUserCredits, user } = useUser();
  const [userProfile, setUserProfile] = useState<{email: string; name?: string; avatar_url?: string} | null>(null);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('email, name, avatar_url')
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
      if (onClose) onClose();
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
      if (onClose) onClose();
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
      
      // Navigate to home after logout
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      try {
        if (user) {
          setLoading(true);
          
          // Delete all messages from this user's chats
          const { data: chats } = await supabase
            .from('chat_history')
            .select('id')
            .eq('user_id', user.id);
            
          if (chats && chats.length > 0) {
            const chatIds = chats.map(chat => chat.id);
            
            // Delete messages
            await supabase
              .from('chat_messages')
              .delete()
              .in('chat_id', chatIds);
              
            // Delete images
            await supabase
              .from('chat_images')
              .delete()
              .in('chat_id', chatIds);
              
            // Delete chats
            await supabase
              .from('chat_history')
              .delete()
              .in('id', chatIds);
          }
          
          setLoading(false);
        }
        
        toast({
          title: "History cleared",
          description: "All your conversation history has been removed",
          variant: "destructive"
        });
      } catch (error) {
        console.error('Error clearing history:', error);
        toast({
          title: "Error",
          description: "Failed to clear chat history",
          variant: "destructive"
        });
        setLoading(false);
      }
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
      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const renderLoginDialog = () => (
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
  );
  
  const renderSignupDialog = () => (
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
  );
  
  const renderUserSettingsDialog = () => (
    <Dialog open={isUserSettingsOpen} onOpenChange={setIsUserSettingsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userProfile?.avatar_url || '/placeholder.svg'} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <h3 className="font-medium">{userProfile?.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="display-name">Display Name</Label>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Edit</span>
                </Button>
              </div>
              <Input id="display-name" value={userProfile?.name || ''} readOnly />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userProfile?.email || ''} readOnly />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Change</span>
                </Button>
              </div>
              <Input type="password" value="••••••••" readOnly />
            </div>
            
            <div className="pt-4">
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last login</span>
                </div>
                <span className="text-sm text-muted-foreground">Today</span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setIsUserSettingsOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            toast({
              title: "Settings saved",
              description: "Your profile settings have been updated",
            });
            setIsUserSettingsOpen(false);
          }}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile?.avatar_url || '/placeholder.svg'} />
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
              <DropdownMenuItem onClick={() => setIsUserSettingsOpen(true)}>
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
              <DropdownMenuItem 
                className="text-destructive/80" 
                onClick={handleClearHistory}
                disabled={loading}
              >
                {loading ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <Trash2 className="mr-2 h-4 w-4" />
                }
                <span>Clear history</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <LogOut className="mr-2 h-4 w-4" />
                }
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

      {renderLoginDialog()}
      {renderSignupDialog()}
      {renderUserSettingsDialog()}
    </>
  );
};

export default UserSettingsMenu;
