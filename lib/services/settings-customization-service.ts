/**
 * Settings Customization Service
 * Maps design tokens to Dawn theme settings
 */

import { DesignTokens } from '../types/shopify';

export class SettingsCustomizationService {
    /**
     * Customize Dawn settings based on design tokens
     */
    async customizeSettings(
        dawnSettings: any,
        designTokens: DesignTokens
    ): Promise<any> {
        console.log('[Settings] Customizing Dawn settings');

        const customized = JSON.parse(JSON.stringify(dawnSettings)); // Deep clone

        if (!customized.current) {
            customized.current = {};
        }

        // Map colors
        if (designTokens.colors?.semantic) {
            const colors = designTokens.colors.semantic;

            if (colors.primary) {
                customized.current.colors_accent_1 = colors.primary;
            }
            if (colors.secondary) {
                customized.current.colors_accent_2 = colors.secondary;
            }
            if (colors.background_default) {
                customized.current.colors_background_1 = colors.background_default;
            }
            if (colors.text_primary) {
                customized.current.colors_text = colors.text_primary;
            }
        }

        // Map typography
        if (designTokens.typography) {
            // Dawn uses Shopify font system - map to closest match
            const families = designTokens.typography.families;
            let headingFont, bodyFont;

            if (Array.isArray(families)) {
                headingFont = families[0];
                bodyFont = families[1] || families[0];
            } else if (typeof families === 'object' && families !== null) {
                headingFont = (families as any).heading || (families as any)[0];
                bodyFont = (families as any).body || (families as any)[1];
            }

            if (headingFont) {
                customized.current.type_header_font = this.mapToShopifyFont(headingFont);
            }
            if (bodyFont) {
                customized.current.type_body_font = this.mapToShopifyFont(bodyFont);
            }

            // Font scale
            if (designTokens.typography.scale?.h1) {
                customized.current.heading_scale = 1.2; // Adjust based on ratio
            }
        }

        // Map spacing/layout
        if (designTokens.spacing) {
            customized.current.spacing_sections = 48; // Use xl spacing
        }

        // Map border radius
        if (designTokens.borderRadius) {
            const radius = designTokens.borderRadius;
            if (radius.buttons || radius.md) {
                customized.current.buttons_radius = this.parsePixels(radius.buttons || radius.md);
            }
            if (radius.cards || radius.lg) {
                customized.current.card_corner_radius = this.parsePixels(radius.cards || radius.lg);
            }
        }

        console.log('[Settings] Settings customized:', Object.keys(customized.current).length, 'properties');

        return customized;
    }

    /**
     * Map font family name to Shopify font system
     */
    private mapToShopifyFont(fontFamily: string): string {
        const normalized = fontFamily.toLowerCase();

        // Common mappings to Shopify font system
        const fontMap: Record<string, string> = {
            'montserrat': 'montserrat_n7',
            'roboto': 'roboto_n4',
            'open sans': 'open_sans_n4',
            'lato': 'lato_n4',
            'poppins': 'poppins_n4',
            'inter': 'inter_n4',
            'helvetica': 'helvetica_n4',
            'arial': 'arial_n4',
        };

        for (const [key, value] of Object.entries(fontMap)) {
            if (normalized.includes(key)) {
                return value;
            }
        }

        // Default fallback
        return 'assistant_n4';
    }

    /**
     * Parse pixel value from string
     */
    private parsePixels(value: string | number): number {
        if (typeof value === 'number') return value;
        return parseInt(value.replace('px', '')) || 0;
    }
}

/**
 * Singleton instance
 */
let settingsCustomizationService: SettingsCustomizationService | null = null;

export function getSettingsCustomizationService(): SettingsCustomizationService {
    if (!settingsCustomizationService) {
        settingsCustomizationService = new SettingsCustomizationService();
    }
    return settingsCustomizationService;
}
