/**
 * Simplified Screenshot Service
 * Uses free screenshot API service
 */

export interface AnalysisResult {
    screenshot: string; // Base64
    cssData: CSSData;
    metadata: PageMetadata;
}

export interface CSSData {
    colors: string[];
    fonts: string[];
    layoutElements: string[];
}

export interface PageMetadata {
    url: string;
    title: string;
    description?: string;
}

export class SimplifiedAnalysisService {
    /**
     * Analyze URL - get screenshot for vision analysis
     */
    async analyzeUrl(url: string): Promise<AnalysisResult> {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;

            // Try to get screenshot using thum.io (free service)
            let screenshot = '';
            try {
                const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${encodeURIComponent(url)}`;
                const response = await fetch(screenshotUrl);

                if (response.ok) {
                    const buffer = await response.arrayBuffer();
                    screenshot = Buffer.from(buffer).toString('base64');
                }
            } catch (error) {
                console.warn('Screenshot failed, will use text-only analysis:', error);
            }

            // Mock CSS data
            const cssData: CSSData = {
                colors: ['#1a1a1a', '#ffffff', '#3b82f6', '#f3f4f6'],
                fonts: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
                layoutElements: ['header', 'hero', 'features', 'footer'],
            };

            const metadata: PageMetadata = {
                url,
                title: domain.replace('www.', ''),
                description: `Website: ${domain}`,
            };

            return {
                screenshot,
                cssData,
                metadata,
            };
        } catch (error: any) {
            throw new Error(`URL analysis failed: ${error.message}`);
        }
    }
}

let analysisService: SimplifiedAnalysisService | null = null;

export function getPuppeteerService(): SimplifiedAnalysisService {
    if (!analysisService) {
        analysisService = new SimplifiedAnalysisService();
    }
    return analysisService;
}
