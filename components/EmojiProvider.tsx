'use client';

import { useEffect } from 'react';
import twemoji from 'twemoji';
import './EmojiProvider.css';

export default function EmojiProvider() {
    useEffect(() => {
        // Parse the body on mount
        twemoji.parse(document.body, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/'
        });

        // Use MutationObserver for dynamic content
        const observer = new MutationObserver((mutations) => {
            // Disconnect to prevent infinite loop effectively
            observer.disconnect();

            twemoji.parse(document.body, {
                folder: 'svg',
                ext: '.svg',
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/'
            });

            // Reconnect
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    }, []);

    return null;
}
