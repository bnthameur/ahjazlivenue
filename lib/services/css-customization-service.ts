/**
 * CSS Customization Service
 * Generates CSS overrides to match target site design
 */

import { DesignTokens } from '../types/shopify';
import { generateText, CODE_MODEL } from '../googleai/client';

export class CSSCustomizationService {
    /**
     * Generate custom CSS from design tokens
     */
    async generateCustomCSS(designTokens: DesignTokens): Promise<string> {
        console.log('[CSS Customization] Generating CSS from design tokens');

        const prompt = `Generate CSS custom properties to customize a Shopify theme based on these design tokens.

Design Tokens:
${JSON.stringify(designTokens, null, 2)}

Requirements:
1. Output ONLY CSS custom properties (CSS variables)
2. Use :root selector
3. Override Dawn theme defaults
4. Include:
   - Color variables (--color-base-text, --color-base-accent-1, etc.)
   - Typography variables (--font-heading-family, --font-body-family,  --font-heading-scale)
   - Spacing variables (--spacing-sections-desktop, --spacing-sections-mobile)
   - Border radius (--radius-button, --radius-card)
   - Shadows if applicable
5. NO explanations, NO markdown, ONLY CSS
6. Use exact hex codes from tokens
7. Map fonts to web-safe or Google Fonts

Example output format:
:root {
    --color-base-text: #1a1a1a;
    --color-base-background-1: #ffffff;
    ...
}`;

        const response = await generateText({
            model: CODE_MODEL,
            prompt,
            systemInstruction: 'You are a CSS expert. Generate ONLY valid CSS code with no explanations or markdown.',
            temperature: 0.3,
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate custom CSS');
        }

        let css = response.data.trim();

        // Clean any markdown wrappers
        if (css.startsWith('```css') || css.startsWith('```')) {
            css = css.replace(/^```(?:css)?\s*\n/, '').replace(/\n```$/, '').trim();
        }

        console.log('[CSS Customization] Generated CSS:', css.length, 'bytes');

        return css;
    }

    /**
     * Create complete custom CSS file with header
     */
    async createCustomCSSFile(designTokens: DesignTokens): Promise<string> {
        const customCSS = await this.generateCustomCSS(designTokens);

        return `/* Theme Customization - AI Generated */
/* Based on analyzed design tokens */

${customCSS}

/* End of AI-generated customizations */
`;
    }
}

/**
 * Singleton instance
 */
let cssCustomizationService: CSSCustomizationService | null = null;

export function getCSSCustomizationService(): CSSCustomizationService {
    if (!cssCustomizationService) {
        cssCustomizationService = new CSSCustomizationService();
    }
    return cssCustomizationService;
}
