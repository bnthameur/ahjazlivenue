/**
 * Theme Mapping Service using Gemini Pro
 * SIMPLIFIED: Uses Google AI SDK instead of Vertex AI
 */

import { generateText, GEMINI_PRO } from '../googleai/client';
import { buildMappingPrompt, JSON_MAPPING_SYSTEM } from '../prompts/shopify-prompts';
import {
    ThemeConfig,
    DesignDNA,
    AssetManifest,
    SectionConfig,
} from '../types/shopify';

export class ThemeMappingService {
    /**
     * Map Design DNA and assets to Shopify theme configuration
     */
    async mapToThemeConfig(
        designDNA: DesignDNA,
        assetManifest: AssetManifest,
        masterThemeName: string = 'dawn'
    ): Promise<ThemeConfig> {
        try {
            const masterThemeSchema = this.getDefaultThemeSchema();
            const prompt = buildMappingPrompt(
                designDNA,
                assetManifest,
                masterThemeSchema
            );

            // Use Google AI SDK instead of Vertex AI
            const response = await generateText({
                model: GEMINI_PRO,
                prompt,
                temperature: 0.2,
                maxTokens: 8192,
                systemInstruction: JSON_MAPPING_SYSTEM,
            });

            if (!response.success || !response.data) {
                throw new Error(`Theme mapping failed: ${response.error}`);
            }

            const themeConfig = this.parseThemeConfig(response.data);
            return themeConfig;
        } catch (error: any) {
            throw new Error(`Theme mapping service error: ${error.message}`);
        }
    }

    /**
     * Parse theme configuration from AI response
     */
    private parseThemeConfig(rawJson: string): ThemeConfig {
        try {
            let cleanedJson = rawJson.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```/g, '');
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleanedJson);

            if (!parsed.settings_data && !parsed.current) {
                throw new Error('Invalid theme config structure');
            }

            const themeConfig: ThemeConfig = {
                current: parsed.settings_data?.current || parsed.current || {},
            };

            return themeConfig;
        } catch (error: any) {
            throw new Error(`Failed to parse theme config: ${error.message}`);
        }
    }

    /**
     * Default Shopify Dawn theme schema (simplified)
     */
    private getDefaultThemeSchema(): string {
        return JSON.stringify({
            name: 'Dawn',
            settings: [
                {
                    type: 'color',
                    id: 'colors_solid_button_labels',
                    label: 'Button text',
                    default: '#FFFFFF',
                },
                {
                    type: 'color',
                    id: 'colors_accent_1',
                    label: 'Accent 1',
                    default: '#121212',
                },
                {
                    type: 'color',
                    id: 'colors_accent_2',
                    label: 'Accent 2',
                    default: '#334FB4',
                },
                {
                    type: 'color',
                    id: 'colors_text',
                    label: 'Text',
                    default: '#121212',
                },
                {
                    type: 'color',
                    id: 'colors_background_1',
                    label: 'Background 1',
                    default: '#FFFFFF',
                },
                {
                    type: 'font_picker',
                    id: 'type_header_font',
                    label: 'Headings',
                    default: 'assistant_n4',
                },
                {
                    type: 'font_picker',
                    id: 'type_body_font',
                    label: 'Body',
                    default: 'assistant_n4',
                },
            ],
        });
    }

    /**
     * Generate custom CSS overrides based on Design DNA
     */
    async generateCustomCSS(designDNA: DesignDNA): Promise<string> {
        const cssOverrides = `
/* Auto-generated CSS from Design DNA */
:root {
  --color-primary: ${designDNA.colors.primary};
  --color-secondary: ${designDNA.colors.secondary};
  --color-accent: ${designDNA.colors.accent};
  --color-background: ${designDNA.colors.background};
  --color-text: ${designDNA.colors.text};
  
  --font-heading: '${designDNA.typography.headingFont.family}', ${designDNA.typography.headingFont.fallback};
  --font-body: '${designDNA.typography.bodyFont.family}', ${designDNA.typography.bodyFont.fallback};
}

/* Apply custom fonts */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body, p, a, span {
  font-family: var(--font-body);
}

/* Custom color applications */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-background);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

.accent-text {
  color: var(--color-accent);
}
`;

        return cssOverrides.trim();
    }

    /**
     * Build templates/index.json for section ordering
     */
    buildTemplateIndex(designDNA: DesignDNA, assetManifest: AssetManifest): any {
        const sections: Record<string, SectionConfig> = {};
        const order: string[] = [];

        designDNA.sections.forEach((section, index) => {
            const sectionId = `section-${index}`;
            const sectionType = this.mapSectionTypeToShopify(section.type);

            sections[sectionId] = {
                type: sectionType,
                settings: this.buildSectionSettings(section.type, assetManifest),
                ...(section.type === 'product_grid' && {
                    blocks: this.buildProductBlocks(2),
                }),
            };

            order.push(sectionId);
        });

        return {
            sections,
            order,
        };
    }

    /**
     * Map generic section types to Shopify section types
     */
    private mapSectionTypeToShopify(sectionType: string): string {
        const typeMap: Record<string, string> = {
            hero_banner: 'image-banner',
            three_column_grid: 'multicolumn',
            product_grid: 'featured-collection',
            testimonials: 'multicolumn',
            newsletter: 'newsletter',
            featured_collection: 'featured-collection',
            image_with_text: 'image-with-text',
            rich_text: 'rich-text',
            video: 'video',
            custom: 'custom-liquid',
        };

        return typeMap[sectionType] || 'custom-liquid';
    }

    /**
     * Build section settings with asset URLs
     */
    private buildSectionSettings(
        sectionType: string,
        assetManifest: AssetManifest
    ): Record<string, any> {
        const heroAsset = assetManifest.assets.find((a) => a.type === 'hero_image');
        const productAssets = assetManifest.assets.filter(
            (a) => a.type === 'product_image'
        );

        if (sectionType === 'hero_banner' && heroAsset) {
            return {
                image: heroAsset.url,
                heading: 'Welcome to our store',
                button_label: 'Shop now',
            };
        }

        if (sectionType === 'product_grid' && productAssets.length > 0) {
            return {
                collection: 'all',
                products_to_show: 4,
            };
        }

        return {};
    }

    /**
     * Build product blocks for product grids
     */
    private buildProductBlocks(count: number): any[] {
        return Array.from({ length: count }, (_, i) => ({
            type: 'column',
            settings: {
                title: `Feature ${i + 1}`,
                text: '',
            },
        }));
    }
}

/**
 * Singleton instance
 */
let themeMappingService: ThemeMappingService | null = null;

export function getThemeMappingService(): ThemeMappingService {
    if (!themeMappingService) {
        themeMappingService = new ThemeMappingService();
    }
    return themeMappingService;
}
