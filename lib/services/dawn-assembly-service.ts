/**
 * Dawn Assembly Service
 * Combines Dawn theme with customizations
 */

import { ThemeStructure, DesignTokens } from '../types/shopify';
import { DawnTheme } from './dawn-theme-service';

export interface DawnAssemblyInput {
    dawnBase: DawnTheme;
    customCSS: string;
    customSettings: any;
    designTokens: DesignTokens;
}

export class DawnAssemblyService {
    /**
     * Assemble customized Dawn theme
     */
    async assembleTheme(input: DawnAssemblyInput): Promise<ThemeStructure> {
        console.log('[Dawn Assembly] ===== ASSEMBLING THEME =====');

        const theme: ThemeStructure = {
            layout: { ...input.dawnBase.layout },
            sections: { ...input.dawnBase.sections },
            templates: { ...input.dawnBase.templates },
            snippets: { ...input.dawnBase.snippets },
            assets: { ...input.dawnBase.assets },
            config: { ...input.dawnBase.config },
            locales: { ...input.dawnBase.locales },
        };

        // Add custom CSS as new asset
        theme.assets['theme-customization.css'] = input.customCSS;

        // Inject custom CSS into theme.liquid
        if (theme.layout['theme.liquid']) {
            const themeLayout = theme.layout['theme.liquid'];

            // Find where to inject CSS (after other stylesheets)
            const cssLinkRegex = /{{ 'base\.css' \| asset_url \| stylesheet_tag }}/;
            if (cssLinkRegex.test(themeLayout)) {
                theme.layout['theme.liquid'] = themeLayout.replace(
                    cssLinkRegex,
                    `{{ 'base.css' | asset_url | stylesheet_tag }}\n    {{ 'theme-customization.css' | asset_url | stylesheet_tag }}`
                );
                console.log('[Dawn Assembly] Injected custom CSS into theme.liquid');
            }
        }

        // Update settings_data.json with customizations
        theme.config['settings_data.json'] = input.customSettings;

        console.log('[Dawn Assembly] ===== THEME ASSEMBLED =====');
        console.log('[Dawn Assembly] Summary:', {
            layout: Object.keys(theme.layout).length,
            sections: Object.keys(theme.sections).length,
            templates: Object.keys(theme.templates).length,
            snippets: Object.keys(theme.snippets).length,
            assets: Object.keys(theme.assets).length,
            hasCustomCSS: !!theme.assets['theme-customization.css'],
            customCSSSize: theme.assets['theme-customization.css']?.length || 0,
        });

        return theme;
    }
}

/**
 * Singleton instance
 */
let dawnAssemblyService: DawnAssemblyService | null = null;

export function getDawnAssemblyService(): DawnAssemblyService {
    if (!dawnAssemblyService) {
        dawnAssemblyService = new DawnAssemblyService();
    }
    return dawnAssemblyService;
}
