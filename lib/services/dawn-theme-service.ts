/**
 * Dawn Theme Service
 * Manages the base Dawn theme - loading, cloning, and preparation
 */

import fs from 'fs/promises';
import path from 'path';
import { ThemeStructure } from '../types/shopify';

export interface DawnTheme {
    layout: Record<string, string>;
    sections: Record<string, string>;
    templates: Record<string, string>;
    snippets: Record<string, string>;
    assets: Record<string, string>;
    config: Record<string, any>;
    locales: Record<string, any>;
}

export class DawnThemeService {
    private dawnPath: string;

    constructor() {
        // Path to extracted Dawn theme
        this.dawnPath = path.join(process.cwd(), 'lib', 'dawn-theme', 'dawn-main');
    }

    /**
     * Load the complete Dawn theme from disk
     */
    async loadDawnTheme(): Promise<DawnTheme> {
        console.log('[Dawn] Loading Dawn theme from:', this.dawnPath);

        const theme: DawnTheme = {
            layout: {},
            sections: {},
            templates: {},
            snippets: {},
            assets: {},
            config: {},
            locales: {},
        };

        try {
            // Load layout files
            const layoutPath = path.join(this.dawnPath, 'layout');
            const layoutFiles = await fs.readdir(layoutPath);
            for (const file of layoutFiles) {
                if (file.endsWith('.liquid')) {
                    const content = await fs.readFile(path.join(layoutPath, file), 'utf-8');
                    theme.layout[file] = content;
                }
            }

            // Load section files
            const sectionsPath = path.join(this.dawnPath, 'sections');
            const sectionFiles = await fs.readdir(sectionsPath);
            for (const file of sectionFiles) {
                if (file.endsWith('.liquid')) {
                    const content = await fs.readFile(path.join(sectionsPath, file), 'utf-8');
                    theme.sections[file] = content;
                }
            }

            // Load template files
            const templatesPath = path.join(this.dawnPath, 'templates');
            const templateFiles = await fs.readdir(templatesPath);
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(templatesPath, file), 'utf-8');
                    theme.templates[file] = content;
                }
            }

            // Load snippet files
            const snippetsPath = path.join(this.dawnPath, 'snippets');
            const snippetFiles = await fs.readdir(snippetsPath);
            for (const file of snippetFiles) {
                if (file.endsWith('.liquid')) {
                    const content = await fs.readFile(path.join(snippetsPath, file), 'utf-8');
                    theme.snippets[file] = content;
                }
            }

            // Load asset files
            const assetsPath = path.join(this.dawnPath, 'assets');
            const assetFiles = await fs.readdir(assetsPath);
            for (const file of assetFiles) {
                const content = await fs.readFile(path.join(assetsPath, file), 'utf-8');
                theme.assets[file] = content;
            }

            // Load config files
            const configPath = path.join(this.dawnPath, 'config');
            const configFiles = await fs.readdir(configPath);
            for (const file of configFiles) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(configPath, file), 'utf-8');
                    theme.config[file] = JSON.parse(content);
                }
            }

            // Load locale files
            const localesPath = path.join(this.dawnPath, 'locales');
            const localeFiles = await fs.readdir(localesPath);
            for (const file of localeFiles) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(localesPath, file), 'utf-8');
                    theme.locales[file] = JSON.parse(content);
                }
            }

            console.log('[Dawn] Theme loaded successfully:', {
                layout: Object.keys(theme.layout).length,
                sections: Object.keys(theme.sections).length,
                templates: Object.keys(theme.templates).length,
                snippets: Object.keys(theme.snippets).length,
                assets: Object.keys(theme.assets).length,
                config: Object.keys(theme.config).length,
                locales: Object.keys(theme.locales).length,
            });

            return theme;
        } catch (error) {
            console.error('[Dawn] Error loading theme:', error);
            throw new Error(`Failed to load Dawn theme: ${error}`);
        }
    }

    /**
     * Clone Dawn theme for customization
     */
    async cloneDawnTheme(): Promise<DawnTheme> {
        const theme = await this.loadDawnTheme();

        // Deep clone to avoid mutations
        return JSON.parse(JSON.stringify(theme));
    }

    /**
     * Convert Dawn theme to ThemeStructure format
     */
    async getDawnAsThemeStructure(): Promise<ThemeStructure> {
        const dawn = await this.loadDawnTheme();

        return {
            layout: dawn.layout,
            sections: dawn.sections,
            templates: dawn.templates,
            snippets: dawn.snippets,
            assets: dawn.assets,
            config: dawn.config,
            locales: dawn.locales,
        };
    }
}

/**
 * Singleton instance
 */
let dawnThemeService: DawnThemeService | null = null;

export function getDawnThemeService(): DawnThemeService {
    if (!dawnThemeService) {
        dawnThemeService = new DawnThemeService();
    }
    return dawnThemeService;
}
