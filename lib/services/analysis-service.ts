/**
 * Analysis Service - Design DNA Extraction using Gemini Flash  
 * Uses gemini-3-flash-preview with vision support
 */

import { generateFromVision, generateText, GEMINI_FLASH } from '../googleai/client';
import {
    buildVisionAnalysisPrompt,
    VISION_ANALYSIS_SYSTEM,
} from '../prompts/shopify-prompts';
import { DesignDNA } from '../types/shopify';
import { CSSData, PageMetadata } from './simplified-screenshot';

export interface AnalysisInput {
    screenshot: string; // Base64
    cssData: CSSData;
    metadata: PageMetadata;
    themeSchema?: string;
}

export class AnalysisService {
    /**
     * Extract Design DNA from screenshot or text
     */
    async extractDesignDNA(
        input: AnalysisInput,
        sessionId: string
    ): Promise<DesignDNA> {
        try {
            const textPrompt = `Analyze this website and extract design DNA.

Generate a JSON object with this exact structure:
{
  "colors": { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "text": "#..." },
  "typography": { "headingFont": { "family": "...", "weights": [400, 600], "fallback": "sans-serif" }, "bodyFont": { "family": "...", "weights": [400], "fallback": "sans-serif" }, "vibe": "modern" },
  "sections": [{"type": "hero_banner", "purpose": "..."}, {"type": "product_grid", "purpose": "..."}],
  "vibe": { "primary": "modern", "keywords": ["clean", "minimal"] },
  "metadata": { "niche": "e-commerce", "industry": "retail", "targetAudience": "general" }
}`;

            let response;

            // Use vision if screenshot is available
            if (input.screenshot) {
                response = await generateFromVision({
                    model: GEMINI_FLASH,
                    prompt: textPrompt,
                    imageData: input.screenshot,
                    mimeType: 'image/png',
                    temperature: 0.4,
                    systemInstruction: VISION_ANALYSIS_SYSTEM,
                });
            } else {
                // Fall back to text-only analysis
                response = await generateText({
                    model: GEMINI_FLASH,
                    prompt: textPrompt + `\n\nURL: ${input.metadata.url}\nColors: ${input.cssData.colors.join(', ')}\nFonts: ${input.cssData.fonts.join(', ')}`,
                    temperature: 0.4,
                    systemInstruction: VISION_ANALYSIS_SYSTEM,
                });
            }

            if (!response.success || !response.data) {
                throw new Error(
                    `Analysis failed: ${response.error || 'No data returned'}`
                );
            }

            const designDNA = this.parseDesignDNA(
                response.data,
                sessionId,
                input.metadata.url
            );

            return designDNA;
        } catch (error: any) {
            throw new Error(`Design DNA extraction failed: ${error.message}`);
        }
    }

    /**
     * Parse and validate Design DNA JSON
     */
    private parseDesignDNA(
        rawJson: string,
        sessionId: string,
        sourceUrl: string
    ): DesignDNA {
        try {
            // Clean markdown code blocks if present
            let cleanedJson = rawJson.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```/g, '');
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleanedJson);

            // Validate required fields
            if (!parsed.colors || !parsed.typography || !parsed.sections) {
                throw new Error('Missing required Design DNA fields');
            }

            // Construct complete Design DNA object
            const designDNA: DesignDNA = {
                sessionId,
                sourceUrl,
                extractedAt: new Date().toISOString(),
                colors: {
                    primary: parsed.colors.primary || '#000000',
                    secondary: parsed.colors.secondary || '#FFFFFF',
                    accent: parsed.colors.accent || '#0066FF',
                    background: parsed.colors.background || '#FFFFFF',
                    text: parsed.colors.text || '#000000',
                    additional: parsed.colors.additional || [],
                },
                typography: {
                    headingFont: {
                        family: parsed.typography.headingFont?.family || 'Inter',
                        weights: parsed.typography.headingFont?.weights || [400, 600, 700],
                        fallback: parsed.typography.headingFont?.fallback || 'sans-serif',
                    },
                    bodyFont: {
                        family: parsed.typography.bodyFont?.family || 'Inter',
                        weights: parsed.typography.bodyFont?.weights || [400, 600],
                        fallback: parsed.typography.bodyFont?.fallback || 'sans-serif',
                    },
                    vibe: parsed.typography.vibe || 'sans-serif',
                },
                sections: parsed.sections || [],
                vibe: {
                    primary: parsed.vibe?.primary || 'minimalist',
                    keywords: parsed.vibe?.keywords || ['modern', 'clean'],
                },
                metadata: {
                    niche: parsed.metadata?.niche,
                    industry: parsed.metadata?.industry,
                    targetAudience: parsed.metadata?.targetAudience,
                },
            };

            return designDNA;
        } catch (error: any) {
            throw new Error(`Failed to parse Design DNA JSON: ${error.message}`);
        }
    }

    /**
     * Validate colors are valid hex codes
     */
    private isValidHexColor(color: string): boolean {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    /**
     * Sanitize and validate Design DNA
     */
    sanitizeDesignDNA(designDNA: DesignDNA): DesignDNA {
        const sanitizeColor = (color: string): string => {
            if (this.isValidHexColor(color)) {
                return color.toUpperCase();
            }
            if (color.startsWith('rgb')) {
                return this.rgbToHex(color);
            }
            return '#000000';
        };

        designDNA.colors.primary = sanitizeColor(designDNA.colors.primary);
        designDNA.colors.secondary = sanitizeColor(designDNA.colors.secondary);
        designDNA.colors.accent = sanitizeColor(designDNA.colors.accent);
        designDNA.colors.background = sanitizeColor(designDNA.colors.background);
        designDNA.colors.text = sanitizeColor(designDNA.colors.text);
        designDNA.colors.additional = designDNA.colors.additional
            .map(sanitizeColor)
            .filter(this.isValidHexColor);

        return designDNA;
    }

    /**
     * Convert RGB/RGBA to hex
     */
    private rgbToHex(rgb: string): string {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#000000';

        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);

        return (
            '#' +
            [r, g, b]
                .map((x) => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                })
                .join('')
                .toUpperCase()
        );
    }
}

/**
 * Singleton instance
 */
let analysisService: AnalysisService | null = null;

export function getAnalysisService(): AnalysisService {
    if (!analysisService) {
        analysisService = new AnalysisService();
    }
    return analysisService;
}
