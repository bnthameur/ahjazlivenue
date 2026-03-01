/**
 * URL Validator Service - Stage 1: URL Validation & Platform Detection
 * Verifies URL reachability and identifies Shopify platform characteristics
 */

export interface ValidationResult {
    isShopify: boolean;
    isOnlineStore2: boolean;
    themeArchitecture: 'dawn-like' | 'custom' | 'unknown';
    appHeavy: boolean;
    detectedFeatures: {
        sectionSchemas: boolean;
        jsonTemplates: boolean;
        cssUtilityPatterns: boolean;
        accessibilityAttributes: boolean;
    };
    shopifyVersion?: string;
    error?: string;
    warnings: string[];
}

export class URLValidatorService {
    /**
     * Stage 1: Validate URL and detect Shopify platform characteristics
     */
    async validateAndDetect(url: string): Promise<ValidationResult> {
        try {
            // Validate URL format
            const parsedUrl = new URL(url);

            // Fetch the page
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!response.ok) {
                throw new Error(`URL returned status ${response.status}`);
            }

            const html = await response.text();

            // Detect Shopify platform
            const isShopify = this.detectShopify(html);

            if (!isShopify) {
                return {
                    isShopify: false,
                    isOnlineStore2: false,
                    themeArchitecture: 'unknown',
                    appHeavy: false,
                    detectedFeatures: {
                        sectionSchemas: false,
                        jsonTemplates: false,
                        cssUtilityPatterns: false,
                        accessibilityAttributes: false,
                    },
                    error: 'Not a Shopify store',
                    warnings: [],
                };
            }

            // Detect features and architecture
            const detectedFeatures = this.detectFeatures(html);
            const isOnlineStore2 = this.detectOnlineStore2(html, detectedFeatures);
            const themeArchitecture = this.detectThemeArchitecture(html, detectedFeatures);
            const appHeavy = this.detectAppHeavy(html);
            const shopifyVersion = this.extractShopifyVersion(html);
            const warnings = this.generateWarnings(detectedFeatures, appHeavy);

            return {
                isShopify: true,
                isOnlineStore2,
                themeArchitecture,
                appHeavy,
                detectedFeatures,
                shopifyVersion,
                warnings,
            };
        } catch (error: any) {
            return {
                isShopify: false,
                isOnlineStore2: false,
                themeArchitecture: 'unknown',
                appHeavy: false,
                detectedFeatures: {
                    sectionSchemas: false,
                    jsonTemplates: false,
                    cssUtilityPatterns: false,
                    accessibilityAttributes: false,
                },
                error: error.message,
                warnings: [],
            };
        }
    }

    /**
     * Detect if site is Shopify-based using multiple signals
     */
    private detectShopify(html: string): boolean {
        const signals = [
            // Shopify CDN
            html.includes('cdn.shopify.com'),
            html.includes('/cdn/shop/'),

            // Shopify global objects
            html.includes('Shopify.shop'),
            html.includes('Shopify.theme'),

            // Meta generators
            html.includes('Shopify'),

            // Asset paths
            /\/assets\/.*\.js/.test(html) && /shopify/i.test(html),

            // Liquid comments
            html.includes('{% comment %}') || html.includes('<!-- BEGIN theme-check'),
        ];

        // Require at least 2 signals to confirm
        return signals.filter(Boolean).length >= 2;
    }

    /**
     * Detect Online Store 2.0 vs legacy architecture
     */
    private detectOnlineStore2(html: string, features: any): boolean {
        // Online Store 2.0 uses JSON templates and section schemas
        return features.sectionSchemas && features.jsonTemplates;
    }

    /**
     * Detect theme architecture using heuristics (not definitive detection)
     * NOTE: Cannot reliably detect "Dawn-based" due to forks/renaming
     * Using Dawn-like conventions as heuristics instead
     */
    private detectThemeArchitecture(
        html: string,
        features: any
    ): 'dawn-like' | 'custom' | 'unknown' {
        const dawnLikeSignals = [
            // Dawn uses specific utility classes
            html.includes('color-scheme'),
            html.includes('gradient'),
            html.includes('page-width'),

            // Dawn section patterns
            html.includes('section-template'),
            html.includes('shopify-section'),

            // Dawn accessibility patterns
            features.accessibilityAttributes && html.includes('aria-'),

            // Dawn uses media wrappers
            html.includes('media-wrapper'),

            // Dawn color scheme patterns
            /class="[^"]*color-/.test(html),
        ];

        const dawnLikeScore = dawnLikeSignals.filter(Boolean).length;

        if (dawnLikeScore >= 5) {
            return 'dawn-like';
        } else if (dawnLikeScore >= 2) {
            return 'custom'; // Has some conventions but not Dawn-like
        }

        return 'unknown';
    }

    /**
     * Detect features that indicate architecture style
     */
    private detectFeatures(html: string): {
        sectionSchemas: boolean;
        jsonTemplates: boolean;
        cssUtilityPatterns: boolean;
        accessibilityAttributes: boolean;
    } {
        return {
            // Section schemas (OS 2.0 pattern)
            sectionSchemas: html.includes('shopify-section') && html.includes('data-section-'),

            // JSON templates
            jsonTemplates: html.includes('type="application/json"'),

            // CSS utility patterns (Dawn-like)
            cssUtilityPatterns: /class="[^"]*(?:color-|gradient|page-width|section-)/.test(html),

            // Accessibility attributes
            accessibilityAttributes: /aria-|role=/.test(html),
        };
    }

    /**
     * Detect if store is app-heavy (many third-party apps)
     */
    private detectAppHeavy(html: string): boolean {
        const appSignals = [
            // Common app scripts
            html.includes('judge.me'),
            html.includes('klaviyo'),
            html.includes('loox'),
            html.includes('yotpo'),
            html.includes('gorgias'),
            html.includes('tidio'),

            // Generic app patterns
            (html.match(/\bapp\.[-\w]+\.com/g) || []).length > 3,
        ];

        return appSignals.filter(Boolean).length >= 2;
    }

    /**
     * Extract Shopify version if available
     */
    private extractShopifyVersion(html: string): string | undefined {
        const versionMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*"version":\s*"([^"]+)"/);
        return versionMatch ? versionMatch[1] : undefined;
    }

    /**
     * Generate warnings based on detected features
     */
    private generateWarnings(features: any, appHeavy: boolean): string[] {
        const warnings: string[] = [];

        if (!features.sectionSchemas) {
            warnings.push('Legacy theme detected - may not support all OS 2.0 features');
        }

        if (appHeavy) {
            warnings.push('App-heavy store - some functionality may be app-dependent');
        }

        if (!features.accessibilityAttributes) {
            warnings.push('Limited accessibility attributes detected');
        }

        return warnings;
    }
}

/**
 * Singleton instance
 */
let urlValidatorService: URLValidatorService | null = null;

export function getURLValidatorService(): URLValidatorService {
    if (!urlValidatorService) {
        urlValidatorService = new URLValidatorService();
    }
    return urlValidatorService;
}
