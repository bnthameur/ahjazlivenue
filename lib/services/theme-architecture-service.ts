/**
 * Theme Architecture Service - Stage 5: Global Theme Architecture
 * Uses gemini-3-pro-preview (CODE_MODEL) to generate theme foundation
 */

import { generateText, CODE_MODEL } from '../googleai/client';
import { DesignTokens } from '../types/shopify';

export interface ThemeArchitectureInput {
    designTokens: DesignTokens;
    themeName?: string;
}

export interface ThemeArchitectureOutput {
    themeLayout: string; // layout/theme.liquid
    headerSection: string; // sections/header.liquid
    footerSection: string; // sections/footer.liquid
    baseCSS: string; // assets/base.css
}

export class ThemeArchitectureService {
    /**
     * Generate global theme architecture
     */
    async generateArchitecture(input: ThemeArchitectureInput): Promise<ThemeArchitectureOutput> {
        const themeName = input.themeName || 'Generated Theme';

        // Generate all components in parallel for efficiency
        const [themeLayout, headerSection, footerSection, baseCSS] = await Promise.all([
            this.generateThemeLayout(input.designTokens, themeName),
            this.generateHeaderSection(input.designTokens),
            this.generateFooterSection(input.designTokens),
            this.generateBaseCSS(input.designTokens),
        ]);

        return {
            themeLayout,
            headerSection,
            footerSection,
            baseCSS,
        };
    }

    /**
     * Generate layout/theme.liquid
     */
    private async generateThemeLayout(tokens: DesignTokens, themeName: string): Promise<string> {
        const prompt = `Generate a Shopify layout/theme.liquid file for Online Store 2.0.

Theme Name: ${themeName}

Design Tokens:
${JSON.stringify(tokens, null, 2)}

Requirements:
1. Complete HTML5 document structure
2. Meta tags (viewport, charset, SEO-ready)
3. {{ content_for_header }} in <head>
4. Include sections: {% section 'header' %} and {% section 'footer' %}
5. {{ content_for_layout }} in main body
6. Link to base.css in assets: {{ 'base.css' | asset_url | stylesheet_tag }}
7. Shopify required scripts at bottom
8. Mobile-first responsive
9. Follow Dawn-like conventions
10. Use design token CSS variables

Generate ONLY the Liquid template code, no explanations.`;

        const response = await generateText({
            model: CODE_MODEL,
            prompt,
            temperature: 0.3,
            maxTokens: 4096,
            systemInstruction: 'You are a Shopify theme expert generating production-ready Liquid templates following Online Store 2.0 and Dawn conventions.',
        });

        console.log('[Stage 5] Layout generation response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error,
        });

        if (!response.success || !response.data) {
            console.error('[Stage 5] Layout generation failed:', response.error);
            throw new Error(`Failed to generate theme layout: ${response.error || 'No data returned'}`);
        }

        return response.data;
    }

    /**
     * Generate sections/header.liquid
     */
    private async generateHeaderSection(tokens: DesignTokens): Promise<string> {
        const prompt = `Generate a Shopify sections/header.liquid file for Online Store 2.0.

Design Tokens:
Colors: ${JSON.stringify(tokens.colors.semantic)}
Typography: ${JSON.stringify(tokens.typography)}
Spacing: ${JSON.stringify(tokens.spacing)}

Requirements:
1. Navigation menu (main menu from shop settings)
2. Logo/store name (using shop.name)
3. Search icon/button (modal or inline)
4. Cart icon with item count ({{ cart.item_count }})
5. Mobile hamburger menu toggle
6. Sticky header option (schema setting)
7. Mobile-first responsive design
8. Use design token CSS variables for colors/spacing
9. Include complete JSON schema at bottom with settings for:
   - Logo image picker
   - Menu selection
   - Sticky header toggle
   - Background/text colors
10. Follow Dawn-like structure with semantic HTML

Generate ONLY the complete Liquid section code with schema, no explanations.`;

        const response = await generateText({
            model: CODE_MODEL,
            prompt,
            temperature: 0.3,
            maxTokens: 6144,
        });

        console.log('[Stage 5] Header generation response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error,
        });

        if (!response.success || !response.data) {
            console.error('[Stage 5] Header generation failed:', response.error);
            throw new Error(`Failed to generate header section: ${response.error || 'No data returned'}`);
        }

        return response.data;
    }

    /**
     * Generate sections/footer.liquid
     */
    private async generateFooterSection(tokens: DesignTokens): Promise<string> {
        const prompt = `Generate a Shopify sections/footer.liquid file for Online Store 2.0.

Design Tokens:
Colors: ${JSON.stringify(tokens.colors.semantic)}
Typography: ${JSON.stringify(tokens.typography)}
Spacing: ${JSON.stringify(tokens.spacing)}

Requirements:
1. Footer links section (menus from shop settings)
2. Newsletter signup form placeholder (email input)
3. Social media icon placeholders (Instagram, Facebook, Twitter, etc.)
4. Copyright text with {{ shop.name }} and current year
5. Payment icons (optional via schema)
6. Multi-column layout on desktop, stacked on mobile
7. Mobile-first responsive design
8. Use design token CSS variables
9. Include complete JSON schema at bottom with settings for:
   - Newsletter heading
   - Multiple menu pickers
   - Social media URLs
   - Background/text colors
   - Show/hide payment icons
10. Follow Dawn-like structure

Generate ONLY the complete Liquid section code with schema, no explanations.`;

        const response = await generateText({
            model: CODE_MODEL,
            prompt,
            temperature: 0.3,
            maxTokens: 6144,
        });

        console.log('[Stage 5] Footer generation response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error,
        });

        if (!response.success || !response.data) {
            console.error('[Stage 5] Footer generation failed:', response.error);
            throw new Error(`Failed to generate footer section: ${response.error || 'No data returned'}`);
        }

        return response.data;
    }

    /**
     * Generate assets/base.css
     */
    private async generateBaseCSS(tokens: DesignTokens): Promise<string> {
        const prompt = `Generate a base.css file for a Shopify theme using these design tokens.

Design Tokens:
${JSON.stringify(tokens, null, 2)}

Requirements:
1. CSS custom properties (variables) at :root for all tokens
2. CSS reset/normalize
3. Mobile-first responsive utilities
4. Typography styles using token scale
5. Spacing utilities (margin, padding)
6. Color utilities
7. Layout utilities (container, grid, flex)
8. Button base styles
9. Form input base styles
10. Responsive breakpoints (mobile-first)
11. NO inline styles
12. Follow modern CSS best practices
13. Accessibility-friendly (focus states, contrast)

Structure:
/* CSS Variables */
:root { ... }

/* Reset */
*, *::before, *::after { ... }

/* Typography */
body { ... }
h1, h2, h3, ... { ... }

/* Layout */
.container { ... }
.page-width { ... }

/* Utilities */
.button { ... }
.grid { ... }

/* Components */
/* Responsive */
@media (min-width: 750px) { ... }
@media (min-width: 990px) { ... }

Generate ONLY the CSS code, no explanations.`;

        const response = await generateText({
            model: CODE_MODEL,
            prompt,
            temperature: 0.2,
            maxTokens: 8192,
        });

        console.log('[Stage 5] CSS generation response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error,
        });

        if (!response.success || !response.data) {
            console.error('[Stage 5] CSS generation failed:', response.error);
            throw new Error(`Failed to generate base CSS: ${response.error || 'No data returned'}`);
        }

        return response.data;
    }
}

/**
 * Singleton instance
 */
let themeArchitectureService: ThemeArchitectureService | null = null;

export function getThemeArchitectureService(): ThemeArchitectureService {
    if (!themeArchitectureService) {
        themeArchitectureService = new ThemeArchitectureService();
    }
    return themeArchitectureService;
}
