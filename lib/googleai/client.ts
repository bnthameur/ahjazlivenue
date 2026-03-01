import { GoogleGenAI } from '@google/genai';

export const VISION_MODEL = 'gemini-2.5-flash'; // Screenshot analysis, design token extraction
export const LLM_MODEL = 'gemini-2.5-pro'; // Product logic, JSON mapping
export const CODE_MODEL = 'gemini-3-pro-preview'; // Liquid template generation, theme architecture
export const DOM_ANALYZER_MODEL = 'gemini-2.5-pro'; // DOM parsing, section segmentation
export const CSS_ANALYZER_MODEL = 'gemini-2.5-pro'; // Design token extraction
export const ORCHESTRATOR_MODEL = 'gemini-3-pro-preview'; // Secondary page generation, workflow coordination

// Legacy constants for backward compatibility
export const GEMINI_FLASH = 'gemini-3-flash-preview'; // Vision & Analysis
export const GEMINI_PRO = 'gemini-3-pro-preview'; // Coding & Logic  
export const GEMINI_PRO_IMAGE = 'gemini-3-pro-image-preview'; // Image generation

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
}

export interface TextGenerationRequest {
    model: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
}

export interface VisionGenerationRequest {
    model: string;
    prompt: string;
    imageData: string; // Base64 encoded
    mimeType: string;
    temperature?: number;
    systemInstruction?: string;
}

export interface ImageGenerationRequest {
    prompt: string;
    aspectRatio?: '16:9' | '1:1' | '4:3' | '9:16';
    numberOfImages?: number;
    model?: string;
}

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Generate text using Gemini Flash or Pro
 */
export async function generateText(
    request: TextGenerationRequest
): Promise<AIResponse<string>> {
    try {
        const ai = getGenAI();

        // Build config with thinkingConfig for Gemini 3 models
        const config: any = {
            systemInstruction: request.systemInstruction,
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens || 8192,
        };

        // Add thinkingConfig for Gemini 3 models
        if (request.model.includes('gemini-3')) {
            config.thinkingConfig = {
                thinkingLevel: 'low', // Fast, efficient for code generation
            };
        }

        const result = await ai.models.generateContent({
            model: request.model,
            contents: request.prompt,
            config,
        });

        const text = result.text || '';

        return {
            success: true,
            data: text,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Generate content from image and text using Gemini Flash
 */
export async function generateFromVision(
    request: VisionGenerationRequest
): Promise<AIResponse<string>> {
    try {
        const ai = getGenAI();

        // Build content parts with image and text
        const contents = [
            {
                inlineData: {
                    data: request.imageData,
                    mimeType: request.mimeType,
                },
            },
            { text: request.prompt },
        ];

        // Build config with thinkingConfig for Gemini 3 models
        const config: any = {
            systemInstruction: request.systemInstruction,
            temperature: request.temperature || 0.4,
            maxOutputTokens: 8192,
        };

        // Add thinkingConfig for Gemini 3 models
        if (request.model.includes('gemini-3')) {
            config.thinkingConfig = {
                thinkingLevel: 'low',
            };
        }

        const result = await ai.models.generateContent({
            model: request.model,
            contents: contents,
            config,
        });

        const text = result.text || '';

        return {
            success: true,
            data: text,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Generate images using gemini-3-pro-image-preview
 */
export async function generateImage(
    request: ImageGenerationRequest
): Promise<AIResponse<string[]>> {
    try {
        const ai = getGenAI();

        const numberOfImages = request.numberOfImages || 1;
        const imageUrls: string[] = [];

        // Generate images
        for (let i = 0; i < numberOfImages; i++) {
            const result = await ai.models.generateContent({
                model: request.model || GEMINI_PRO_IMAGE,
                contents: request.prompt,
            });

            // Extract image data from response
            // Note: Actual implementation depends on API response format
            const text = result.text || '';

            // For now, use placeholders until we verify the exact response format
            const width = request.aspectRatio === '16:9' ? 1920 : 1024;
            const height = request.aspectRatio === '16:9' ? 1080 : 1024;
            const placeholderUrl = `https://placehold.co/${width}x${height}/6366F1/FFFFFF/png?text=Generated+${i + 1}`;

            imageUrls.push(placeholderUrl);
        }

        return {
            success: true,
            data: imageUrls,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Helper: Convert image URL to base64
 */
export async function imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
}
