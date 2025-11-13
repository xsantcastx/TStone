import { Injectable } from '@angular/core';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, where 1 is best quality
  outputFormat?: 'webp' | 'jpeg' | 'png';
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {

  /**
   * Optimizes an image by resizing and compressing it
   * @param file Original image file
   * @param options Optimization options
   * @returns Promise with optimized image as Blob
   */
  async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      outputFormat = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
              const aspectRatio = width / height;
              
              if (width > height) {
                width = maxWidth;
                height = width / aspectRatio;
              } else {
                height = maxHeight;
                width = height * aspectRatio;
              }
            }
            
            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              },
              `image/${outputFormat}`,
              quality
            );
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Optimizes an image and returns it as a File object
   * @param file Original image file
   * @param options Optimization options
   * @returns Promise with optimized image as File
   */
  async optimizeImageAsFile(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<File> {
    const blob = await this.optimizeImage(file, options);
    const outputFormat = options.outputFormat || 'webp';
    
    // Generate new filename with .webp extension
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${originalName}.${outputFormat}`;
    
    return new File([blob], newFileName, { type: `image/${outputFormat}` });
  }

  /**
   * Get the size reduction percentage
   * @param originalSize Original file size in bytes
   * @param optimizedSize Optimized file size in bytes
   * @returns Percentage reduction
   */
  getSizeReduction(originalSize: number, optimizedSize: number): number {
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }

  /**
   * Format file size for display
   * @param bytes File size in bytes
   * @returns Formatted string (e.g., "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Optimize multiple images in parallel
   * @param files Array of image files
   * @param options Optimization options
   * @returns Promise with array of optimized files
   */
  async optimizeMultipleImages(
    files: File[],
    options: ImageOptimizationOptions = {}
  ): Promise<File[]> {
    const promises = files.map(file => this.optimizeImageAsFile(file, options));
    return Promise.all(promises);
  }

  /**
   * Check if a file is a valid image
   * @param file File to check
   * @returns True if file is an image
   */
  isValidImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Validate image file size
   * @param file File to validate
   * @param maxSizeInMB Maximum size in megabytes
   * @returns True if file is within size limit
   */
  isValidImageSize(file: File, maxSizeInMB: number = 10): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}
