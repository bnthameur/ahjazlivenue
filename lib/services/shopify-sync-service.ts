/**
 * Shopify Sync Service
 * Handles OAuth and theme deployment via Shopify Admin API
 */

import {
    ShopifyTheme,
    ShopifyAsset,
    ShopifyOAuthTokens,
    ThemeConfig,
} from '../types/shopify';

export interface ShopifyCredentials {
    shop: string; // e.g., 'mystore.myshopify.com'
    accessToken: string;
}

export class ShopifySyncService {
    private apiVersion = '2024-01';

    /**
     * Create a new unpublished theme
     */
    async createTheme(
        credentials: ShopifyCredentials,
        themeName: string
    ): Promise<ShopifyTheme> {
        const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/themes.json`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': credentials.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                theme: {
                    name: themeName,
                    role: 'unpublished',
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create theme: ${error}`);
        }

        const result = await response.json();
        return result.theme;
    }

    /**
     * Upload theme configuration (settings_data.json)
     */
    async uploadSettings(
        credentials: ShopifyCredentials,
        themeId: number,
        themeConfig: ThemeConfig
    ): Promise<void> {
        const settingsJson = JSON.stringify(themeConfig, null, 2);

        await this.uploadAsset(credentials, themeId, {
            key: 'config/settings_data.json',
            value: settingsJson,
        });
    }

    /**
     * Upload template configuration (templates/index.json)
     */
    async uploadTemplate(
        credentials: ShopifyCredentials,
        themeId: number,
        templateConfig: any
    ): Promise<void> {
        const templateJson = JSON.stringify(templateConfig, null, 2);

        await this.uploadAsset(credentials, themeId, {
            key: 'templates/index.json',
            value: templateJson,
        });
    }

    /**
     * Upload custom CSS
     */
    async uploadCustomCSS(
        credentials: ShopifyCredentials,
        themeId: number,
        cssContent: string
    ): Promise<void> {
        await this.uploadAsset(credentials, themeId, {
            key: 'assets/custom.css',
            value: cssContent,
        });
    }

    /**
     * Upload a single asset to Shopify theme
     */
    async uploadAsset(
        credentials: ShopifyCredentials,
        themeId: number,
        asset: ShopifyAsset
    ): Promise<void> {
        const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/themes/${themeId}/assets.json`;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': credentials.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ asset }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to upload asset ${asset.key}: ${error}`);
        }
    }

    /**
     * Batch upload multiple assets
     */
    async uploadAssetsBatch(
        credentials: ShopifyCredentials,
        themeId: number,
        assets: ShopifyAsset[]
    ): Promise<void> {
        const uploadPromises = assets.map((asset) =>
            this.uploadAsset(credentials, themeId, asset).catch((error) => {
                console.error(`Failed to upload ${asset.key}:`, error);
                throw error;
            })
        );

        await Promise.all(uploadPromises);
    }

    /**
     * Get theme by ID
     */
    async getTheme(
        credentials: ShopifyCredentials,
        themeId: number
    ): Promise<ShopifyTheme> {
        const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/themes/${themeId}.json`;

        const response = await fetch(endpoint, {
            headers: {
                'X-Shopify-Access-Token': credentials.accessToken,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch theme');
        }

        const result = await response.json();
        return result.theme;
    }

    /**
     * Get theme preview URL
     */
    getPreviewUrl(shop: string, themeId: number): string {
        // Remove .myshopify.com if present
        const shopName = shop.replace('.myshopify.com', '');
        return `https://${shopName}.myshopify.com/?preview_theme_id=${themeId}`;
    }

    /**
     * Publish theme (requires payment verification)
     */
    async publishTheme(
        credentials: ShopifyCredentials,
        themeId: number
    ): Promise<void> {
        const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/themes/${themeId}.json`;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': credentials.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                theme: {
                    role: 'main',
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to publish theme');
        }
    }

    /**
     * Delete theme
     */
    async deleteTheme(
        credentials: ShopifyCredentials,
        themeId: number
    ): Promise<void> {
        const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/themes/${themeId}.json`;

        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'X-Shopify-Access-Token': credentials.accessToken,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete theme');
        }
    }

    /**
     * Validate Shopify credentials
     */
    async validateCredentials(
        credentials: ShopifyCredentials
    ): Promise<boolean> {
        try {
            const endpoint = `https://${credentials.shop}/admin/api/${this.apiVersion}/shop.json`;

            const response = await fetch(endpoint, {
                headers: {
                    'X-Shopify-Access-Token': credentials.accessToken,
                },
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate OAuth authorization URL
     */
    generateOAuthUrl(
        shopDomain: string,
        clientId: string,
        redirectUri: string,
        scopes: string[] = ['write_themes', 'read_products']
    ): string {
        const params = new URLSearchParams({
            client_id: clientId,
            scope: scopes.join(','),
            redirect_uri: redirectUri,
            state: this.generateRandomState(),
        });

        return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(
        shop: string,
        code: string,
        clientId: string,
        clientSecret: string
    ): Promise<ShopifyOAuthTokens> {
        const endpoint = `https://${shop}/admin/oauth/access_token`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for token');
        }

        return response.json();
    }

    /**
     * Generate random state for OAuth
     */
    private generateRandomState(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}

/**
 * Singleton instance
 */
let shopifySyncService: ShopifySyncService | null = null;

export function getShopifySyncService(): ShopifySyncService {
    if (!shopifySyncService) {
        shopifySyncService = new ShopifySyncService();
    }
    return shopifySyncService;
}
