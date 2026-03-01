import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Re-export routing configuration
export { routing };

// Create navigation utilities with the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
