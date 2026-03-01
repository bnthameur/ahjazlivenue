/**
 * Design Token Extractor Service - Stage 3: Visual Style & Design Token Extraction
 * Uses gemini-2.5-flash for vision analysis and gemini-3-flash for CSS analysis
 */

import { generateFromVision, generateText, VISION_MODEL, CSS_ANALYZER_MODEL } from '../googleai/client';
import { DesignTokens } from '../types/shopify';

export interface TokenExtractionInput {
    screenshots: {
        desktop: string; // Base64
        mobile: string; // Base64
    };
    cssContent?: string; // Optional raw CSS
    htmlContent?: string; // Optional HTML for context
}

export class DesignTokenExtractorService {
    /**
     * Extract comprehensive design tokens from screenshots and CSS
     */
    async extractTokens(input: TokenExtractionInput): Promise<DesignTokens> {
        // Step 1: Analyze screenshots with vision model
        const visionTokens = await this.extractFromVision(input.screenshots.desktop);

        // Step 2: Analyze CSS if available
        const cssTokens = input.cssContent
            ? await this.extractFromCSS(input.cssContent)
            : null;

        // Step 3: Merge and normalize tokens
        return this.mergeTokens(visionTokens, cssTokens);
    }

    /**
     * Extract design tokens using vision analysis
     */
    private async extractFromVision(screenshot: string): Promise<Partial<DesignTokens>> {
        const prompt = `Analyze this Shopify product page screenshot and extract design tokens.

Extract the following:

1. **Colors**: Identify all unique colors used, categorize them semantically (primary, secondary, accent, background, text, etc.)
2. **Typography**: Font families, font sizes for different heading levels and body text, font weights
3. **Spacing**: Identify spacing patterns for margins and padding (create a scale like xs, sm, md, lg, xl)
4. **Border Radius**: Identify border radius values used (buttons, cards, images, etc.)
5. **Shadows**: Identify box shadow patterns used
6. **Buttons**: Identify button styles (primary, secondary, outline, etc.)

Return a JSON object:
\`\`\`json
{
  "colors": {
    "semantic": {
      "primary": "#...",
      "secondary": "#...",
      "accent": "#...",
      "background": "#...",
      "text": "#..."
    },
    "palette": ["#color1", "#color2", ...]
  },
  "typography": {
    "families": ["Font Name", "Fallback"],
    "scale": {
      "h1": "48px",
      "h2": "36px",
      "h3": "24px",
      "body": "16px",
      "small": "14px"
    },
    "weights": [400, 600, 700]
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "48px"
  },
  "borderRadius": {
    "none": "0",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  },
  "buttons": [
    {
      "name": "primary",
      "styles": {
        "bgColor": "#...",
        "textColor": "#...",
        "padding": "12px 24px",
        "borderRadius": "8px"
      }
    }
  ]
}
\`\`\``;

        const response = await generateFromVision({
            model: VISION_MODEL,
            prompt,
            imageData: screenshot,
            mimeType: 'image/png',
            temperature: 0.3,
            systemInstruction: 'You are a design system expert extracting design tokens from UI screenshots.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to extract tokens from vision analysis');
        }

        return this.parseTokenJSON(response.data);
    }

    /**
     * Extract design tokens from CSS
     */
    private async extractFromCSS(cssContent: string): Promise<Partial<DesignTokens>> {
        const prompt = `Analyze this CSS and extract design tokens.

CSS (first 3000 chars):
${cssContent.substring(0, 3000)}

Extract:
1. CSS custom properties (--color-primary, --spacing-*, etc.)
2. Common color values
3. Font family declarations
4. Spacing patterns (margin, padding)
5. Border radius values
6. Box shadow definitions

Return a JSON object with the same structure as the vision analysis.`;

        const response = await generateText({
            model: CSS_ANALYZER_MODEL,
            prompt,
            temperature: 0.2,
            systemInstruction: 'You are a CSS expert extracting design tokens from stylesheets.',
        });

        if (!response.success || !response.data) {
            return {};
        }

        return this.parseTokenJSON(response.data);
    }

    /**
     * Parse token JSON from AI response
     */
    private parseTokenJSON(jsonString: string): Partial<DesignTokens> {
        try {
            let cleaned = jsonString.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }

            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse token JSON:', error);
            return {};
        }
    }

    /**
     * Merge tokens from vision and CSS analysis
     */
    private mergeTokens(
        visionTokens: Partial<DesignTokens>,
        cssTokens: Partial<DesignTokens> | null
    ): DesignTokens {
        // Vision tokens take precedence, CSS fills gaps
        const merged: DesignTokens = {
            colors: {
                semantic: {
                    ...(cssTokens?.colors?.semantic || {}),
                    ...(visionTokens.colors?.semantic || {}),
                },
                palette: [
                    ...(cssTokens?.colors?.palette || []),
                    ...(visionTokens.colors?.palette || []),
                ],
            },
            typography: {
                families: visionTokens.typography?.families || cssTokens?.typography?.families || [],
                scale: {
                    ...(cssTokens?.typography?.scale || {}),
                    ...(visionTokens.typography?.scale || {}),
                },
                weights: [...new Set([
                    ...(cssTokens?.typography?.weights || []),
                    ...(visionTokens.typography?.weights || []),
                ])],
            },
            spacing: {
                ...(cssTokens?.spacing || {}),
                ...(visionTokens.spacing || {}),
            },
            borderRadius: {
                ...(cssTokens?.borderRadius || {}),
                ...(visionTokens.borderRadius || {}),
            },
            shadows: {
                ...(cssTokens?.shadows || {}),
                ...(visionTokens.shadows || {}),
            },
            buttons: visionTokens.buttons || cssTokens?.buttons || [],
        };

        // Deduplicate palette
        merged.colors.palette = [...new Set(merged.colors.palette)];

        return merged;
    }
}

/**
 * Singleton instance
 */
let tokenExtractorService: DesignTokenExtractorService | null = null;

export function getDesignTokenExtractorService(): DesignTokenExtractorService {
    if (!tokenExtractorService) {
        tokenExtractorService = new DesignTokenExtractorService();
    }
    return tokenExtractorService;
}
