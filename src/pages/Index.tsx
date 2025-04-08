import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import OptionsSelector, { ImageOptions, ImagePurpose } from '@/components/OptionsSelector';
import InputForm from '@/components/InputForm';
import PreviewArea from '@/components/PreviewArea';
import { Wand2, Sparkles } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ImageOptions>({
    purpose: 'product',
    showPrice: false,
    showRating: false,
    includeText: false,
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImage({ file, previewUrl });
    setGeneratedImageUrl(null);
    toast({
      title: "Image uploaded successfully",
      description: `File: ${file.name}`,
    });
  };

  const handleOptionsChange = (options: ImageOptions) => {
    setSelectedOptions(options);
  };

  const handleFormSubmit = (formData: any) => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API processing time
    setTimeout(() => {
      // For now, we'll just use the original image as a placeholder
      // Later, we'll replace this with the actual Claude 3.7 API integration
      setGeneratedImageUrl(uploadedImage.previewUrl);
      setIsProcessing(false);
      
      toast({
        title: "Image generated successfully",
        description: "Your Shopify image has been created",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-app-dark text-white flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-full bg-app-purple/10 text-app-purple">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Shopify Image Generator</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-app-purple to-app-blue">
              Transform Your Images into Shopify Assets
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Upload an image and let our AI transform it into professional Shopify-ready assets.
              Choose from product images, sliders, banners and more.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {!uploadedImage ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-200 mb-4">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-app-purple flex items-center justify-center text-white text-sm">1</span>
                      Upload Your Image
                    </span>
                  </h2>
                  <ImageUploader onImageUpload={handleImageUpload} />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-200">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-app-purple flex items-center justify-center text-white text-sm">1</span>
                        Uploaded Image
                      </span>
                    </h2>
                    <button 
                      onClick={() => setUploadedImage(null)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Change
                    </button>
                  </div>
                  <div className="rounded-lg border border-gray-700 p-4 bg-gray-800/50">
                    <img 
                      src={uploadedImage.previewUrl} 
                      alt="Uploaded" 
                      className="w-full h-auto rounded-md" 
                    />
                    <p className="mt-2 text-sm text-gray-500 truncate">
                      {uploadedImage.file.name}
                    </p>
                  </div>
                </div>
              )}

              {uploadedImage && (
                <>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-app-purple flex items-center justify-center text-white text-sm">2</span>
                        Choose Options
                      </span>
                    </h2>
                    <OptionsSelector 
                      selectedOptions={selectedOptions}
                      onOptionsChange={handleOptionsChange}
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-app-purple flex items-center justify-center text-white text-sm">3</span>
                        Additional Details
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
              <div className="sticky top-8">
                <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-app-purple" />
                  Generated Output
                </h2>
                <PreviewArea 
                  previewUrl={generatedImageUrl} 
                  isProcessing={isProcessing} 
                />

                {!uploadedImage && !generatedImageUrl && (
                  <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-gray-700/50">
                        <Sparkles className="h-8 w-8 text-gray-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Preview Yet</h3>
                    <p className="text-gray-500 text-sm">
                      Upload an image and configure your options to generate a Shopify asset
                    </p>
                  </div>
                )}

                <div className="mt-8 p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">About Claude 3.7 Integration</h3>
                  <p className="text-xs text-gray-500">
                    This application uses Claude 3.7 AI to generate high-quality Shopify assets. 
                    The AI model understands e-commerce context and optimizes your images for 
                    maximum conversion potential.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            Shopify Image Wizard © {new Date().getFullYear()} • Powered by Claude 3.7
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
