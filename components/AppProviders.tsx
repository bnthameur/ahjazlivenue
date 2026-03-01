'use client';

import { EmojiProvider } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';
import { LanguageProvider } from './LanguageProvider';
import DoubleLocaleGuard from './DoubleLocaleGuard';
import TopProgressBar from './TopProgressBar';

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <EmojiProvider data={emojiData}>
            <LanguageProvider>
                <DoubleLocaleGuard>
                    <TopProgressBar />
                    {children}
                </DoubleLocaleGuard>
            </LanguageProvider>
        </EmojiProvider>
    );
}
