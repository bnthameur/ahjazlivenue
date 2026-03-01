/**
 * Enhanced Liquid Preview Service - Stage 8: Live Preview Rendering
 * Multi-page Liquid.js rendering with mock data injection
 */

import { Liquid } from 'liquidjs';
import { ThemeStructure } from '../types/shopify';

export type PageType = 'product' | 'home' | 'collection' | 'cart';

export interface PreviewInput {
    themeStructure: ThemeStructure;
    pageType: PageType;
    viewport?: 'desktop' | 'mobile';
}

export class EnhancedLiquidPreviewService {
    private engine: Liquid;

    constructor() {
        this.engine = new Liquid({
            cache: false, // Disable for dynamic previews
            strictFilters: false,
            strictVariables: false,
        });

        this.registerShopifyFilters();
    }

    /**
     * Render preview for specific page type
     */
    async renderPreview(input: PreviewInput): Promise<string> {
        const { themeStructure, pageType, viewport = 'desktop' } = input;

        // Get mock data for page type
        const mockData = this.getMockData(pageType);

        // Get template content
        const templateKey = this.getTemplateKey(pageType);
        const templateContent = themeStructure.templates[templateKey];

        if (!templateContent) {
            throw new Error(`Template not found: ${templateKey}`);
        }

        // Parse template JSON
        const template = JSON.parse(templateContent);

        // Build page HTML
        let pageHTML = '<div class="shopify-preview-container">';
        pageHTML += '<div class="preview-label">⚡ Simulated Shopify Preview</div>';

        // Render sections from template
        for (const sectionId of template.order || []) {
            const sectionConfig = template.sections[sectionId];
            const sectionType = sectionConfig.type;
            const sectionSettings = sectionConfig.settings || {};

            // Find section file
            const sectionFile = `${sectionType}.liquid`;
            const sectionContent = themeStructure.sections[sectionFile];

            if (sectionContent) {
                try {
                    // Remove schema from section content (everything after {% schema %})
                    const liquidOnly = sectionContent.split('{%')[0] || sectionContent;

                    const rendered = await this.engine.parseAndRender(
                        liquidOnly,
                        { ...mockData, section: { settings: sectionSettings } }
                    );
                    pageHTML += rendered;
                } catch (error) {
                    console.error(`Error rendering section ${sectionType}:`, error);
                    pageHTML += `<div class="section-error">Error rendering section: ${sectionType}</div>`;
                }
            }
        }

        pageHTML += '</div>';

        // Wrap in layout
        const layout = themeStructure.layout['theme.liquid'];
        const css = (themeStructure.assets['base.css'] || '').toString();

        const fullHTML = await this.wrapInLayout(pageHTML, layout, css, viewport);

        return fullHTML;
    }

    /**
     * Get template key for page type
     */
    private getTemplateKey(pageType: PageType): string {
        const map: Record<PageType, string> = {
            product: 'product.json',
            home: 'index.json',
            collection: 'collection.json',
            cart: 'cart.json',
        };
        return map[pageType];
    }

    /**
     * Get mock data for page type
     */
    private getMockData(pageType: PageType): Record<string, any> {
        const baseData = {
            shop: {
                name: 'Demo Store',
                url: 'https://demo-store.myshopify.com',
            },
            cart: {
                item_count: 2,
            },
            settings: {},
        };

        switch (pageType) {
            case 'product':
                return {
                    ...baseData,
                    product: {
                        title: 'Sample Product',
                        description: 'This is a sample product description showcasing the theme design.',
                        price: 2999,
                        compare_at_price: 3499,
                        available: true,
                        featured_image: 'https://placehold.co/600x600/6366F1/FFFFFF/png?text=Product',
                        images: [
                            { src: 'https://placehold.co/600x600/6366F1/FFFFFF/png?text=Product+1' },
                            { src: 'https://placehold.co/600x600/8B5CF6/FFFFFF/png?text=Product+2' },
                        ],
                        variants: [
                            { id: 1, title: 'Small', price: 2999, available: true },
                            { id: 2, title: 'Medium', price: 2999, available: true },
                            { id: 3, title: 'Large', price: 3499, available: false },
                        ],
                        options: [
                            { name: 'Size', values: ['Small', 'Medium', 'Large'] },
                        ],
                    },
                };

            case 'collection':
                return {
                    ...baseData,
                    collection: {
                        title: 'All Products',
                        description: 'Browse our collection of products',
                        products: [
                            {
                                title: 'Product 1',
                                price: 2999,
                                featured_image: 'https://placehold.co/400x400/6366F1/FFFFFF/png?text=1',
                                url: '/products/product-1',
                            },
                            {
                                title: 'Product 2',
                                price: 3499,
                                featured_image: 'https://placehold.co/400x400/8B5CF6/FFFFFF/png?text=2',
                                url: '/products/product-2',
                            },
                            {
                                title: 'Product 3',
                                price: 1999,
                                featured_image: 'https://placehold.co/400x400/EC4899/FFFFFF/png?text=3',
                                url: '/products/product-3',
                            },
                        ],
                    },
                };

            case 'cart':
                return {
                    ...baseData,
                    cart: {
                        item_count: 2,
                        total_price: 5998,
                        items: [
                            {
                                title: 'Sample Product',
                                quantity: 1,
                                price: 2999,
                                line_price: 2999,
                                image: 'https://placehold.co/200x200/6366F1/FFFFFF/png?text=Cart+1',
                            },
                            {
                                title: 'Another Product',
                                quantity: 1,
                                price: 2999,
                                line_price: 2999,
                                image: 'https://placehold.co/200x200/8B5CF6/FFFFFF/png?text=Cart+2',
                            },
                        ],
                    },
                };

            case 'home':
            default:
                return {
                    ...baseData,
                    collections: [
                        {
                            title: 'Featured Collection',
                            url: '/collections/featured',
                        },
                    ],
                };
        }
    }

    /**
     * Wrap content in layout
     */
    private async wrapInLayout(
        content: string,
        layout: string,
        css: string,
        viewport: 'desktop' | 'mobile'
    ): Promise<string> {
        const viewportWidth = viewport === 'mobile' ? '390px' : '100%';

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Preview</title>
    <style>
        ${css}
        
        /* Preview-specific styles */
        .shopify-preview-container {
            max-width: ${viewportWidth};
            margin: 0 auto;
        }
        
        .preview-label {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .section-error {
            background: #fee;
            color: #c00;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #c00;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

        return html;
    }

    /**
     * Register Shopify-specific Liquid filters
     */
    private registerShopifyFilters(): void {
        // Money filter
        this.engine.registerFilter('money', (value: number) => {
            return `$${(value / 100).toFixed(2)}`;
        });

        // Money with currency filter
        this.engine.registerFilter('money_with_currency', (value: number) => {
            return `$${(value / 100).toFixed(2)} USD`;
        });

        // Asset URL filter
        this.engine.registerFilter('asset_url', (filename: string) => {
            return `/assets/${filename}`;
        });

        // Stylesheet tag filter
        this.engine.registerFilter('stylesheet_tag', (url: string) => {
            return `<link rel="stylesheet" href="${url}">`;
        });

        // Script tag filter
        this.engine.registerFilter('script_tag', (url: string) => {
            return `<script src="${url}"></script>`;
        });

        // Image URL filter
        this.engine.registerFilter('img_url', (url: string, size: string) => {
            return url; // In preview, just return the URL as-is
        });

        // Image tag filter
        this.engine.registerFilter('img_tag', (url: string, alt: string) => {
            return `<img src="${url}" alt="${alt || ''}">`;
        });

        // URL filter
        this.engine.registerFilter('url', (path: string) => {
            return path;
        });
    }
}

/**
 * Singleton instance
 */
let enhancedLiquidPreviewService: EnhancedLiquidPreviewService | null = null;

export function getEnhancedLiquidPreviewService(): EnhancedLiquidPreviewService {
    if (!enhancedLiquidPreviewService) {
        enhancedLiquidPreviewService = new EnhancedLiquidPreviewService();
    }
    return enhancedLiquidPreviewService;
}
