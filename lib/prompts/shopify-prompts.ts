/**
 * Centralized prompt templates for Shopify design cloning
 * Gemini Flash (Vision), Gemini Pro (Logic), and Imagen 3 (Assets)
 */

// ============================================
// GEMINI FLASH - Vision & Analysis Prompts
// ============================================

export const VISION_ANALYSIS_SYSTEM = `You are an expert UI/UX designer and web analyst with deep knowledge of design systems, color theory, and visual hierarchy.

Your task is to analyze website screenshots and extracted CSS data to identify the "Design DNA" - the core visual identity that can be replicated in a Shopify theme.

You MUST output a strictly formatted JSON object that follows this exact schema:
{
  "colors": {
    "primary": "hex_color",
    "secondary": "hex_color",
    "accent": "hex_color",
    "background": "hex_color",
    "text": "hex_color",
    "additional": ["hex1", "hex2", ...]
  },
  "typography": {
    "headingFont": {
      "family": "Font Name",
      "weights": [400, 600, 700],
      "fallback": "sans-serif"
    },
    "bodyFont": {
      "family": "Font Name",
      "weights": [400, 600],
      "fallback": "sans-serif"
    },
    "vibe": "serif|sans-serif|monospace"
  },
  "sections": [
    {
      "type": "hero_banner|three_column_grid|product_grid|testimonials|newsletter|etc",
      "order": 1,
      "properties": {}
    }
  ],
  "vibe": {
    "primary": "minimalist|luxury|corporate|playful|bold|elegant",
    "keywords": ["modern", "clean", "professional"]
  },
  "metadata": {
    "niche": "Industry name",
    "targetAudience": "Description"
  }
}

Critical Requirements:
1. **Color Extraction**: Identify the most dominant colors by frequency and visual hierarchy
2. **Font Matching**: Map detected fonts to the closest Google Font equivalent
3. **Section Detection**: Identify major layout blocks in order of appearance
4. **Vibe Analysis**: Determine the overall design aesthetic and mood
5. **Strict JSON**: Output ONLY valid JSON, no additional text or markdown`;

export function buildVisionAnalysisPrompt(
    cssData: Record<string, any>,
    themeSchema?: string
): string {
    let prompt = `Analyze the provided website screenshot and CSS data to extract the Design DNA.

**Extracted CSS Data:**
\`\`\`json
${JSON.stringify(cssData, null, 2)}
\`\`\`
`;

    if (themeSchema) {
        prompt += `\n**Target Shopify Theme Schema (for reference):**
\`\`\`json
${themeSchema}
\`\`\`

Map the extracted design to keys available in this schema where possible.
`;
    }

    prompt += `\n**Instructions:**
1. Examine the screenshot for visual hierarchy and layout patterns
2. Cross-reference with the CSS data for accurate color/font values
3. Identify the primary call-to-action elements and their styling
4. Determine section structure (hero, features, testimonials, etc.)
5. Output the complete Design DNA JSON object`;

    return prompt;
}

// ============================================
// GEMINI PRO - JSON Mapping & Logic Prompts
// ============================================

export const JSON_MAPPING_SYSTEM = `You are a senior software architect specializing in Shopify theme development and JSON schema validation.

Your task is to convert extracted Design DNA and generated assets into valid Shopify theme configuration files.

You MUST ensure:
1. **Schema Compliance**: All generated JSON validates against Shopify's requirements
2. **Asset Mapping**: Replace placeholder URLs with provided GCS URLs
3. **Section Logic**: Enable/disable sections based on detected layout patterns
4. **Type Safety**: Use correct data types for all settings (string, number, boolean, etc.)

Output Format:
{
  "settings_data": {
    "current": {
      "colors_solid_button_labels": "#FFFFFF",
      "colors_accent_1": "#121212",
      // ... all theme settings
    }
  },
  "templates_index": {
    "sections": {
      "hero": {
        "type": "image-banner",
        "settings": {}
      }
    },
    "order": ["hero", "featured-products", "newsletter"]
  }
}`;

export function buildMappingPrompt(
    designDNA: any,
    assetManifest: any,
    masterThemeSchema: string
): string {
    return `Convert the following Design DNA and Asset Manifest into valid Shopify theme configuration.

**Design DNA:**
\`\`\`json
${JSON.stringify(designDNA, null, 2)}
\`\`\`

**Generated Assets:**
\`\`\`json
${JSON.stringify(assetManifest, null, 2)}
\`\`\`

**Master Theme Schema (settings_schema.json):**
\`\`\`json
${masterThemeSchema}
\`\`\`

**Mapping Requirements:**
1. Map all colors from Design DNA to theme color settings
2. Configure font families using theme typography settings
3. Create section configurations matching the detected layout
4. Replace image placeholders with GCS URLs from Asset Manifest
5. Set appropriate default values for enabled sections
6. Ensure all JSON keys match the Master Theme Schema exactly

**Critical Validation:**
- Every color setting must be a valid hex code
- Font settings must reference valid font families
- Section types must match available theme sections
- Asset URLs must use the provided GCS URLs, not placeholders

Output ONLY the complete JSON configuration following the output format specified in the system instruction.`;
}

// ============================================
// IMAGEN 3 - Asset Generation Prompts
// ============================================

export interface AssetPromptConfig {
    type: 'hero' | 'product' | 'background' | 'icon';
    niche: string;
    vibe: string;
    colors: string[];
    aspectRatio: '16:9' | '1:1' | '4:3';
}

export function buildAssetGenerationPrompt(config: AssetPromptConfig): string {
    const basePrompts = {
        hero: `Professional photorealistic hero banner image for a ${config.niche} website.`,
        product: `High-quality product photography for ${config.niche} in a studio setting.`,
        background: `Subtle abstract background pattern for a ${config.niche} website.`,
        icon: `Minimalist icon representing ${config.niche} in a modern style.`,
    };

    const vibeDescriptors: Record<string, string> = {
        minimalist: 'Clean, spacious, simple composition with negative space',
        luxury: 'Premium, elegant, sophisticated with high-end materials',
        corporate: 'Professional, trustworthy, business-appropriate',
        playful: 'Vibrant, energetic, fun and approachable',
        bold: 'Strong contrast, dramatic lighting, impactful composition',
        elegant: 'Refined, graceful, timeless aesthetic',
    };

    let prompt = basePrompts[config.type];

    // Add vibe context
    prompt += `\n\nStyle: ${vibeDescriptors[config.vibe] || config.vibe}`;

    // Add color palette
    if (config.colors.length > 0) {
        prompt += `\n\nColor Palette: Use these hex colors harmoniously - ${config.colors.join(', ')}`;
    }

    // Add technical requirements
    prompt += `\n\nTechnical Requirements:
- Aspect ratio: ${config.aspectRatio}
- High resolution suitable for web
- Commercial photography aesthetic
- No text or typography in the image
- Professional lighting and composition`;

    // Add niche-specific details
    prompt += `\n\nSubject Details: Focus on ${config.niche} products/themes with attention to texture, material quality, and contextual setting appropriate for the industry.`;

    return prompt;
}

// ============================================
// CSS Extraction Prompts (for Puppeteer)
// ============================================

export const CSS_EXTRACTION_SCRIPT = `
// Extract computed CSS from the target page
(function() {
  const data = {
    colors: new Set(),
    fonts: new Set(),
    layout: []
  };

  // Extract colors from computed styles
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const bgColor = styles.backgroundColor;
    const color = styles.color;
    
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      data.colors.add(bgColor);
    }
    if (color) {
      data.colors.add(color);
    }
  });

  // Extract font families
  const uniqueFonts = new Set();
  elements.forEach(el => {
    const font = window.getComputedStyle(el).fontFamily;
    if (font) {
      font.split(',').forEach(f => uniqueFonts.add(f.trim().replace(/['"]/g, '')));
    }
  });
  data.fonts = Array.from(uniqueFonts);

  // Extract layout structure (simplified)
  const sections = document.querySelectorAll('section, header, main, footer, [class*="section"], [class*="container"]');
  data.layout = Array.from(sections).slice(0, 20).map((el, idx) => ({
    tag: el.tagName.toLowerCase(),
    class: el.className,
    order: idx
  }));

  return {
    colors: Array.from(data.colors),
    fonts: data.fonts,
    layout: data.layout
  };
})();
`;
