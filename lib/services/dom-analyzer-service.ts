/**
 * DOM Analyzer Service - Stage 2: DOM & Section Structure Analysis
 * Uses headless browser (Puppeteer) to capture fully rendered DOM
 * Analyzes with gemini-3-flash for section segmentation and hierarchy extraction
 */

import { generateText, DOM_ANALYZER_MODEL } from '../googleai/client';
import { SectionBlueprint } from '../types/shopify';

export interface DOMAnalysisInput {
    url: string;
    waitForSelectors?: string[]; // Optional selectors to wait for before capturing
    timeout?: number; // Max wait time in ms
}

export interface DOMAnalysisResult {
    success: boolean;
    structuralBlueprint: SectionBlueprint[];
    fullHTML?: string;
    screenshots?: {
        desktop: string; // Base64
        mobile: string; // Base64
    };
    error?: string;
}

export class DOMAnalyzerService {
    /**
     * Analyze DOM using headless browser + Gemini 3 Flash
     */
    async analyzePage(input: DOMAnalysisInput): Promise<DOMAnalysisResult> {
        let browser;
        try {
            // Import Puppeteer dynamically (only when needed)
            const puppeteer = await import('puppeteer');

            console.log('[DOM Analyzer] Launching browser...');

            // Launch headless browser
            browser = await puppeteer.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                ],
            });

            const page = await browser.newPage();

            // Set a longer timeout for slow sites
            page.setDefaultNavigationTimeout(90000); // 90 seconds
            page.setDefaultTimeout(90000);

            console.log(`[DOM Analyzer] Navigating to: ${input.url}`);

            // Navigate to URL with more lenient wait condition
            await page.goto(input.url, {
                waitUntil: 'domcontentloaded', // Changed from 'networkidle0' for faster response
                timeout: input.timeout || 90000,
            });

            console.log('[DOM Analyzer] Page loaded, waiting for content...');

            // Wait for specific selectors if provided
            if (input.waitForSelectors?.length) {
                for (const selector of input.waitForSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 5000 });
                    } catch {
                        // Continue if selector not found
                        console.log(`[DOM Analyzer] Selector not found: ${selector}`);
                    }
                }
            }

            // Additional wait for client-side rendering (JS hydration)
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds

            console.log('[DOM Analyzer] Capturing screenshots...');

            // Capture desktop screenshot
            await page.setViewport({ width: 1920, height: 1080 });
            const desktopScreenshot = await page.screenshot({
                encoding: 'base64',
                fullPage: true,
            });

            // Capture mobile screenshot
            await page.setViewport({ width: 390, height: 844 });
            const mobileScreenshot = await page.screenshot({
                encoding: 'base64',
                fullPage: true,
            });

            // Get fully rendered HTML
            const fullHTML = await page.content();

            // Extract structured data from DOM
            const domData = await page.evaluate(() => {
                // Get all Shopify sections
                const sections = Array.from(
                    document.querySelectorAll('[class*="shopify-section"], [id*="shopify-section"]')
                );

                // Extract section information
                return sections.map((section) => {
                    const rect = section.getBoundingClientRect();
                    return {
                        id: section.id,
                        classes: section.className,
                        boundingBox: {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                        },
                        html: section.outerHTML,
                    };
                });
            });

            await browser.close();

            // Now analyze with Gemini 3 Flash
            const structuralBlueprint = await this.analyzeWithGemini(fullHTML, domData);

            return {
                success: true,
                structuralBlueprint,
                fullHTML,
                screenshots: {
                    desktop: desktopScreenshot as string,
                    mobile: mobileScreenshot as string,
                },
            };
        } catch (error: any) {
            console.error('[DOM Analyzer] Error:', error.message);

            // Make sure browser is closed
            try {
                if (browser) await browser.close();
            } catch { }

            return {
                success: false,
                structuralBlueprint: [],
                error: `DOM analysis failed: ${error.message}`,
            };
        }
    }

    /**
     * Analyze DOM structure using Gemini 3 Flash
     */
    private async analyzeWithGemini(
        html: string,
        domData: any[]
    ): Promise<SectionBlueprint[]> {
        try {
            const prompt = `Analyze this Shopify product page and extract a structural blueprint.

I need you identify and segment the page into logical sections. For each section, provide:

1. Type (e.g., "header", "announcement_bar", "product_media", "product_form", "usp_blocks", "reviews", "faq", "cross_sell", "footer")
2. Purpose (brief description)
3. Visual hierarchy (list of key elements with importance scores 1-10)
4. Repeating patterns (e.g., product cards, testimonial items)
5. Inputs needed (text, images, URLs, product references)
6. Conditional logic (e.g., "show reviews if > 0", "hide if out of stock")

Return a JSON array of sections. Example:
\`\`\`json
[
  {
    "type": "hero_banner",
    "purpose": "Main product showcase",
    "visualHierarchy": [
      {"element": "product-image", "importance": 10},
      {"element": "product-title", "importance": 9},
      {"element": "price", "importance": 8}
    ],
    "repeatingPatterns": [],
    "inputs": [
      {"type": "image", "purpose": "hero_image"},
      {"type": "text", "purpose": "headline"}
    ],
    "conditionalLogic": ["show badge if on_sale"]
  }
]
\`\`\`

HTML to analyze (first 5000 chars):
${html.substring(0, 5000)}

DOM sections found: ${domData.length}
${JSON.stringify(domData.slice(0, 3), null, 2)}`;

            console.log('[DOM Analyzer] Calling Gemini for analysis...');

            const response = await generateText({
                model: DOM_ANALYZER_MODEL,
                prompt,
                temperature: 0.3,
                systemInstruction:
                    'You are a Shopify theme expert analyzing page structure for theme reconstruction.',
            });

            console.log('[DOM Analyzer] Gemini response:', {
                success: response.success,
                hasData: !!response.data,
                error: response.error,
            });

            if (!response.success || !response.data) {
                throw new Error(`Gemini analysis failed: ${response.error || 'No data returned'}`);
            }

            // Parse JSON response
            let cleanedJson = response.data.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```/g, '');
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/```\n?/g, '');
            }

            console.log('[DOM Analyzer] Parsing JSON response...');

            const blueprint: SectionBlueprint[] = JSON.parse(cleanedJson);

            console.log('[DOM Analyzer] Successfully parsed blueprint with', blueprint.length, 'sections');

            return blueprint;
        } catch (error: any) {
            console.error('[DOM Analyzer] analyzeWithGemini error:', error.message);
            throw error;
        }
    }
}

/**
 * Singleton instance
 */
let domAnalyzerService: DOMAnalyzerService | null = null;

export function getDOMAnalyzerService(): DOMAnalyzerService {
    if (!domAnalyzerService) {
        domAnalyzerService = new DOMAnalyzerService();
    }
    return domAnalyzerService;
}
