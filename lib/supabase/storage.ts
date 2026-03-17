/**
 * Supabase Storage client for image management
 * Replaces Google Cloud Storage
 */

import { createClient } from '@/lib/supabase/client';
import { squooshFiles, formatBytes } from '@/lib/media-optimizer';

const STORAGE_BUCKET = 'shopify-clone-assets';
const VENUE_IMAGES_BUCKET = 'venue-images';

export interface UploadResult {
    publicUrl: string;
    filename: string;
    bucket: string;
    originalSize: number;
    optimizedSize: number;
    savings: number;
}

export interface UploadProgress {
    current: number;
    total: number;
    fileName: string;
    stage: 'squooshing' | 'uploading';
}

/**
 * Upload generated asset (image) to Supabase Storage
 */
export async function uploadAsset(
    base64Data: string,
    sessionId: string,
    assetId: string,
    mimeType: string = 'image/png'
): Promise<UploadResult> {
    const supabase = createClient();

    // Convert base64 to blob
    const extension = mimeType.split('/')[1] || 'png';
    const filename = `${sessionId}/${assetId}.${extension}`;

    // Decode base64 to binary
    const binary = atob(base64Data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([array], { type: mimeType });

    // Upload to Supabase Storage
    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, blob, {
            contentType: mimeType,
            cacheControl: '31536000', // 1 year
            upsert: true,
        });

    if (error) {
        throw new Error(`Failed to upload asset: ${error.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filename);

    return {
        publicUrl: data.publicUrl,
        filename,
        bucket: STORAGE_BUCKET,
        originalSize: blob.size,
        optimizedSize: blob.size,
        savings: 0,
    };
}

/**
 * Upload multiple assets in batch
 */
export async function uploadAssetsBatch(
    assets: Array<{ base64Data: string; assetId: string; mimeType?: string }>,
    sessionId: string
): Promise<UploadResult[]> {
    const uploadPromises = assets.map((asset) =>
        uploadAsset(
            asset.base64Data,
            sessionId,
            asset.assetId,
            asset.mimeType
        )
    );

    return Promise.all(uploadPromises);
}

/**
 * Upload image from URL (for screenshots)
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    sessionId: string,
    assetId: string
): Promise<UploadResult> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return uploadAsset(base64, sessionId, assetId, blob.type);
}

/**
 * Upload venue images with optimization
 * Converts images to WebP, resizes if needed, and tracks savings
 */
export async function uploadVenueImages(
    files: File[],
    venueId: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult[]> {
    const supabase = createClient();
    const results: UploadResult[] = [];

    // Step 1: Squoosh files
    onProgress?.({ current: 0, total: files.length, fileName: '', stage: 'squooshing' });
    
    const optimizedFiles = await squooshFiles(files, (current, total, fileName, stage) => {
        onProgress?.({ current, total, fileName, stage });
    });

    // Calculate and log savings
    const totalOriginal = optimizedFiles.reduce((sum, f) => sum + f.originalSize, 0);
    const totalOptimized = optimizedFiles.reduce((sum, f) => sum + f.optimizedSize, 0);
    const savings = totalOriginal - totalOptimized;
    const savingsPercent = totalOriginal > 0 ? ((savings / totalOriginal) * 100).toFixed(1) : '0';
    
    console.log(`📸 Image Optimization: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (${savingsPercent}% smaller)`);

    // Step 2: Upload optimized files
    for (let i = 0; i < optimizedFiles.length; i++) {
        const optFile = optimizedFiles[i];
        onProgress?.({ current: i + 1, total: optimizedFiles.length, fileName: optFile.file.name, stage: 'uploading' });

        const filePath = `${venueId}/${Date.now()}_${optFile.file.name}`;

        const { error } = await supabase.storage
            .from(VENUE_IMAGES_BUCKET)
            .upload(filePath, optFile.file, {
                contentType: optFile.type,
                cacheControl: '31536000',
            });

        if (error) {
            console.error('Upload error:', error);
            throw new Error(`Failed to upload ${optFile.file.name}: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(VENUE_IMAGES_BUCKET)
            .getPublicUrl(filePath);

        results.push({
            publicUrl,
            filename: filePath,
            bucket: VENUE_IMAGES_BUCKET,
            originalSize: optFile.originalSize,
            optimizedSize: optFile.optimizedSize,
            savings: optFile.savings,
        });
    }

    return results;
}

/**
 * Upload a single venue image with optimization
 */
export async function uploadVenueImage(
    file: File,
    venueId: string
): Promise<UploadResult> {
    const results = await uploadVenueImages([file], venueId);
    return results[0];
}

/**
 * Delete session assets
 */
export async function deleteSessionAssets(sessionId: string): Promise<void> {
    const supabase = createClient();

    const { data: files } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(sessionId);

    if (files && files.length > 0) {
        const filePaths = files.map((file) => `${sessionId}/${file.name}`);
        await supabase.storage.from(STORAGE_BUCKET).remove(filePaths);
    }
}

/**
 * List all assets for a session
 */
export async function listSessionAssets(sessionId: string): Promise<string[]> {
    const supabase = createClient();

    const { data: files } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(sessionId);

    if (!files) return [];

    return files.map((file) => {
        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(`${sessionId}/${file.name}`);
        return data.publicUrl;
    });
}

export interface VenueMediaRecord {
    id: string;
    venue_id: string;
    media_type: 'image' | 'video';
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    display_order: number;
    is_cover: boolean;
    created_at: string;
}

export interface VideoUploadResult {
    mediaRecord: VenueMediaRecord;
    publicUrl: string;
    thumbnailUrl: string | null;
    filename: string;
}

export interface VideoUploadProgress {
    stage: 'compressing-video' | 'generating-thumbnail' | 'uploading-video' | 'uploading-thumbnail' | 'saving-record';
    progress: number; // 0-100
}

/**
 * Generate a thumbnail from a video file by capturing the first frame at ~1 second.
 * Returns a JPEG blob at 60% quality.
 */
export async function generateVideoThumbnail(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const objectUrl = URL.createObjectURL(videoFile);

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            // Seek to 1 second, or halfway if video is shorter than 2 seconds
            const seekTime = video.duration >= 2 ? 1 : video.duration / 2;
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objectUrl);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate thumbnail blob'));
                    }
                },
                'image/jpeg',
                0.6
            );
        };

        video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load video for thumbnail generation'));
        };

        video.src = objectUrl;
    });
}

const VENUE_VIDEOS_BUCKET = 'venue-images'; // reuse same bucket, different prefix

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const VIDEO_COMPRESSION_TARGET_BYTES = 20 * 1024 * 1024; // try to shrink larger files before upload
const VIDEO_COMPRESSION_BITRATE = 2_500_000;

function getSupportedRecorderMimeType(): string | null {
    if (typeof MediaRecorder === 'undefined') return null;

    const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

async function compressVideoForUpload(
    videoFile: File,
    onProgress?: (progress: number) => void
): Promise<File> {
    type CapturableVideoElement = HTMLVideoElement & {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
    };

    const recorderMimeType = getSupportedRecorderMimeType();
    const canCapture =
        typeof document !== 'undefined' &&
        typeof HTMLVideoElement !== 'undefined' &&
        recorderMimeType &&
        typeof MediaRecorder !== 'undefined';

    if (!canCapture || videoFile.size <= VIDEO_COMPRESSION_TARGET_BYTES) {
        onProgress?.(100);
        return videoFile;
    }

    return new Promise((resolve) => {
        const video = document.createElement('video') as CapturableVideoElement;
        const objectUrl = URL.createObjectURL(videoFile);
        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
            video.pause();
            video.removeAttribute('src');
            video.load();
        };

        let settled = false;
        const finish = (file: File) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(file);
        };

        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = async () => {
            try {
                const stream =
                    typeof video.captureStream === 'function'
                        ? video.captureStream()
                        : typeof video.mozCaptureStream === 'function'
                            ? video.mozCaptureStream()
                            : null;

                if (!stream) {
                    finish(videoFile);
                    return;
                }

                const chunks: Blob[] = [];
                const recorder = new MediaRecorder(stream, {
                    mimeType: recorderMimeType,
                    videoBitsPerSecond: VIDEO_COMPRESSION_BITRATE,
                });

                recorder.ondataavailable = (event) => {
                    if (event.data?.size) {
                        chunks.push(event.data);
                    }
                };

                recorder.onerror = () => finish(videoFile);

                recorder.onstop = () => {
                    if (!chunks.length) {
                        finish(videoFile);
                        return;
                    }

                    const blob = new Blob(chunks, { type: recorderMimeType });
                    if (!blob.size || blob.size >= videoFile.size) {
                        finish(videoFile);
                        return;
                    }

                    const ext = recorderMimeType.includes('webm') ? 'webm' : 'mp4';
                    const compressedFile = new File(
                        [blob],
                        videoFile.name.replace(/\.[^/.]+$/, `.${ext}`),
                        { type: blob.type || `video/${ext}` }
                    );
                    finish(compressedFile);
                };

                video.ontimeupdate = () => {
                    if (video.duration > 0) {
                        onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
                    }
                };

                video.onended = () => {
                    onProgress?.(100);
                    if (recorder.state !== 'inactive') {
                        recorder.stop();
                    }
                };

                recorder.start(1000);
                await video.play();
            } catch {
                finish(videoFile);
            }
        };

        video.onerror = () => finish(videoFile);
        video.src = objectUrl;
    });
}

/**
 * Upload a venue video with auto-generated thumbnail.
 * Validates file type and size, generates a thumbnail from the first frame,
 * uploads both video and thumbnail to Supabase storage, and inserts a
 * row in the venue_media table.
 */
export async function uploadVenueVideo(
    videoFile: File,
    venueId: string,
    onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResult> {
    const supabase = createClient();

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(videoFile.type) && !videoFile.type.startsWith('video/')) {
        throw new Error(`Unsupported video type: ${videoFile.type}. Supported: mp4, webm, mov`);
    }

    // Validate file size
    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
        const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
        throw new Error(`Video file too large: ${sizeMB}MB. Maximum allowed size is 50MB.`);
    }

    onProgress?.({ stage: 'compressing-video', progress: 0 });
    const processedVideoFile = await compressVideoForUpload(videoFile, (progress) => {
        onProgress?.({ stage: 'compressing-video', progress });
    });
    onProgress?.({ stage: 'compressing-video', progress: 100 });

    const timestamp = Date.now();
    const sanitizedName = processedVideoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const videoPath = `${venueId}/videos/${timestamp}_${sanitizedName}`;
    const thumbnailPath = `${venueId}/videos/thumbs/${timestamp}_thumb.jpg`;

    // Step 1: Generate thumbnail
    onProgress?.({ stage: 'generating-thumbnail', progress: 0 });
    let thumbnailBlob: Blob | null = null;
    try {
        thumbnailBlob = await generateVideoThumbnail(processedVideoFile);
    } catch (err) {
        console.warn('Thumbnail generation failed, continuing without thumbnail:', err);
    }
    onProgress?.({ stage: 'generating-thumbnail', progress: 100 });

    // Step 2: Upload video
    onProgress?.({ stage: 'uploading-video', progress: 0 });
    const { error: videoError } = await supabase.storage
        .from(VENUE_VIDEOS_BUCKET)
        .upload(videoPath, processedVideoFile, {
            contentType: processedVideoFile.type,
            cacheControl: '31536000',
        });

    if (videoError) {
        throw new Error(`Failed to upload video: ${videoError.message}`);
    }
    onProgress?.({ stage: 'uploading-video', progress: 100 });

    const { data: { publicUrl: videoPublicUrl } } = supabase.storage
        .from(VENUE_VIDEOS_BUCKET)
        .getPublicUrl(videoPath);

    // Step 3: Upload thumbnail (if generated)
    let thumbnailPublicUrl: string | null = null;
    if (thumbnailBlob) {
        onProgress?.({ stage: 'uploading-thumbnail', progress: 0 });
        const { error: thumbError } = await supabase.storage
            .from(VENUE_VIDEOS_BUCKET)
            .upload(thumbnailPath, thumbnailBlob, {
                contentType: 'image/jpeg',
                cacheControl: '31536000',
            });

        if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
                .from(VENUE_VIDEOS_BUCKET)
                .getPublicUrl(thumbnailPath);
            thumbnailPublicUrl = publicUrl;
        } else {
            console.warn('Thumbnail upload failed:', thumbError.message);
        }
        onProgress?.({ stage: 'uploading-thumbnail', progress: 100 });
    }

    // Step 4: Insert venue_media record
    onProgress?.({ stage: 'saving-record', progress: 0 });

    // Get the current max display_order for this venue
    const { data: existingMedia } = await supabase
        .from('venue_media')
        .select('display_order')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrder = existingMedia ? (existingMedia.display_order ?? 0) + 1 : 0;

    const { data: mediaRecord, error: dbError } = await supabase
        .from('venue_media')
        .insert({
            venue_id: venueId,
            media_type: 'video',
            url: videoPublicUrl,
            thumbnail_url: thumbnailPublicUrl,
            display_order: nextOrder,
            is_cover: false,
        })
        .select()
        .single();

    if (dbError) {
        // Try to clean up uploaded files
        await supabase.storage.from(VENUE_VIDEOS_BUCKET).remove([videoPath]);
        if (thumbnailPublicUrl) {
            await supabase.storage.from(VENUE_VIDEOS_BUCKET).remove([thumbnailPath]);
        }
        throw new Error(`Failed to save video record: ${dbError.message}`);
    }

    onProgress?.({ stage: 'saving-record', progress: 100 });

    return {
        mediaRecord: mediaRecord as VenueMediaRecord,
        publicUrl: videoPublicUrl,
        thumbnailUrl: thumbnailPublicUrl,
        filename: videoPath,
    };
}

/**
 * Delete a venue video from storage and the venue_media table
 */
export async function deleteVenueVideo(mediaId: string, filePath: string): Promise<void> {
    const supabase = createClient();

    // Delete from DB first
    const { error: dbError } = await supabase
        .from('venue_media')
        .delete()
        .eq('id', mediaId);

    if (dbError) {
        throw new Error(`Failed to delete video record: ${dbError.message}`);
    }

    // Delete from storage (best-effort, don't throw if file missing)
    const storageFilename = filePath.split('/').pop();
    if (storageFilename) {
        await supabase.storage
            .from(VENUE_VIDEOS_BUCKET)
            .remove([filePath])
            .catch(() => {}); // non-critical
    }
}

/**
 * Fetch all venue_media records for a venue, optionally filtered by type
 */
export async function fetchVenueMedia(
    venueId: string,
    mediaType?: 'image' | 'video'
): Promise<VenueMediaRecord[]> {
    const supabase = createClient();

    let query = supabase
        .from('venue_media')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: true });

    if (mediaType) {
        query = query.eq('media_type', mediaType);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch venue media: ${error.message}`);
    return (data || []) as VenueMediaRecord[];
}

/**
 * Delete a venue image
 */
export async function deleteVenueImage(filePath: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.storage
        .from(VENUE_IMAGES_BUCKET)
        .remove([filePath]);

    if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}

/**
 * Ensure storage bucket exists (run once on setup)
 */
export async function ensureBucketExists(): Promise<boolean> {
    const supabase = createClient();

    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);

        if (!exists) {
            // Create bucket if it doesn't exist
            const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
                public: true,
                fileSizeLimit: 52428800, // 50MB
            });

            if (error) {
                console.error('Failed to create bucket:', error);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Bucket check failed:', error);
        return false;
    }
}
