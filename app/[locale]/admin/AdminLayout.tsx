'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { User } from '@supabase/supabase-js';
import { useLocale } from 'next-intl';

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    role: 'admin';
}

interface AdminLayoutProps {
    user: User;
    profile: Profile | null;
    children: React.ReactNode;
}

// SVG Icons
const DashboardIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const VenuesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const navigation = [
    { name: 'Overview', href: '/admin', icon: DashboardIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Venues', href: '/admin/venues', icon: VenuesIcon },
    { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export default function AdminLayout({ user, profile, children }: AdminLayoutProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
        router.refresh();
    };

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar - Fixed */}
            <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col fixed h-screen">
                {/* Logo */}
                <div className="h-12 flex items-center px-3 border-b border-slate-700">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <span className="text-sm font-bold text-white">Admin Panel</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${isActive
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <Icon />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to Site */}
                <div className="p-3 border-t border-slate-700">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded transition-colors"
                    >
                        ← Back to Main Site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-56">
                {/* Navbar */}
                <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 sticky top-0 z-10">
                    <div className="text-slate-400 text-sm">
                        Welcome, <span className="text-white font-medium">{displayName}</span>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-600/20 text-red-400 rounded">
                            Admin
                        </span>
                        <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {displayName[0]?.toUpperCase()}
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-slate-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
