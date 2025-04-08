
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
      className={`relative border-2 border-dashed rounded-lg p-8 transition-all
        ${isDragging 
          ? 'border-app-purple bg-app-purple/10' 
          : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
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
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="p-3 rounded-full bg-gray-700 mb-2">
          {isDragging ? (
            <ImageIcon className="h-8 w-8 text-app-purple animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-300">
          {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
        </h3>
        <p className="text-sm text-gray-500">
          or <span className="text-app-purple">browse files</span>
        </p>
        <p className="text-xs text-gray-600 pt-2">
          Supports: JPEG, PNG, WebP
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
