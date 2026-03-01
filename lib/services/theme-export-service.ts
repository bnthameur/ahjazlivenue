/**
 * Theme Export Service - Stage 9: Export & Connect Options
 * Generates downloadable Shopify theme ZIP files
 */

import archiver from 'archiver';
import { ThemeStructure } from '../types/shopify';
import { Readable } from 'stream';

export class ThemeExportService {
    /**
     * Create a ZIP file from theme structure
     */
    async createThemeZIP(themeStructure: ThemeStructure): Promise<Buffer> {
        console.log('[Export] ===== STARTING ZIP CREATION =====');
        console.log('[Export] Input structure:', {
            layout: Object.keys(themeStructure.layout || {}).length,
            sections: Object.keys(themeStructure.sections || {}).length,
            templates: Object.keys(themeStructure.templates || {}).length,
            snippets: Object.keys(themeStructure.snippets || {}).length,
            assets: Object.keys(themeStructure.assets || {}).length,
            config: Object.keys(themeStructure.config || {}).length,
            locales: Object.keys(themeStructure.locales || {}).length,
        });

        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 }, // Maximum compression
            });

            const chunks: Buffer[] = [];

            archive.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            archive.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });

            archive.on('error', (err) => {
                console.error('[Export] Archive error:', err); // Added console.error as per instruction's implied intent
                reject(err);
            });

            let fileCount = 0;

            // Add layout files
            for (const [filename, content] of Object.entries(themeStructure.layout)) {
                archive.append(content, { name: `layout/${filename}` });
                fileCount++;
            }

            // Add section files
            for (const [filename, content] of Object.entries(themeStructure.sections)) {
                archive.append(content, { name: `sections/${filename}` });
                fileCount++;
            }

            // Add template files
            for (const [filename, content] of Object.entries(themeStructure.templates)) {
                archive.append(content, { name: `templates/${filename}` });
                fileCount++;
            }

            // Add snippet files
            for (const [filename, content] of Object.entries(themeStructure.snippets || {})) {
                archive.append(content, { name: `snippets/${filename}` });
                fileCount++;
            }

            // Add asset files
            for (const [filename, content] of Object.entries(themeStructure.assets)) {
                archive.append(content, { name: `assets/${filename}` });
                fileCount++;
            }

            // Add config files
            for (const [filename, content] of Object.entries(themeStructure.config)) {
                const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                archive.append(jsonContent, { name: `config/${filename}` });
                fileCount++;
            }

            // Add locale files
            for (const [filename, content] of Object.entries(themeStructure.locales)) {
                const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                archive.append(jsonContent, { name: `locales/${filename}` });
                fileCount++;
            }

            console.log('[Export] Total files added to ZIP:', fileCount);
            console.log('[Export] Finalizing archive...');

            // Finalize the archive
            archive.finalize();
        });
    }

    /**
     * Generate installation instructions
     */
    generateInstructions(): string {
        return `# Shopify Theme Installation Instructions

## Method 1: Upload via Shopify Admin (Recommended)

1. Log in to your Shopify admin panel
2. Navigate to **Online Store** > **Themes**
3. Click **Add theme** > **Upload zip file**
4. Select the downloaded theme ZIP file
5. Wait for upload to complete
6. Click **Customize** to edit theme settings
7. Click **Publish** when ready to make it live

## Method 2: Shopify CLI (For Developers)

\`\`\`bash
# Install Shopify CLI if not already installed
npm install -g @shopify/cli @shopify/theme

# Extract the theme ZIP
unzip shopify-theme.zip -d my-theme

# Navigate to theme directory
cd my-theme

# Login to Shopify
shopify login --store your-store.myshopify.com

# Create theme in your store
shopify theme push

# Preview the theme
shopify theme dev
\`\`\`

## Important Notes

- This theme was generated to match the visual style of the source page
- All content is placeholder text - you'll need to add your own products, images, and copy
- Images are placeholders and should be replaced with your brand assets
- Review theme settings in the customizer to configure colors, fonts, and other options
- Test thoroughly before publishing to ensure all features work as expected

## Theme Structure

- **layout/**: Main layout templates
- **sections/**: Reusable sections
- **templates/**: Page templates  
- **assets/**: CSS, JavaScript, and images
- **config/**: Theme settings
- **locales/**: Translation files

## Support

This theme was auto-generated and may require customization for your specific needs. 
For advanced modifications, consider hiring a Shopify developer.
`;
    }
}

/**
 * Singleton instance
 */
let themeExportService: ThemeExportService | null = null;

export function getThemeExportService(): ThemeExportService {
    if (!themeExportService) {
        themeExportService = new ThemeExportService();
    }
    return themeExportService;
}
