/**
 * Shopify Clone Integration with Supabase
 * Helper functions for database operations
 */

import { createClient } from '@/lib/supabase/client';

export interface ShopifyTheme {
    id: string;
    user_id: string;
    session_id: string;
    source_url: string;
    theme_name: string | null;
    status: 'pending' | 'analyzing' | 'generating_assets' | 'mapping_theme' | 'syncing' | 'completed' | 'failed' | 'payment_required';
    design_dna: any;
    asset_manifest: any;
    theme_config: any;
    shopify_theme_id: string | null;
    shopify_store_domain: string | null;
    preview_url: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface ShopifyOAuthToken {
    id: string;
    user_id: string;
    shop_domain: string;
    access_token: string;
    scope: string;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

/**
 * Create a new Shopify theme cloning session
 */
export async function createShopifyTheme(
    userId: string,
    sessionId: string,
    sourceUrl: string,
    themeName?: string
): Promise<{ data: ShopifyTheme | null; error: any }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shopify_themes')
        .insert({
            user_id: userId,
            session_id: sessionId,
            source_url: sourceUrl,
            theme_name: themeName || `Clone of ${new URL(sourceUrl).hostname}`,
            status: 'pending'
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Update Shopify theme status
 */
export async function updateShopifyThemeStatus(
    sessionId: string,
    status: ShopifyTheme['status'],
    errorMessage?: string
): Promise<{ error: any }> {
    const supabase = createClient();

    const updateData: any = { status };
    if (errorMessage) {
        updateData.error_message = errorMessage;
    }
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('shopify_themes')
        .update(updateData)
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Update design DNA
 */
export async function updateDesignDNA(
    sessionId: string,
    designDNA: any
): Promise<{ error: any }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('shopify_themes')
        .update({
            design_dna: designDNA,
            status: 'analyzing'
        })
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Update asset manifest
 */
export async function updateAssetManifest(
    sessionId: string,
    assetManifest: any
): Promise<{ error: any }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('shopify_themes')
        .update({
            asset_manifest: assetManifest,
            status: 'generating_assets'
        })
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Update theme configuration
 */
export async function updateThemeConfig(
    sessionId: string,
    themeConfig: any
): Promise<{ error: any }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('shopify_themes')
        .update({
            theme_config: themeConfig,
            status: 'mapping_theme'
        })
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Update Shopify integration details
 */
export async function updateShopifyIntegration(
    sessionId: string,
    shopifyThemeId: string,
    shopStoreDomain: string,
    previewUrl: string
): Promise<{ error: any }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('shopify_themes')
        .update({
            shopify_theme_id: shopifyThemeId,
            shopify_store_domain: shopStoreDomain,
            preview_url: previewUrl,
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Get theme by session ID
 */
export async function getShopifyThemeBySession(
    sessionId: string
): Promise<{ data: ShopifyTheme | null; error: any }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shopify_themes')
        .select('*')
        .eq('session_id', sessionId)
        .single();

    return { data, error };
}

/**
 * Get all themes for a user
 */
export async function getUserShopifyThemes(
    userId: string
): Promise<{ data: ShopifyTheme[] | null; error: any }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shopify_themes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Delete a theme
 */
export async function deleteShopifyTheme(
    sessionId: string
): Promise<{ error: any }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('shopify_themes')
        .delete()
        .eq('session_id', sessionId);

    return { error };
}

/**
 * Save Shopify OAuth token
 */
export async function saveShopifyOAuthToken(
    userId: string,
    shopDomain: string,
    accessToken: string,
    scope: string
): Promise<{ data: ShopifyOAuthToken | null; error: any }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('shopify_oauth_tokens')
        .upsert({
            user_id: userId,
            shop_domain: shopDomain,
            access_token: accessToken,
            scope: scope,
            is_active: true
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get active Shopify OAuth token for a user
 */
export async function getActiveShopifyToken(
    userId: string,
    shopDomain?: string
): Promise<{ data: ShopifyOAuthToken | null; error: any }> {
    const supabase = createClient();

    let query = supabase
        .from('shopify_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    if (shopDomain) {
        query = query.eq('shop_domain', shopDomain);
    }

    const { data, error } = await query.single();

    return { data, error };
}
