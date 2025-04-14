
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/App";
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import OptionsSelector, { ImageOptions } from '@/components/OptionsSelector';
import InputForm from '@/components/InputForm';
import PreviewArea from '@/components/PreviewArea';
import ChatSidebar from '@/components/ChatSidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Wand2, Sparkles, Crown } from 'lucide-react';
import { generateCodeFromImage } from '@/services/claudeService';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createNewChat, saveChat, getAllChats } from '@/services/chatHistoryService';
import { cn } from '@/lib/utils';

const Index = () => {
  const { toast } = useToast();
  const { userCredits, setUserCredits, isLoggedIn, activeChat, setActiveChat } = useUser();
  const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ImageOptions>({
    purpose: 'product'
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{ code: string; shopifyLiquid: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Load active chat if exists
  useEffect(() => {
    if (activeChat) {
      const chats = getAllChats();
      const chat = chats.find(c => c.id === activeChat);
      if (chat && chat.messages && chat.messages.length > 0) {
        // If we have message history, we could restore the last state
        // This is simplified - in a real app you'd have more robust state handling
        toast({
          title: "Chat loaded",
          description: `Loaded: ${chat.title}`,
        });
      }
    }
  }, [activeChat, toast]);

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImage({ file, previewUrl });
    setGeneratedImageUrl(null);
    setGeneratedCode(null);
    toast({
      title: "Image uploaded successfully",
      description: `File: ${file.name}`,
    });
  };

  const handleOptionsChange = (options: ImageOptions) => {
    setSelectedOptions(options);
  };

  const handleFormSubmit = async (requirements: string) => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough credits
    if (userCredits.current <= 0) {
      setIsUpgradeOpen(true);
      return;
    }

    setIsProcessing(true);
    setGeneratedCode(null);
    
    try {
      // Call Claude API to generate code
      const result = await generateCodeFromImage(
        uploadedImage.file,
        selectedOptions,
        requirements
      );
      
      // Update UI with results
      setGeneratedImageUrl(uploadedImage.previewUrl);
      setGeneratedCode(result);
      
      // Decrease credits after successful generation
      setUserCredits(prev => ({
        ...prev,
        current: Math.max(0, prev.current - 1)
      }));
      
      // Save to chat history
      if (!activeChat) {
        // Create new chat if none is active
        const title = `${selectedOptions.purpose} design`;
        const newChat = createNewChat(title);
        setActiveChat(newChat.id);
        
        // Add message to chat
        newChat.messages = [
          { role: 'user', content: `Generate Shopify code for ${selectedOptions.purpose} from uploaded image. Requirements: ${requirements}` },
          { role: 'assistant', content: `Generated HTML and Liquid template for ${selectedOptions.purpose}.` }
        ];
        saveChat(newChat);
      } else {
        // Add to existing chat
        const chats = getAllChats();
        const chat = chats.find(c => c.id === activeChat);
        if (chat) {
          if (!chat.messages) {
            chat.messages = [];
          }
          chat.messages.push(
            { role: 'user', content: `Generate Shopify code for ${selectedOptions.purpose} from uploaded image. Requirements: ${requirements}` },
            { role: 'assistant', content: `Generated HTML and Liquid template for ${selectedOptions.purpose}.` }
          );
          saveChat(chat);
        }
      }
      
      toast({
        title: "Code generated successfully",
        description: "Your Shopify Liquid code has been created",
      });
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
                  />

                  {!uploadedImage && !generatedImageUrl && !isProcessing && (
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
                          <DialogTrigger asChild>
                            <Button 
                              className="bg-gradient-to-r from-primary/80 to-app-blue/80"
                              onClick={() => setIsUpgradeOpen(true)}
                            >
                              <Crown className="mr-2 h-4 w-4" />
                              Upgrade for more credits
                            </Button>
                          </DialogTrigger>
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
                          <a href="#" className="hover:underline">Sign in</a> or <a href="#" className="hover:underline">create an account</a> to save your history.
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
      
      <Dialog open={isUpgradeOpen && userCredits.current === 0} onOpenChange={setIsUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You're out of credits</DialogTitle>
            <DialogDescription>
              Upgrade your plan to get more credits and generate unlimited code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Free Plan</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>
              </div>
              <p className="text-sm text-muted-foreground">3 credits per day</p>
              <p className="text-sm text-muted-foreground">Credits reset in 24 hours</p>
            </div>
            
            <div className="rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Pro Plan</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm">$9.99/month</p>
              <p className="text-sm">50 credits per day</p>
              <p className="text-sm">Priority support</p>
              <div className="mt-4">
                <Button className="w-full">Upgrade Now</Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Your credits will reset in 24 hours if you prefer to wait.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
