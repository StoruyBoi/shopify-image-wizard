import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import OptionsSelector, { ImageOptions } from '@/components/OptionsSelector';
import InputForm from '@/components/InputForm';
import PreviewArea from '@/components/PreviewArea';
import ChatSidebar from '@/components/ChatSidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Wand2, Sparkles, Crown } from 'lucide-react';
import { generateCodeFromImage } from '@/services/claudeService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import UserSettingsMenu from '@/components/UserSettingsMenu';

const Index = () => {
  const { toast } = useToast();
  const { userCredits, setUserCredits, isLoggedIn, activeChat, setActiveChat, user } = useUser();
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ImageOptions>({
    purpose: 'product'
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{ code: string; shopifyLiquid: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadChatData();
    }
  }, [activeChat]);

  const loadChatData = async () => {
    if (!activeChat) return;
    
    try {
      const { data: chatDetails, error: chatError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('id', activeChat)
        .single();
        
      if (chatError) throw chatError;
      
      const { data: imageData, error: imageError } = await supabase
        .from('chat_images')
        .select('*')
        .eq('chat_id', activeChat)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (imageError) throw imageError;
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', activeChat)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      if (imageData && imageData.length > 0) {
        setGeneratedImageUrl(imageData[0].image_url);
      }
      
      toast({
        title: "Chat loaded",
        description: `Loaded: ${chatDetails.title}`,
      });
    } catch (error) {
      console.error("Error loading chat:", error);
      toast({
        title: "Error loading chat",
        description: "Failed to load chat data",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImage({ file, previewUrl });
    setGeneratedImageUrl(null);
    setGeneratedCode(null);
    setProcessingError(null);
    toast({
      title: "Image uploaded successfully",
      description: `File: ${file.name}`,
    });
  };

  const handleOptionsChange = (options: ImageOptions) => {
    setSelectedOptions(options);
  };

  const handleFormSubmit = async (requirements: string) => {
    if (!isLoggedIn) {
      setIsAuthDialogOpen(true);
      return;
    }

    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (userCredits.current <= 0) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    setGeneratedCode(null);
    setProcessingError(null);
    
    try {
      const result = await generateCodeFromImage(
        uploadedImage.file,
        selectedOptions,
        requirements
      );
      
      setGeneratedImageUrl(uploadedImage.previewUrl);
      setGeneratedCode(result);
      
      if (user) {
        const { error: creditsError } = await supabase
          .from('profiles')
          .update({ credits_used: userCredits.max - (userCredits.current - 1) })
          .eq('id', user.id);

        if (creditsError) throw creditsError;
        
        setUserCredits(prev => ({
          ...prev,
          current: Math.max(0, prev.current - 1)
        }));
        
        if (!activeChat) {
          const title = `${selectedOptions.purpose} design`;
          
          const { data: chatData, error: chatError } = await supabase
            .from('chat_history')
            .insert([
              { title, date: 'Today', user_id: user.id }
            ])
            .select()
            .single();

          if (chatError) throw chatError;
          
          if (chatData) {
            setActiveChat(chatData.id);
            
            const { error: messagesError } = await supabase
              .from('chat_messages')
              .insert([
                {
                  chat_id: chatData.id,
                  role: 'user',
                  content: `Generate Shopify code for ${selectedOptions.purpose} from uploaded image. Requirements: ${requirements}`
                },
                {
                  chat_id: chatData.id,
                  role: 'assistant',
                  content: `Generated HTML and Liquid template for ${selectedOptions.purpose}.`
                }
              ]);

            if (messagesError) throw messagesError;
            
            const { error: imageError } = await supabase
              .from('chat_images')
              .insert([
                {
                  chat_id: chatData.id,
                  image_url: uploadedImage.previewUrl
                }
              ]);

            if (imageError) throw imageError;
          }
        }
      }
      
      toast({
        title: "Code generated successfully",
        description: "Your Shopify Liquid code has been created",
      });
    } catch (error: any) {
      console.error("Error generating code:", error);
      setProcessingError(error.message || "There was an error generating your code");
      toast({
        title: "Generation failed",
        description: error.message || "There was an error generating your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 text-primary animate-spin relative">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <p className="text-lg font-medium">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <ChatSidebar />
      
      <SidebarInset className="flex flex-col w-full">
        <Header userCredits={userCredits} />
        
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8 w-full">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Powered Shopify Code Generator</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-app-purple to-app-blue">
                Transform Images into Shopify Liquid Code
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                Upload an image of a website section and let our AI generate Shopify Liquid code to recreate it.
                Choose from product listings, sliders, banners and more.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-6 md:space-y-8">
                {!uploadedImage ? (
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold mb-4">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm">1</span>
                        Upload Your Image
                      </span>
                    </h2>
                    <ImageUploader onImageUpload={handleImageUpload} />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg md:text-xl font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm">1</span>
                          Uploaded Image
                        </span>
                      </h2>
                      <button 
                        onClick={() => {
                          setUploadedImage(null);
                          setGeneratedCode(null);
                          setProcessingError(null);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Change
                      </button>
                    </div>
                    <div className="rounded-lg border p-4 glass">
                      <img 
                        src={uploadedImage.previewUrl} 
                        alt="Uploaded" 
                        className="w-full h-auto rounded-md" 
                      />
                      <p className="mt-2 text-sm text-muted-foreground truncate">
                        {uploadedImage.file.name}
                      </p>
                    </div>
                  </div>
                )}

                {uploadedImage && (
                  <>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold mb-4">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm">2</span>
                          Choose Section Type
                        </span>
                      </h2>
                      <OptionsSelector 
                        selectedOptions={selectedOptions}
                        onOptionsChange={handleOptionsChange}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg md:text-xl font-semibold mb-4">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm">3</span>
                          Section Requirements
                        </span>
                      </h2>
                      <InputForm 
                        selectedOptions={selectedOptions}
                        onSubmit={handleFormSubmit}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="sticky top-24">
                  <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Generated Output
                  </h2>
                  <PreviewArea 
                    previewUrl={generatedImageUrl} 
                    isProcessing={isProcessing} 
                    generatedCode={generatedCode}
                    error={processingError}
                  />

                  {!uploadedImage && !generatedImageUrl && !isProcessing && !processingError && (
                    <div className="rounded-lg border p-8 text-center glass">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-secondary">
                          <Sparkles className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Let's Create Some Code</h3>
                      <p className="text-muted-foreground text-sm">
                        Upload an image and I'll generate Shopify Liquid code for you.
                        Just tell me what kind of section you need!
                      </p>
                      {userCredits.current === 0 && (
                        <div className="mt-4">
                          <Button 
                            className="bg-gradient-to-r from-primary/80 to-app-blue/80"
                            onClick={() => setIsUpgradeOpen(true)}
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Upgrade for more credits
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-8 p-4 rounded-lg border glass">
                    <h3 className="text-sm font-medium mb-2">How It Works</h3>
                    <p className="text-xs text-muted-foreground">
                      This app uses Claude 3.7 AI to transform images into Shopify Liquid code.
                      To get the best results, upload a clear image and provide detailed requirements.
                      {!isLoggedIn && (
                        <span className="block mt-1 text-primary">
                          <button 
                            onClick={() => setIsAuthDialogOpen(true)} 
                            className="hover:underline"
                          >
                            Sign in
                          </button> or <button 
                            onClick={() => setIsAuthDialogOpen(true)} 
                            className="hover:underline"
                          >
                            create an account
                          </button> to save your history.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="border-t border-border py-6 mt-auto">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground">
              Shopify Code Generator © {new Date().getFullYear()} • Powered by Claude 3.7
            </p>
          </div>
        </footer>
      </SidebarInset>
      
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to use this feature
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <UserSettingsMenu onClose={() => setIsAuthDialogOpen(false)} />
          </div>
          
          <p className="text-sm text-center text-muted-foreground">
            Sign in to track your credits and save your generated code
          </p>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userCredits.current === 0 ? "You're out of credits" : "Upgrade your plan"}</DialogTitle>
            <DialogDescription>
              {userCredits.current === 0 
                ? "Upgrade your plan to get more credits and generate unlimited code."
                : "Get more credits and features with our premium plans."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div 
              className="rounded-lg border p-4 bg-muted/30 cursor-pointer"
              onClick={() => {/* Set to free plan */}}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Free Plan</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>
              </div>
              <p className="text-sm text-muted-foreground">3 credits per day</p>
              <p className="text-sm text-muted-foreground">Credits reset in 24 hours</p>
            </div>
            
            <div 
              className="rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer"
              onClick={() => {/* Pro plan action */}}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Pro Plan</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm">$9.99/month</p>
              <p className="text-sm">50 credits per day</p>
              <p className="text-sm">Priority support</p>
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    if (isLoggedIn) {
                      // Handle upgrade process
                      toast({
                        title: "Upgrade in progress",
                        description: "Processing your upgrade to Pro Plan",
                      });
                    } else {
                      setIsAuthDialogOpen(true);
                      setIsUpgradeOpen(false);
                    }
                  }}
                >
                  {isLoggedIn ? "Upgrade Now" : "Sign In To Upgrade"}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            {userCredits.current === 0 
              ? "Your credits will reset in 24 hours if you prefer to wait."
              : "Upgrade now to get more features and credits."}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
