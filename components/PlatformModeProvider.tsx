'use client';

import { createContext, useContext } from 'react';

const FreeModeContext = createContext(false);

/**
 * Exposes the admin "free mode" switch to dashboard client components.
 * The value is read on the server in app/[locale]/dashboard/layout.tsx.
 */
export function PlatformModeProvider({ freeMode, children }: { freeMode: boolean; children: React.ReactNode }) {
    return <FreeModeContext.Provider value={freeMode}>{children}</FreeModeContext.Provider>;
}

export function useFreeMode() {
    return useContext(FreeModeContext);
}
