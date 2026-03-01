/**
 * Secondary Pages Service - Stage 6: Secondary Page Generation
 * Uses gemini-3-pro-preview (ORCHESTRATOR_MODEL) to generate additional page templates
 */

import { generateText, ORCHESTRATOR_MODEL } from '../googleai/client';
import { DesignTokens } from '../types/shopify';

export interface SecondaryPagesInput {
    designTokens: DesignTokens;
    existingSections: string[]; // List of available section filenames
}

export interface SecondaryPagesOutput {
    indexJson: string; // templates/index.json
    collectionJson: string; // templates/collection.json
    pageJson: string; // templates/page.json
    cartJson: string; // templates/cart.json
}

export class SecondaryPagesService {
    /**
     * Generate all secondary page templates
     */
    async generatePages(input: SecondaryPagesInput): Promise<SecondaryPagesOutput> {
        // Generate all pages in parallel
        const [indexJson, collectionJson, pageJson, cartJson] = await Promise.all([
            this.generateHomepage(input),
            this.generateCollection(input),
            this.generatePage(input),
            this.generateCart(input),
        ]);

        return {
            indexJson,
            collectionJson,
            pageJson,
            cartJson,
        };
    }

    /**
     * Generate templates/index.json (Homepage)
     */
    private async generateHomepage(input: SecondaryPagesInput): Promise<string> {
        const prompt = `You are a JSON generator. Return ONLY valid JSON, no explanations, no markdown, no extra text.

Generate a Shopify templates/index.json file for the homepage (Online Store 2.0 format).

CRITICAL: Your response must be ONLY the JSON object starting with { and ending with }. Do not include markdown code blocks, explanations, or any text before or after the JSON.

Required JSON structure:
{
  "sections": {
    "section_id": {
      "type": "section-type",
      "settings": {}
    }
  },
  "order": ["section_id"]
}

Design tokens to match: ${JSON.stringify(input.designTokens.colors)}

Example valid response:
{
  "sections": {
    "image_banner": {
      "type": "image-banner",
      "settings": {
        "heading": "Welcome to our store",
        "button_label": "Shop now"
      }
    },
    "featured_collection": {
      "type": "featured-collection",
      "settings": {
        "title": "Featured Products"
      }
    }
  },
  "order": ["image_banner", "featured_collection"]
}

Generate the JSON now:`;

        const response = await generateText({
            model: ORCHESTRATOR_MODEL,
            prompt,
            temperature: 0.2,
            maxTokens: 4096,
            systemInstruction: 'You are a JSON generator. Output ONLY valid JSON with no additional text or explanations.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate homepage template');
        }

        return this.cleanJsonResponse(response.data);
    }

    /**
     * Generate templates/collection.json
     */
    private async generateCollection(input: SecondaryPagesInput): Promise<string> {
        const prompt = `You are a JSON generator. Return ONLY valid JSON.

Generate Shopify templates/collection.json for product listing pages.

CRITICAL: Output ONLY the JSON object. No markdown, no explanations.

Required structure:
{
  "sections": {
    "banner": {"type": "collection-banner", "settings": {}},
    "product_grid": {"type": "main-collection-product-grid", "settings": {}}
  },
  "order": ["banner", "product_grid"]
}

Generate the JSON now:`;

        const response = await generateText({
            model: ORCHESTRATOR_MODEL,
            prompt,
            temperature: 0.2,
            maxTokens: 3072,
            systemInstruction: 'Output ONLY valid JSON with no additional text.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate collection template');
        }

        return this.cleanJsonResponse(response.data);
    }

    /**
     * Generate templates/page.json (Generic content page)
     */
    private async generatePage(input: SecondaryPagesInput): Promise<string> {
        const prompt = `Return ONLY valid JSON.

Generate Shopify templates/page.json:

{
  "sections": {
    "main": {"type": "main-page", "settings": {"padding_top": 28}}
  },
  "order": ["main"]
}

Output the JSON now:`;

        const response = await generateText({
            model: ORCHESTRATOR_MODEL,
            prompt,
            temperature: 0.2,
            maxTokens: 2048,
            systemInstruction: 'Output ONLY valid JSON.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate page template');
        }

        return this.cleanJsonResponse(response.data);
    }

    /**
     * Generate templates/cart.json
     */
    private async generateCart(input: SecondaryPagesInput): Promise<string> {
        const prompt = `Return ONLY valid JSON.

Generate Shopify templates/cart.json:

{
  "sections": {
    "cart_items": {"type": "main-cart-items", "settings": {}},
    "cart_footer": {"type": "main-cart-footer", "settings": {}}
  },
  "order": ["cart_items", "cart_footer"]
}

Output the JSON now:`;

        const response = await generateText({
            model: ORCHESTRATOR_MODEL,
            prompt,
            temperature: 0.2,
            maxTokens: 3072,
            systemInstruction: 'Output ONLY valid JSON.',
        });

        if (!response.success || !response.data) {
            throw new Error('Failed to generate cart template');
        }

        return this.cleanJsonResponse(response.data);
    }

    /**
     * Clean JSON response from AI (remove markdown wrappers)
     */
    private cleanJsonResponse(response: string): string {
        let cleaned = response.trim();

        console.log('[Stage 6] Raw AI response (first 500 chars):', cleaned.substring(0, 500));

        // Remove markdown code blocks
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        console.log('[Stage 6] Cleaned JSON (first 500 chars):', cleaned.substring(0, 500));

        // Validate it's valid JSON
        try {
            JSON.parse(cleaned);
            console.log('[Stage 6] JSON parsing successful');
            return cleaned;
        } catch (error: any) {
            console.error('[Stage 6] JSON parsing failed:', error.message);
            console.error('[Stage 6] Invalid JSON content:', cleaned.substring(0, 1000));
            throw new Error(`Generated template is not valid JSON: ${error.message}`);
        }
    }
}

/**
 * Singleton instance
 */
let secondaryPagesService: SecondaryPagesService | null = null;

export function getSecondaryPagesService(): SecondaryPagesService {
    if (!secondaryPagesService) {
        secondaryPagesService = new SecondaryPagesService();
    }
    return secondaryPagesService;
}
