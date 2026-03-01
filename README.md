# LanciFast 🚀

AI-powered landing page generator for e-commerce in North Africa (Algeria, Morocco, Tunisia).

## Features

- 🎨 **AI Image Generation** - Generate stunning landing page designs with Gemini AI
- 📱 **Mobile-First Design** - Optimized for mobile viewing and conversion
- 🌍 **Multi-Language** - Arabic, French, and English support
- 💳 **Cash on Delivery** - Built-in COD order form
- 📊 **Order Management** - Track and manage orders from dashboard
- 🎯 **Niche-Specific** - Specialized prompts for Medical, Fashion, Electronics, Beauty, Home, and Food

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (gemini-3-pro-image-preview)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bnthameur/lancifast.git
cd lancifast
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

5. Run database migrations (in Supabase SQL Editor):
   - Run all files in `supabase/migrations/` folder

6. Start development server:
```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bnthameur/lancifast)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GEMINI_API_KEY` | Google AI Studio API key |

## License

MIT
