'use client';

import { EmojiProvider } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';
import { LanguageProvider } from './LanguageProvider';
import DoubleLocaleGuard from './DoubleLocaleGuard';

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <EmojiProvider data={emojiData}>
            <LanguageProvider>
                <DoubleLocaleGuard>
                    {children}
                </DoubleLocaleGuard>
            </LanguageProvider>
        </EmojiProvider>
    );
}
