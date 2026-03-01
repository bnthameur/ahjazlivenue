/**
 * Media Optimizer - Squoosh images to WebP before upload
 * Aggressive compression for maximum size reduction
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for WebP (lower = smaller)
  maxVideoSizeMB?: number;
}

export interface OptimizedFile {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savings: number; // percentage
  type: string;
}

// Aggressive defaults for maximum squooshing
const DEFAULT_OPTIONS: OptimizationOptions = {
  maxWidth: 1600,      // Max width (good for web)
  maxHeight: 1200,     // Max height
  quality: 0.75,       // 75% quality (sweet spot for size/quality)
  maxVideoSizeMB: 50,
};

// Even more aggressive settings for large images
const AGGRESSIVE_OPTIONS: OptimizationOptions = {
  maxWidth: 1400,
  maxHeight: 1050,
  quality: 0.65,       // 65% for really big savings
};

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Squoosh image: Resize and aggressively compress to WebP
 */
export async function squooshImage(
  file: File,
  options: OptimizationOptions = {}
): Promise<OptimizedFile> {
  // Use aggressive settings for files larger than 2MB
  const isLargeFile = file.size > 2 * 1024 * 1024;
  const baseOpts = isLargeFile ? AGGRESSIVE_OPTIONS : DEFAULT_OPTIONS;
  const opts = { ...baseOpts, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate new dimensions - never upscale
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Resize if larger than max
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        if (width / opts.maxWidth! > height / opts.maxHeight!) {
          width = Math.min(width, opts.maxWidth!);
          height = Math.round(width / aspectRatio);
        } else {
          height = Math.min(height, opts.maxHeight!);
          width = Math.round(height * aspectRatio);
        }
      }
      
      // Ensure even dimensions (better for WebP)
      width = Math.floor(width / 2) * 2;
      height = Math.floor(height / 2) * 2;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d', {
        alpha: false // No transparency for photos (smaller file)
      });
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill white background (removes alpha channel for smaller size)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // High quality downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Squoosh to WebP with aggressive settings
      const tryCompress = (quality: number, attempt: number = 1): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob'));
              return;
            }
            
            // If still too big and we haven't tried max compression, retry
            const targetSize = isLargeFile ? 500 * 1024 : 800 * 1024; // 500KB or 800KB target
            if (blob.size > targetSize && quality > 0.5 && attempt < 3) {
              // Retry with lower quality
              tryCompress(quality - 0.15, attempt + 1);
              return;
            }
            
            // Create squooshed file
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.webp'),
              { type: 'image/webp' }
            );
            
            const savings = ((file.size - optimizedFile.size) / file.size) * 100;
            
            resolve({
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
              savings: Math.round(savings * 10) / 10,
              type: 'image/webp',
            });
          },
          'image/webp',
          quality
        );
      };
      
      // Start compression
      tryCompress(opts.quality!);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Validate video file
 */
export async function validateVideo(file: File): Promise<{
  valid: boolean;
  message: string;
  duration?: number;
  formattedDuration?: string;
}> {
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Video too large (${formatBytes(file.size)}). Max 50MB. Compress with HandBrake first.`,
    };
  }
  
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      resolve({
        valid: true,
        message: `Video OK (${formattedDuration}, ${formatBytes(file.size)})`,
        duration: video.duration,
        formattedDuration,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, message: 'Invalid video file' });
    };
    
    video.src = url;
  });
}

/**
 * Squoosh multiple files with progress
 */
export async function squooshFiles(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string, stage: 'squooshing' | 'uploading') => void
): Promise<OptimizedFile[]> {
  const results: OptimizedFile[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      if (isImage(file)) {
        // Skip GIFs (keep animation)
        if (file.type === 'image/gif') {
          results.push({
            file,
            originalSize: file.size,
            optimizedSize: file.size,
            savings: 0,
            type: file.type,
          });
          continue;
        }
        
        onProgress?.(i + 1, files.length, file.name, 'squooshing');
        const optimized = await squooshImage(file);
        results.push(optimized);
        
      } else if (isVideo(file)) {
        const validation = await validateVideo(file);
        if (!validation.valid) throw new Error(validation.message);
        results.push({
          file,
          originalSize: file.size,
          optimizedSize: file.size,
          savings: 0,
          type: file.type,
        });
      } else {
        results.push({
          file,
          originalSize: file.size,
          optimizedSize: file.size,
          savings: 0,
          type: file.type,
        });
      }
    } catch (error) {
      console.error(`Failed to squoosh ${file.name}:`, error);
      results.push({ file, originalSize: file.size, optimizedSize: file.size, savings: 0, type: file.type });
    }
  }
  
  return results;
}

/**
 * Get total savings info
 */
export function getSavingsInfo(files: OptimizedFile[]): {
  originalTotal: number;
  optimizedTotal: number;
  savingsPercent: number;
  savingsFormatted: string;
  count: number;
} {
  const imageFiles = files.filter(f => f.type === 'image/webp');
  const originalTotal = imageFiles.reduce((sum, f) => sum + f.originalSize, 0);
  const optimizedTotal = imageFiles.reduce((sum, f) => sum + f.optimizedSize, 0);
  const savings = originalTotal - optimizedTotal;
  const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 1000) / 10 : 0;
  
  return {
    originalTotal,
    optimizedTotal,
    savingsPercent,
    savingsFormatted: formatBytes(savings),
    count: imageFiles.length,
  };
}

// Backwards compatibility
export const optimizeImage = squooshImage;
export const optimizeFiles = squooshFiles;
