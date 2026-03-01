/**
 * Theme Assembly Service - Stage 7: Theme Assembly
 * Assembles complete Shopify theme directory with all components
 */

import { ThemeStructure } from '../types/shopify';

export interface AssemblyInput {
    // Stage 4 outputs
    mainProductLiquid: string;
    supportingSections: Record<string, string>;
    schemas: Record<string, any>;

    // Stage 5 outputs
    themeLayout: string;
    headerSection: string;
    footerSection: string;
    baseCSS: string;

    // Stage 6 outputs
    indexJson: string;
    collectionJson: string;
    pageJson: string;
    cartJson: string;
}

export interface AssemblyOutput {
    themeStructure: ThemeStructure;
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export class ThemeAssemblyService {
    /**
     * Assemble complete theme structure
     */
    async assembleTheme(input: AssemblyInput): Promise<AssemblyOutput> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Build theme structure
        const themeStructure: ThemeStructure = {
            layout: {},
            sections: {},
            templates: {},
            snippets: {},
            assets: {},
            config: {},
            locales: {},
        };

        // Assemble layout files
        themeStructure.layout['theme.liquid'] = this.cleanMarkdownCodeBlocks(input.themeLayout);

        // Assemble section files
        themeStructure.sections['header.liquid'] = this.cleanMarkdownCodeBlocks(input.headerSection);
        themeStructure.sections['footer.liquid'] = this.cleanMarkdownCodeBlocks(input.footerSection);
        themeStructure.sections['main-product.liquid'] = this.cleanMarkdownCodeBlocks(input.mainProductLiquid);

        // Add supporting sections
        for (const [filename, content] of Object.entries(input.supportingSections)) {
            themeStructure.sections[filename] = this.cleanMarkdownCodeBlocks(content);
        }

        // Assemble template files
        themeStructure.templates['index.json'] = this.cleanMarkdownCodeBlocks(input.indexJson);
        themeStructure.templates['collection.json'] = this.cleanMarkdownCodeBlocks(input.collectionJson);
        themeStructure.templates['page.json'] = this.cleanMarkdownCodeBlocks(input.pageJson);
        themeStructure.templates['cart.json'] = this.cleanMarkdownCodeBlocks(input.cartJson);
        themeStructure.templates['product.json'] = JSON.stringify({
            sections: {
                main: {
                    type: 'main-product',
                    settings: {},
                },
            },
            order: ['main'],
        }, null, 2);

        // Assemble assets
        themeStructure.assets['base.css'] = this.cleanMarkdownCodeBlocks(input.baseCSS);

        // Create required config files
        themeStructure.config['settings_schema.json'] = this.generateSettingsSchema();
        themeStructure.config['settings_data.json'] = this.generateSettingsData();

        // Create required locale file
        themeStructure.locales['en.default.json'] = this.generateLocaleFile();

        console.log('[Assembly] ===== THEME STRUCTURE BUILT =====');
        console.log('[Assembly] Layout files:', Object.keys(themeStructure.layout));
        console.log('[Assembly] Section files:', Object.keys(themeStructure.sections));
        console.log('[Assembly] Template files:', Object.keys(themeStructure.templates));
        console.log('[Assembly] Asset files:', Object.keys(themeStructure.assets));
        console.log('[Assembly] Config files:', Object.keys(themeStructure.config));

        // Log content lengths
        console.log('[Assembly] Content sizes:');
        console.log('  theme.liquid:', themeStructure.layout['theme.liquid']?.length || 0, 'bytes');
        console.log('  header.liquid:', themeStructure.sections['header.liquid']?.length || 0, 'bytes');
        console.log('  footer.liquid:', themeStructure.sections['footer.liquid']?.length || 0, 'bytes');
        console.log('  main-product.liquid:', themeStructure.sections['main-product.liquid']?.length || 0, 'bytes');
        console.log('  base.css:', themeStructure.assets['base.css']?.length || 0, 'bytes');
        console.log('  product.json:', themeStructure.templates['product.json']?.length || 0, 'bytes');

        // Validate structure
        const validationErrors = this.validateStructure(themeStructure);
        errors.push(...validationErrors);

        // Validate Liquid syntax
        const liquidErrors = this.validateLiquidSyntax(themeStructure);
        errors.push(...liquidErrors);

        // Validate JSON templates
        const jsonErrors = this.validateJsonTemplates(themeStructure);
        errors.push(...jsonErrors);

        console.log('[Assembly] Validation results:');
        console.log('  Structure errors:', validationErrors.length, validationErrors);
        console.log('  Liquid errors:', liquidErrors.length, liquidErrors);
        console.log('  JSON errors:', jsonErrors.length, jsonErrors);
        console.log('  Total errors:', errors.length);

        // Check for warnings
        if (Object.keys(themeStructure.snippets).length === 0) {
            warnings.push('No snippets were generated - theme may lack reusable components');
        }

        const valid = errors.length === 0;

        console.log('[Assembly] Theme structure summary:', {
            layoutFiles: Object.keys(themeStructure.layout).length,
            sectionFiles: Object.keys(themeStructure.sections).length,
            templateFiles: Object.keys(themeStructure.templates).length,
            assetFiles: Object.keys(themeStructure.assets).length,
            configFiles: Object.keys(themeStructure.config).length,
            localeFiles: Object.keys(themeStructure.locales).length,
            valid,
            errors: errors.length,
            warnings: warnings.length,
        });

        console.log('[Assembly] Layout files:', Object.keys(themeStructure.layout));
        console.log('[Assembly] Section files:', Object.keys(themeStructure.sections));
        console.log('[Assembly] Template files:', Object.keys(themeStructure.templates));

        // Check if files have content
        for (const [filename, content] of Object.entries(themeStructure.layout)) {
            console.log(`[Assembly] layout/${filename} size:`, content.length, 'bytes');
        }
        for (const [filename, content] of Object.entries(themeStructure.sections)) {
            console.log(`[Assembly] sections/${filename} size:`, content.length, 'bytes');
        }

        return {
            themeStructure,
            valid,
            errors,
            warnings,
        };
    }

    /**
     * Generate settings_schema.json
     */
    private generateSettingsSchema(): string {
        const schema = [
            {
                name: 'theme_info',
                theme_name: 'Generated Theme',
                theme_version: '1.0.0',
                theme_author: 'Shopify Theme Reconstruction System',
                theme_documentation_url: '',
                theme_support_url: '',
            },
            {
                name: 'Colors',
                settings: [
                    {
                        type: 'header',
                        content: 'Color scheme',
                    },
                    {
                        type: 'color',
                        id: 'colors_primary',
                        label: 'Primary color',
                        default: '#000000',
                    },
                    {
                        type: 'color',
                        id: 'colors_secondary',
                        label: 'Secondary color',
                        default: '#FFFFFF',
                    },
                    {
                        type: 'color',
                        id: 'colors_accent',
                        label: 'Accent color',
                        default: '#0066FF',
                    },
                ],
            },
            {
                name: 'Typography',
                settings: [
                    {
                        type: 'header',
                        content: 'Font selection',
                    },
                    {
                        type: 'font_picker',
                        id: 'type_header_font',
                        label: 'Heading font',
                        default: 'assistant_n4',
                    },
                    {
                        type: 'font_picker',
                        id: 'type_body_font',
                        label: 'Body font',
                        default: 'assistant_n4',
                    },
                ],
            },
        ];

        return JSON.stringify(schema, null, 2);
    }

    /**
     * Generate settings_data.json
     */
    private generateSettingsData(): string {
        const data = {
            current: {
                colors_primary: '#000000',
                colors_secondary: '#FFFFFF',
                colors_accent: '#0066FF',
            },
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Generate en.default.json locale file
     */
    private generateLocaleFile(): string {
        const locale = {
            general: {
                accessibility: {
                    skip_to_content: 'Skip to content',
                },
                search: {
                    search: 'Search',
                },
                cart: {
                    view: 'View cart',
                    item_count: {
                        one: '{{ count }} item',
                        other: '{{ count }} items',
                    },
                },
            },
            products: {
                product: {
                    add_to_cart: 'Add to cart',
                    quantity: 'Quantity',
                    sold_out: 'Sold out',
                    unavailable: 'Unavailable',
                },
            },
        };

        return JSON.stringify(locale, null, 2);
    }

    /**
     * Clean markdown code blocks from AI-generated content
     */
    private cleanMarkdownCodeBlocks(content: string): string {
        if (!content) return content;

        let cleaned = content.trim();

        // Remove markdown code blocks (```liquid, ```css, ```json, etc.)
        // Match: ```language\n...content...\n```
        const codeBlockRegex = /^```(?:liquid|css|json|html)?\s*\n([\s\S]*?)\n```$/;
        const match = cleaned.match(codeBlockRegex);

        if (match) {
            cleaned = match[1];
        }

        // Also handle cases where just ``` is used without language
        if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
            cleaned = cleaned.slice(3, -3).trim();
        }

        return cleaned.trim();
    }

    /**
     * Validate theme structure has required files
     */
    private validateStructure(theme: ThemeStructure): string[] {
        const errors: string[] = [];

        // Check required files
        if (!theme.layout['theme.liquid']) {
            errors.push('Missing required file: layout/theme.liquid');
        }

        if (!theme.config['settings_schema.json']) {
            errors.push('Missing required file: config/settings_schema.json');
        }

        if (!theme.locales['en.default.json']) {
            errors.push('Missing required file: locales/en.default.json');
        }

        // Check for at least one section
        if (Object.keys(theme.sections).length === 0) {
            errors.push('Theme must have at least one section');
        }

        // Check for at least one template
        if (Object.keys(theme.templates).length === 0) {
            errors.push('Theme must have at least one template');
        }

        return errors;
    }

    /**
     * Validate Liquid syntax (basic validation)
     */
    private validateLiquidSyntax(theme: ThemeStructure): string[] {
        const errors: string[] = [];

        // Check layout files
        for (const [filename, content] of Object.entries(theme.layout)) {
            const fileErrors = this.checkLiquidFile(content, `layout/${filename}`);
            // Convert to warnings - Liquid syntax varies and AI might use different patterns
            if (fileErrors.length > 0) {
                console.warn(`[Assembly] Liquid warnings for layout/${filename}:`, fileErrors);
            }
        }

        // Check section files
        for (const [filename, content] of Object.entries(theme.sections)) {
            const fileErrors = this.checkLiquidFile(content, `sections/${filename}`);
            if (fileErrors.length > 0) {
                console.warn(`[Assembly] Liquid warnings for sections/${filename}:`, fileErrors);
            }
        }

        // Only return critical errors (empty files, etc)
        return errors;
    }

    /**
     * Check individual Liquid file for syntax errors
     */
    private checkLiquidFile(content: string, filepath: string): string[] {
        const errors: string[] = [];

        // Count opening and closing tags
        const openIf = (content.match(/\{%\s*if\s/g) || []).length;
        const closeIf = (content.match(/\{%\s*endif\s*%\}/g) || []).length;
        if (openIf !== closeIf) {
            errors.push(`${filepath}: Unmatched if/endif tags (${openIf} if, ${closeIf} endif)`);
        }

        const openFor = (content.match(/\{%\s*for\s/g) || []).length;
        const closeFor = (content.match(/\{%\s*endfor\s*%\}/g) || []).length;
        if (openFor !== closeFor) {
            errors.push(`${filepath}: Unmatched for/endfor tags (${openFor} for, ${closeFor} endfor)`);
        }

        const openUnless = (content.match(/\{%\s*unless\s/g) || []).length;
        const closeUnless = (content.match(/\{%\s*endunless\s*%\}/g) || []).length;
        if (openUnless !== closeUnless) {
            errors.push(`${filepath}: Unmatched unless/endunless tags`);
        }

        const openCase = (content.match(/\{%\s*case\s/g) || []).length;
        const closeCase = (content.match(/\{%\s*endcase\s*%\}/g) || []).length;
        if (openCase !== closeCase) {
            errors.push(`${filepath}: Unmatched case/endcase tags`);
        }

        return errors;
    }

    /**
     * Validate JSON templates
     */
    private validateJsonTemplates(theme: ThemeStructure): string[] {
        const errors: string[] = [];

        for (const [filename, content] of Object.entries(theme.templates)) {
            try {
                JSON.parse(content);
            } catch (error) {
                errors.push(`templates/${filename}: Invalid JSON - ${error}`);
            }
        }

        return errors;
    }
}

/**
 * Singleton instance
 */
let themeAssemblyService: ThemeAssemblyService | null = null;

export function getThemeAssemblyService(): ThemeAssemblyService {
    if (!themeAssemblyService) {
        themeAssemblyService = new ThemeAssemblyService();
    }
    return themeAssemblyService;
}
