// This file helps VS Code TypeScript language service recognize component modules
// If you're seeing "Cannot find module" errors, try:
// 1. Restart VS Code TypeScript Server: Cmd+Shift+P -> "TypeScript: Restart TS Server"
// 2. Reload VS Code window: Cmd+Shift+P -> "Developer: Reload Window"

// Re-export all gig components for better module resolution
export { default as GigsCalendar } from './components/GigsCalendar';
export { default as GigsList } from './components/GigsList'; 
export { default as GigsFilters } from './components/GigsFilters';
export { default as RSVPModal } from './components/RSVPModal';
export { default as GigDetailModal } from './components/GigDetailModal';

// Export types
export type { Gig, UserRSVP } from './GigsPage';
