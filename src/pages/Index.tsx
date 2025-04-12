
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import OptionsSelector, { ImageOptions } from '@/components/OptionsSelector';
import InputForm from '@/components/InputForm';
import PreviewArea from '@/components/PreviewArea';
import { Wand2, Sparkles } from 'lucide-react';
import { generateCodeFromImage } from '@/services/claudeService';

const Index = () => {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ImageOptions>({
    purpose: 'product'
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{ code: string; shopifyLiquid: string } | null>(null);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Shopify Code Generator</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-app-purple to-app-blue">
              Transform Images into Shopify Liquid Code
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload an image of a website section and let our AI generate Shopify Liquid code to recreate it.
              Choose from product listings, sliders, banners and more.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {!uploadedImage ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
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
                    <h2 className="text-xl font-semibold">
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
                    <h2 className="text-xl font-semibold mb-4">
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
                    <h2 className="text-xl font-semibold mb-4">
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
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
                  </div>
                )}

                <div className="mt-8 p-4 rounded-lg border glass">
                  <h3 className="text-sm font-medium mb-2">How It Works</h3>
                  <p className="text-xs text-muted-foreground">
                    This app uses Claude 3.7 AI to transform images into Shopify Liquid code.
                    To get the best results, upload a clear image and provide detailed requirements.
                    You'll need to add your Claude API key to the .env file as VITE_CLAUDE_API_KEY.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Shopify Code Generator © {new Date().getFullYear()} • Powered by Claude 3.7
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
