/**
 * Shopify Theme Reconstruction System - Type Definitions
 * For 10-stage multi-agent theme generation pipeline
 */

// ============================================
// STAGE 1: URL VALIDATION & PLATFORM DETECTION
// ============================================

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

// ============================================
// STAGE 2: DOM & SECTION STRUCTURE ANALYSIS
// ============================================

export interface SectionBlueprint {
    type: string;
    purpose: string;
    visualHierarchy: Array<{ element: string; importance: number }>;
    repeatingPatterns: string[];
    inputs: Array<{ type: string; purpose: string; defaultValue?: string }>;
    conditionalLogic: string[];
    boundingBox?: { x: number; y: number; width: number; height: number };
}

// ============================================
// STAGE 3: VISUAL STYLE & DESIGN TOKEN EXTRACTION
// ============================================

export interface DesignTokens {
    colors: {
        semantic: Record<string, string>; // e.g., { primary: '#...', secondary: '#...' }
        palette: string[]; // All unique colors found
    };
    typography: {
        families: string[]; // Font families in order of importance
        scale: Record<string, string>; // e.g., { h1: '48px', h2: '36px', ... }
        weights: number[]; // Font weights used
    };
    spacing: Record<string, string>; // e.g., { xs: '4px', sm: '8px', ... }
    borderRadius: Record<string, string>; // e.g., { none: '0', sm: '4px', ... }
    shadows: Record<string, string>; // e.g., { sm: '0 1px 2px...', ... }
    buttons: Array<{
        name: string;
        styles: Record<string, any>;
    }>;
}

// ============================================
// STAGE 4-7: THEME GENERATION
// ============================================

export interface ThemeStructure {
    layout: Record<string, string>; // filename -> content
    sections: Record<string, string>; // filename -> Liquid content
    templates: Record<string, string>; // filename -> JSON template
    snippets: Record<string, string>; // filename -> Liquid snippets
    assets: Record<string, Buffer | string>; // filename -> CSS/JS/images
    config: Record<string, any>; // settings_schema.json, settings_data.json
    locales: Record<string, any>; // en.default.json, etc.
}

// ============================================
// STAGE 10: VALIDATION & COMPLIANCE
// ============================================

export interface VisualParityMetrics {
    layoutSimilarity: number; // 0-1 score based on bounding box comparison
    colorDeltaTolerance: number; // Average color difference (ΔE76)
    typographyMatch: number; // 0-1 score for font family/size matches
    spacingRatioSimilarity: number; // 0-1 score for spacing patterns
}

export interface ComplianceReport {
    passed: boolean;
    checks: {
        noCopyrightedAssets: boolean;
        placeholderContent: boolean;
        originalStructure: boolean;
        visualParityMetrics: VisualParityMetrics;
        shopifyCompatible: boolean;
        validLiquid: boolean;
    };
    errors: string[];
    warnings: string[];
    visualParityPassed: boolean; // Overall pass/fail based on thresholds
}

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

// Design DNA extracted from target URL
export interface DesignDNA {
    sessionId: string;
    sourceUrl: string;
    extractedAt: string;
    colors: ColorPalette;
    typography: Typography;
    sections: SectionStructure[];
    vibe: DesignVibe;
    metadata: DesignMetadata;
}

export interface ColorPalette {
    primary: string; // Hex color
    secondary: string;
    accent: string;
    background: string;
    text: string;
    additional: string[]; // Up to 5 additional colors
}

export interface Typography {
    headingFont: GoogleFont;
    bodyFont: GoogleFont;
    vibe: 'serif' | 'sans-serif' | 'monospace';
}

export interface GoogleFont {
    family: string; // e.g., 'Inter', 'Roboto'
    weights: number[]; // e.g., [400, 600, 700]
    fallback: string; // CSS fallback
}

export interface SectionStructure {
    type: SectionType;
    order: number;
    properties: Record<string, any>;
}

export type SectionType =
    | 'hero_banner'
    | 'three_column_grid'
    | 'product_grid'
    | 'testimonials'
    | 'newsletter'
    | 'featured_collection'
    | 'image_with_text'
    | 'rich_text'
    | 'video'
    | 'custom';

export interface DesignVibe {
    primary: 'minimalist' | 'luxury' | 'corporate' | 'playful' | 'bold' | 'elegant';
    keywords: string[]; // e.g., ['modern', 'clean', 'professional']
}

export interface DesignMetadata {
    niche?: string; // e.g., 'Skincare', 'Electronics'
    industry?: string;
    targetAudience?: string;
}

// Master Theme Schema
export interface MasterThemeSchema {
    name: string;
    version: string;
    settings: ThemeSetting[];
}

export interface ThemeSetting {
    type: string;
    id: string;
    label: string;
    default?: any;
    options?: { label: string; value: string }[];
}

// Shopify Theme Configuration
export interface ThemeConfig {
    current: {
        colors: Record<string, string>;
        typography_headings: string;
        typography_body: string;
        sections: Record<string, SectionConfig>;
    };
}

export interface SectionConfig {
    type: string;
    settings: Record<string, any>;
    blocks?: BlockConfig[];
}

export interface BlockConfig {
    type: string;
    settings: Record<string, any>;
}

// Asset Generation
export interface AssetManifest {
    sessionId: string;
    assets: GeneratedAsset[];
    generatedAt: string;
}

export interface GeneratedAsset {
    id: string;
    type: 'hero_image' | 'product_image' | 'background' | 'icon';
    url: string; // GCS public URL
    prompt: string;
    aspectRatio: '16:9' | '1:1' | '4:3' | '9:16';
    width: number;
    height: number;
}

// Cloning Session (Firestore)
export interface CloningSession {
    sessionId: string;
    userId: string;
    sourceUrl: string;
    status: SessionStatus;
    designDNA?: DesignDNA;
    assetManifest?: AssetManifest;
    themeConfig?: ThemeConfig;
    shopifyThemeId?: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
}

export type SessionStatus =
    | 'pending'
    | 'analyzing'
    | 'generating_assets'
    | 'mapping_theme'
    | 'syncing'
    | 'completed'
    | 'failed'
    | 'payment_required';

// Shopify API Types
export interface ShopifyTheme {
    id: number;
    name: string;
    role: 'main' | 'unpublished' | 'demo';
    previewable: boolean;
    processing: boolean;
    created_at: string;
    updated_at: string;
}

export interface ShopifyAsset {
    key: string; // e.g., 'config/settings_data.json'
    value?: string; // File content
    attachment?: string; // Base64 for binary files
    public_url?: string;
}

export interface ShopifyOAuthTokens {
    access_token: string;
    scope: string;
    shop: string;
}

// API Request/Response Types
export interface AnalyzeRequest {
    url: string;
    sessionId: string;
    userId: string;
}

export interface AnalyzeResponse {
    success: boolean;
    sessionId: string;
    designDNA?: DesignDNA;
    error?: string;
}

export interface GenerateAssetsRequest {
    sessionId: string;
}

export interface GenerateAssetsResponse {
    success: boolean;
    assetManifest?: AssetManifest;
    error?: string;
}

export interface MapThemeRequest {
    sessionId: string;
}

export interface MapThemeResponse {
    success: boolean;
    themeConfig?: ThemeConfig;
    error?: string;
}

export interface SyncToShopifyRequest {
    sessionId: string;
    shopifyAccessToken: string;
    shop: string;
}

export interface SyncToShopifyResponse {
    success: boolean;
    themeId?: number;
    previewUrl?: string;
    error?: string;
}

// LiquidJS Preview
export interface PreviewRenderContext {
    settings: Record<string, any>;
    sections: Record<string, SectionConfig>;
    shop: {
        name: string;
        domain: string;
    };
}
