import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import StaticLandingPage from './StaticLandingPage';
import CodedLandingPage from './CodedLandingPage';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: page } = await supabase
        .from('landing_pages')
        .select('title, product_description, final_image_url, product_images')
        .eq('id', id)
        .eq('status', 'published')
        .single();

    if (!page) return {};

    return {
        title: page.title,
        description: page.product_description,
        openGraph: {
            title: page.title,
            description: page.product_description || '',
            images: page.final_image_url ? [page.final_image_url] : page.product_images?.slice(0, 1) || [],
        },
        twitter: {
            card: 'summary_large_image',
            title: page.title,
            description: page.product_description || '',
            images: page.final_image_url ? [page.final_image_url] : [],
        },
    };
}

export default async function PublicLandingPage({ params }: PageProps) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch landing page with all necessary data
    const { data: page, error } = await supabase
        .from('landing_pages')
        .select(`
            id,
            title,
            country,
            language,
            product_name,
            product_price,
            product_discount_price,
            product_images,
            final_image_url,
            cta_button_text,
            primary_color,
            secondary_color,
            page_type,
            coded_html,
            photoshoots,
            section_images,
            ai_content
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single();

    if (error || !page) {
        notFound();
    }

    // Render based on page type
    if (page.page_type === 'coded') {
        return (
            <CodedLandingPage
                pageId={page.id}
                productName={page.product_name || page.title}
                language={page.language || 'ar'}
                country={page.country || 'DZ'}
                price={page.product_price}
                discountPrice={page.product_discount_price}
                primaryColor={page.primary_color || '#22C55E'}
                secondaryColor={page.secondary_color || '#FFFFFF'}
                ctaText={page.cta_button_text || 'اطلب الآن'}
                aiContent={page.ai_content || {}}
                sectionImages={page.section_images || {}}
                productImages={page.product_images || []}
            />
        );
    }

    // Default: Static image landing page
    return (
        <StaticLandingPage
            pageId={page.id}
            imageUrl={page.final_image_url || ''}
            ctaText={page.cta_button_text || 'Order Now'}
            language={page.language || 'ar'}
            country={page.country || 'DZ'}
            price={page.product_price}
            discountPrice={page.product_discount_price}
            productName={page.product_name || page.title}
            primaryColor={page.primary_color || '#000000'}
        />
    );
}
