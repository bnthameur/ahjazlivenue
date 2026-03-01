// =============================================================================
// 5-Step AI Landing Page Pipeline Types
// =============================================================================

// Step 1: Product Analysis (Vision AI)
export interface ProductAnalysis {
    product_type: string;
    category: string;
    target_user: string;
    usage_context: string[];
    emotional_triggers: string[];
    visual_style: {
        primary_colors: string[];
        style_keywords: string[];
    };
    trust_focus: string[];
}

// Step 2: Layout Resolution
export type LayoutType = 'LONG_FORM_MOBILE' | 'MEDIUM_FORM_MOBILE';

export type SectionType =
    | 'hero'
    | 'problem_solution'
    | 'features'
    | 'lifestyle'
    | 'trust'
    | 'cta';

export interface ImageStrategy {
    hero_images: number;
    lifestyle_images: number;
    feature_images: number;
}

export interface LayoutDecision {
    layout_type: LayoutType;
    recommended_sections: SectionType[];
    image_strategy: ImageStrategy;
}

// Step 3: Image Prompts
export interface ImagePrompts {
    hero_image_prompt: string;
    lifestyle_image_prompts: string[];
    feature_image_prompts: string[];
}

// Step 4: Arabic Copy (Anti-Hallucination)
export interface ArabicCopy {
    hero: {
        title: string;
        subtitle: string;
    };
    problem_solution: string;
    benefits: string[]; // max 5
    trust: string;
    cta: string;
}

// Step 5: Review Assembly
export interface ReviewResult {
    warnings: string[];
    passed: boolean;
}

// =============================================================================
// Generated Images Output
// =============================================================================
export interface GeneratedImages {
    hero_image: string; // base64 or URL
    lifestyle_images: string[];
    feature_images: string[];
}

// =============================================================================
// Photoshoot Feature
// =============================================================================
export interface PhotoshootRequest {
    productImageBase64: string;
}

export interface PhotoshootResponse {
    images: string[]; // List of base64 images
}

// =============================================================================
// Complete Pipeline State
// =============================================================================
export interface PipelineState {
    step: PipelineStep;
    productImage: string | null; // base64
    productAnalysis: ProductAnalysis | null;
    layoutDecision: LayoutDecision | null;
    imagePrompts: ImagePrompts | null;
    arabicCopy: ArabicCopy | null;
    reviewResult: ReviewResult | null;
    generatedImages: GeneratedImages | null;
    error: string | null;
}

export type PipelineStep =
    | 'upload'
    | 'analyzing'
    | 'resolving-layout'
    | 'select-template' // NEW
    | 'generating-prompts'
    | 'review-prompts'
    | 'generating-copy'
    | 'review-copy'
    | 'generating-images'
    | 'preview'
    | 'launch';

// =============================================================================
// API Request/Response Types
// =============================================================================

// Analyze Product
export interface AnalyzeProductRequest {
    productImageBase64: string;
}

export interface AnalyzeProductResponse {
    analysis: ProductAnalysis;
}

// Resolve Layout
export interface ResolveLayoutRequest {
    productAnalysis: ProductAnalysis;
}

export interface ResolveLayoutResponse {
    layout: LayoutDecision;
}

// Generate Image Prompts
export interface GenerateImagePromptsRequest {
    productAnalysis: ProductAnalysis;
    layoutDecision: LayoutDecision;
    templateStyle?: string; // NEW
}

export interface GenerateImagePromptsResponse {
    prompts: ImagePrompts;
}

// Generate Arabic Copy
export interface GenerateArabicCopyRequest {
    productAnalysis: ProductAnalysis;
    layoutDecision: LayoutDecision;
    language: 'ar' | 'fr' | 'en';
    dialect?: 'dz' | 'ma' | 'tn' | 'standard';
    templateStyle?: string; // NEW
}

export interface GenerateArabicCopyResponse {
    copy: ArabicCopy;
}

// Review Assembly
export interface ReviewAssemblyRequest {
    arabicCopy: ArabicCopy;
    layoutDecision: LayoutDecision;
}

export interface ReviewAssemblyResponse {
    review: ReviewResult;
}

// Generate Images (Multi-image)
export interface GenerateImagesRequest {
    imagePrompts: ImagePrompts;
    productImageBase64: string;
}

export interface GenerateImagesResponse {
    images: GeneratedImages;
}

// =============================================================================
// Generation Settings (from UI)
// =============================================================================
export interface GenerationSettings {
    language: 'ar' | 'fr' | 'en';
    dialect: 'dz' | 'ma' | 'tn' | 'standard' | '';
    characters: 'man' | 'woman' | 'both';
    customSettings: string;
}
