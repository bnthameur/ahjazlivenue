/**
 * Asset Generation Service
 * SIMPLIFIED: Uses Google AI SDK + Supabase Storage
 */

import { generateImage } from '../googleai/client';
import { buildAssetGenerationPrompt } from '../prompts/shopify-prompts';
import { AssetManifest, GeneratedAsset, DesignDNA } from '../types/shopify';
import { uploadAsset } from '../supabase/storage';

export interface AssetGenerationRequest {
    sessionId: string;
    designDNA: DesignDNA;
    numberOfAssets?: number;
}

export class AssetGenerationService {
    /**
     * Generate all required assets for the cloned design
     */
    async generateAssets(
        request: AssetGenerationRequest
    ): Promise<AssetManifest> {
        const { sessionId, designDNA } = request;

        try {
            const generatedAssets: GeneratedAsset[] = [];

            // Generate hero banner image
            const heroAsset = await this.generateHeroImage(sessionId, designDNA);
            generatedAssets.push(heroAsset);

            // Generate product images (2 by default)
            const productAssets = await this.generateProductImages(
                sessionId,
                designDNA,
                2
            );
            generatedAssets.push(...productAssets);

            // Generate background image (optional)
            const backgroundAsset = await this.generateBackgroundImage(
                sessionId,
                designDNA
            );
            if (backgroundAsset) {
                generatedAssets.push(backgroundAsset);
            }

            const manifest: AssetManifest = {
                sessionId,
                assets: generatedAssets,
                generatedAt: new Date().toISOString(),
            };

            return manifest;
        } catch (error: any) {
            throw new Error(`Asset generation failed: ${error.message}`);
        }
    }

    /**
     * Generate hero banner image (16:9)
     */
    private async generateHeroImage(
        sessionId: string,
        designDNA: DesignDNA
    ): Promise<GeneratedAsset> {
        const prompt = buildAssetGenerationPrompt({
            type: 'hero',
            niche: designDNA.metadata.niche || 'Modern E-commerce',
            vibe: designDNA.vibe.primary,
            colors: [
                designDNA.colors.primary,
                designDNA.colors.secondary,
                designDNA.colors.accent,
            ],
            aspectRatio: '16:9',
        });

        const response = await generateImage({
            prompt,
            aspectRatio: '16:9',
            numberOfImages: 1,
        });

        if (!response.success || !response.data || response.data.length === 0) {
            throw new Error(`Hero image generation failed: ${response.error}`);
        }

        // For placeholder URLs, we don't need to upload
        const imageUrl = response.data[0];
        const isPlaceholder = imageUrl.includes('placehold.co');

        let publicUrl = imageUrl;

        // If it's a real generated image (base64), upload to Supabase
        if (!isPlaceholder) {
            const uploadResult = await uploadAsset(
                response.data[0],
                sessionId,
                'hero-banner',
                'image/png'
            );
            publicUrl = uploadResult.publicUrl;
        }

        return {
            id: 'hero-banner',
            type: 'hero_image',
            url: publicUrl,
            prompt,
            aspectRatio: '16:9',
            width: 1920,
            height: 1080,
        };
    }

    /**
     * Generate product images (1:1)
     */
    private async generateProductImages(
        sessionId: string,
        designDNA: DesignDNA,
        count: number
    ): Promise<GeneratedAsset[]> {
        const prompt = buildAssetGenerationPrompt({
            type: 'product',
            niche: designDNA.metadata.niche || 'E-commerce Product',
            vibe: designDNA.vibe.primary,
            colors: [designDNA.colors.background, designDNA.colors.accent],
            aspectRatio: '1:1',
        });

        const response = await generateImage({
            prompt,
            aspectRatio: '1:1',
            numberOfImages: count,
        });

        if (!response.success || !response.data) {
            throw new Error(`Product image generation failed: ${response.error}`);
        }

        const assets: GeneratedAsset[] = [];

        for (let i = 0; i < response.data.length; i++) {
            const imageUrl = response.data[i];
            const isPlaceholder = imageUrl.includes('placehold.co');

            let publicUrl = imageUrl;

            // Upload real images to Supabase
            if (!isPlaceholder) {
                const uploadResult = await uploadAsset(
                    imageUrl,
                    sessionId,
                    `product-${i + 1}`,
                    'image/png'
                );
                publicUrl = uploadResult.publicUrl;
            }

            assets.push({
                id: `product-${i + 1}`,
                type: 'product_image',
                url: publicUrl,
                prompt,
                aspectRatio: '1:1',
                width: 1024,
                height: 1024,
            });
        }

        return assets;
    }

    /**
     * Generate background image (optional)
     */
    private async generateBackgroundImage(
        sessionId: string,
        designDNA: DesignDNA
    ): Promise<GeneratedAsset | null> {
        // Only generate background for certain vibes
        if (!['luxury', 'elegant', 'bold'].includes(designDNA.vibe.primary)) {
            return null;
        }

        const prompt = buildAssetGenerationPrompt({
            type: 'background',
            niche: designDNA.metadata.niche || 'Abstract',
            vibe: designDNA.vibe.primary,
            colors: [designDNA.colors.background, designDNA.colors.primary],
            aspectRatio: '16:9',
        });

        const response = await generateImage({
            prompt,
            aspectRatio: '16:9',
            numberOfImages: 1,
        });

        if (!response.success || !response.data || response.data.length === 0) {
            console.warn('Background image generation failed, skipping');
            return null;
        }

        const imageUrl = response.data[0];
        const isPlaceholder = imageUrl.includes('placehold.co');

        let publicUrl = imageUrl;

        if (!isPlaceholder) {
            const uploadResult = await uploadAsset(
                imageUrl,
                sessionId,
                'background',
                'image/png'
            );
            publicUrl = uploadResult.publicUrl;
        }

        return {
            id: 'background',
            type: 'background',
            url: publicUrl,
            prompt,
            aspectRatio: '16:9',
            width: 1920,
            height: 1080,
        };
    }
}

/**
 * Singleton instance
 */
let assetGenerationService: AssetGenerationService | null = null;

export function getAssetGenerationService(): AssetGenerationService {
    if (!assetGenerationService) {
        assetGenerationService = new AssetGenerationService();
    }
    return assetGenerationService;
}
