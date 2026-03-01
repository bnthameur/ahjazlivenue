/**
 * LiquidJS Preview Service
 * Renders Shopify themes server-side before deployment
 */

import { Liquid } from 'liquidjs';
import { ThemeConfig, PreviewRenderContext } from '../types/shopify';

export class LiquidPreviewService {
  private engine: Liquid;

  constructor() {
    this.engine = new Liquid({
      cache: true,
      strictFilters: false,
      strictVariables: false,
    });

    // Register custom Shopify filters
    this.registerShopifyFilters();
  }

  /**
   * Render theme preview HTML
   */
  async renderPreview(
    themeConfig: ThemeConfig,
    templateConfig: any
  ): Promise<string> {
    try {
      // Build render context from theme configuration
      const context = this.buildRenderContext(themeConfig, templateConfig);

      // Get base template (simplified Dawn theme structure)
      const template = this.getBaseTemplate();

      // Render with LiquidJS
      const html = await this.engine.parseAndRender(template, context);

      return html;
    } catch (error: any) {
      throw new Error(`Preview rendering failed: ${error.message}`);
    }
  }

  /**
   * Build Liquid render context from theme config
   */
  private buildRenderContext(
    themeConfig: ThemeConfig,
    templateConfig: any
  ): PreviewRenderContext {
    return {
      settings: themeConfig.current,
      sections: templateConfig.sections || {},
      shop: {
        name: 'Preview Store',
        domain: 'preview.myshopify.com',
      },
    };
  }

  /**
   * Get base HTML template (simplified Shopify theme structure)
   */
  private getBaseTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ shop.name }}</title>
  <style>
    :root {
      --color-primary: {{ settings.colors_accent_1 | default: '#121212' }};
      --color-secondary: {{ settings.colors_accent_2 | default: '#334FB4' }};
      --color-text: {{ settings.colors_text | default: '#121212' }};
      --color-background: {{ settings.colors_background_1 | default: '#FFFFFF' }};
      --font-heading: {{ settings.type_header_font | default: 'sans-serif' }};
      --font-body: {{ settings.type_body_font | default: 'sans-serif' }};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      background-color: var(--color-background);
      line-height: 1.6;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--color-primary);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .section {
      padding: 60px 0;
    }
    
    .hero-banner {
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      color: white;
      text-align: center;
    }
    
    .hero-content {
      max-width: 600px;
      padding: 40px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
    }
    
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: var(--color-secondary);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 20px;
    }
    
    .multicolumn {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }
    
    .column {
      text-align: center;
      padding: 20px;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .product-card {
      border: 1px solid #e0e0e0;
      padding: 15px;
      border-radius: 8px;
    }
    
    .product-card img {
      width: 100%;
      height: auto;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  {% for section_id in sections %}
    {% assign section = sections[section_id] %}
    {% include section.type %}
  {% endfor %}
</body>
</html>
    `.trim();
  }

  /**
   * Register Shopify-specific Liquid filters
   */
  private registerShopifyFilters(): void {
    // Asset URL filter
    this.engine.registerFilter('asset_url', (v: any) => {
      return `/assets/${v}`;
    });

    // Image URL filter
    this.engine.registerFilter('img_url', (v: any, size: string = 'medium') => {
      return v || 'https://via.placeholder.com/500';
    });

    // Money filter
    this.engine.registerFilter('money', (v: any) => {
      const amount = parseFloat(v || '0') / 100;
      return `$${amount.toFixed(2)}`;
    });

    // Default filter (already built-in, but ensure it works)
    this.engine.registerFilter('default', (v: any, fallback: any) => {
      return v || fallback;
    });
  }

  /**
   * Render a specific section
   */
  async renderSection(
    sectionType: string,
    settings: Record<string, any>
  ): Promise<string> {
    const sectionTemplates: Record<string, string> = {
      'image-banner': this.getHeroBannerTemplate(),
      'multicolumn': this.getMulticolumnTemplate(),
      'featured-collection': this.getProductGridTemplate(),
      'newsletter': this.getNewsletterTemplate(),
    };

    const template = sectionTemplates[sectionType] || '<div>Section not found</div>';

    return this.engine.parseAndRender(template, { settings });
  }

  /**
   * Hero banner section template
   */
  private getHeroBannerTemplate(): string {
    return `
<section class="hero-banner section" style="background-image: url('{{ settings.image }}')">
  <div class="hero-content">
    <h1>{{ settings.heading | default: 'Welcome to our store' }}</h1>
    <p>{{ settings.text | default: 'Discover amazing products' }}</p>
    {% if settings.button_label %}
      <a href="{{ settings.button_link | default: '/collections/all' }}" class="button">
        {{ settings.button_label }}
      </a>
    {% endif %}
  </div>
</section>
    `;
  }

  /**
   * Multicolumn section template
   */
  private getMulticolumnTemplate(): string {
    return `
<section class="section">
  <div class="container">
    <h2>{{ settings.title }}</h2>
    <div class="multicolumn">
      {% for block in settings.blocks %}
        <div class="column">
          {% if block.image %}
            <img src="{{ block.image }}" alt="{{ block.title }}">
          {% endif %}
          <h3>{{ block.title }}</h3>
          <p>{{ block.text }}</p>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
    `;
  }

  /**
   * Product grid section template
   */
  private getProductGridTemplate(): string {
    return `
<section class="section">
  <div class="container">
    <h2>{{ settings.heading | default: 'Featured Products' }}</h2>
    <div class="product-grid">
      {% for i in (1..4) %}
        <div class="product-card">
          <img src="https://via.placeholder.com/300" alt="Product {{ i }}">
          <h3>Product {{ i }}</h3>
          <p>$99.00</p>
          <a href="#" class="button">Add to Cart</a>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
    `;
  }

  /**
   * Newsletter section template
   */
  private getNewsletterTemplate(): string {
    return `
<section class="section" style="background-color: var(--color-primary); color: white; text-align: center;">
  <div class="container">
    <h2>{{ settings.heading | default: 'Subscribe to our newsletter' }}</h2>
    <p>{{ settings.subtext | default: 'Get updates on new products and exclusive offers' }}</p>
    <form style="max-width: 500px; margin: 20px auto;">
      <input type="email" placeholder="Enter your email" style="width: 70%; padding: 12px; border: none; border-radius: 4px;">
      <button type="submit" class="button" style="width: 28%; margin-left: 2%;">Subscribe</button>
    </form>
  </div>
</section>
    `;
  }
}

/**
 * Singleton instance
 */
let liquidPreviewService: LiquidPreviewService | null = null;

export function getLiquidPreviewService(): LiquidPreviewService {
  if (!liquidPreviewService) {
    liquidPreviewService = new LiquidPreviewService();
  }
  return liquidPreviewService;
}
