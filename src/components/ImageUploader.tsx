
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ 
  onImageUpload 
}: { 
  onImageUpload: (file: File, previewUrl: string) => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const fileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!fileTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageUpload(file, previewUrl);
  }, [onImageUpload, toast]);

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg transition-all overflow-hidden glass
        ${isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-muted-foreground dark:hover:border-muted-foreground/50 bg-card/40'
        }
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex flex-col items-center justify-center text-center p-10 space-y-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/10' : 'bg-secondary'} mb-2 transition-colors`}>
          {isDragging ? (
            <ImageIcon className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">
            {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            or <span className="text-primary cursor-pointer">browse files</span>
          </p>
        </div>
        <div className="flex gap-2 items-center justify-center mt-4 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-secondary">JPEG</span>
          <span className="px-2 py-1 rounded-full bg-secondary">PNG</span>
          <span className="px-2 py-1 rounded-full bg-secondary">WebP</span>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
