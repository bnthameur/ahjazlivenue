/**
 * Product Logic Service - Stage 4: Product Page Logic Reconstruction
 * Uses gemini-2.5-pro to reconstruct product page behavior and generate Liquid templates
 */

import { generateText, LLM_MODEL } from '../googleai/client';
import { SectionBlueprint, DesignTokens } from '../types/shopify';

export interface ProductLogicInput {
    blueprint: SectionBlueprint[];
    designTokens: DesignTokens;
    sourceUrl: string;
}

export interface ProductLogicOutput {
    mainProductLiquid: string;
    supportingSections: Record<string, string>; // section name -> Liquid content
    schemas: Record<string, any>; // section name -> JSON schema
}

export class ProductLogicService {
    /**
     * Generate product page logic and Liquid templates
     */
    async generateProductLogic(input: ProductLogicInput): Promise<ProductLogicOutput> {
        // Generate main product section
        const mainProductLiquid = await this.generateMainProduct(input);

        // Generate supporting sections
        const supportingSections = await this.generateSupportingSections(input);

        // Generate schemas for all sections
        const schemas = await this.generateSchemas(input);

        return {
            mainProductLiquid,
            supportingSections,
            schemas,
        };
    }

    /**
     * Generate main-product.liquid
     */
    private async generateMainProduct(input: ProductLogicInput): Promise<string> {
        const productBlueprint = input.blueprint.find(
            (s) => s.type === 'product_media' || s.type === 'product_form' || s.type.includes('product')
        );

        const prompt = `Generate a Shopify main-product.liquid section file for Online Store 2.0.

Based on this structural blueprint:
${JSON.stringify(productBlueprint, null, 2)}

Using these design tokens:
Colors: ${JSON.stringify(input.designTokens.colors.semantic)}
Typography: ${JSON.stringify(input.designTokens.typography.scale)}
Spacing: ${JSON.stringify(input.designTokens.spacing)}

Requirements:
1. Shopify product object integration (product, variants, prices, availability)
2. Media gallery with zoom and thumbnail navigation
3. Variant selector (dropdown or button group based on options)
4. Quantity input with +/- buttons
5. Add-to-cart button with loading state
6. Dynamic metafield rendering
7. Stock availability display
8. Price formatting with currency
9. Sale badge if on sale
10. Mobile-first responsive design
11. Use design tokens for styling
12. Include proper Liquid schema at the end

Generate ONLY the Liquid template code, no explanations.`;

        const response = await generateText({
            model: LLM_MODEL,
            prompt,
            temperature: 0.4,
            maxTokens: 8192,
            systemInstruction: 'You are a Shopify Liquid expert generating production-ready theme code.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate main product Liquid');
        }

        return response.data;
    }

    /**
     * Generate supporting sections (USP, reviews, FAQ, etc.)
     */
    private async generateSupportingSections(input: ProductLogicInput): Promise<Record<string, string>> {
        const sections: Record<string, string> = {};

        // Filter out main product sections
        const supportingBlueprints = input.blueprint.filter(
            (s) => !s.type.includes('product_media') && !s.type.includes('product_form')
        );

        for (const blueprint of supportingBlueprints.slice(0, 5)) {
            // Limit to 5 to save tokens
            const sectionName = this.getSectionFileName(blueprint.type);

            const prompt = `Generate a Shopify section file for: ${blueprint.type}

Blueprint:
${JSON.stringify(blueprint, null, 2)}

Design tokens:
${JSON.stringify(input.designTokens, null, 2)}

Generate a complete Liquid section with schema. Make it reusable and customizable.
Generate ONLY the code, no explanations.`;

            const response = await generateText({
                model: LLM_MODEL,
                prompt,
                temperature: 0.4,
                maxTokens: 4096,
            });

            if (response.success && response.data) {
                sections[sectionName] = response.data;
            }
        }

        return sections;
    }

    /**
     * Generate JSON schemas for sections
     */
    private async generateSchemas(input: ProductLogicInput): Promise<Record<string, any>> {
        const schemas: Record<string, any> = {};

        for (const blueprint of input.blueprint.slice(0, 6)) {
            const sectionName = this.getSectionFileName(blueprint.type);

            // Extract schema from blueprint inputs
            const schema = {
                name: this.humanize(blueprint.type),
                settings: blueprint.inputs.map((input) => ({
                    type: this.mapInputType(input.type),
                    id: this.slugify(input.purpose),
                    label: this.humanize(input.purpose),
                    default: input.defaultValue || '',
                })),
            };

            schemas[sectionName] = schema;
        }

        return schemas;
    }

    /**
     * Helper: Convert blueprint type to section file name
     */
    private getSectionFileName(type: string): string {
        return type.replace(/_/g, '-') + '.liquid';
    }

    /**
     * Helper: Map input type to Shopify schema type
     */
    private mapInputType(type: string): string {
        const typeMap: Record<string, string> = {
            text: 'text',
            image: 'image_picker',
            url: 'url',
            'product-ref': 'product',
            color: 'color',
            number: 'range',
        };

        return typeMap[type] || 'text';
    }

    /**
     * Helper: Convert snake_case to Humanized Text
     */
    private humanize(str: string): string {
        return str
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    /**
     * Helper: Convert text to slug
     */
    private slugify(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }
}

/**
 * Singleton instance
 */
let productLogicService: ProductLogicService | null = null;

export function getProductLogicService(): ProductLogicService {
    if (!productLogicService) {
        productLogicService = new ProductLogicService();
    }
    return productLogicService;
}
