// Inline nav icons — zero dependency. Simple 24×24 outline set, stroke=currentColor.

export type NavIconName =
  | 'dashboard' | 'projects' | 'map' | 'clock' | 'safety' | 'documents'
  | 'people' | 'team' | 'vendors' | 'financial' | 'costcodes'
  | 'reports' | 'assets' | 'warranties' | 'connections' | 'settings' | 'apikeys';

const PATHS: Record<NavIconName, React.ReactNode> = {
  map: (<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14" /><path d="M15 6v14" /></>),
  dashboard: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
  projects: (<><path d="M4 21V6l7-3v18" /><path d="M11 8h7a2 2 0 0 1 2 2v11" /><path d="M4 21h17" /><path d="M14.5 12h.01M14.5 16h.01M7.5 9h.01M7.5 13h.01M7.5 17h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  safety: (<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  documents: (<><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4" /><path d="M8 12h8M8 16h6" /></>),
  people: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 8.5a3 3 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9" /></>),
  team: (<><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 19a5.5 5.5 0 0 1 11 0M13 19a5.5 5.5 0 0 1 8.5-4.6" /></>),
  vendors: (<><rect x="2" y="7" width="12" height="9" rx="1" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>),
  financial: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  costcodes: (<><path d="M3 12l8-8h6a2 2 0 0 1 2 2v6l-8 8a2 2 0 0 1-2.8 0L3 14.8A2 2 0 0 1 3 12z" /><circle cx="15" cy="9" r="1.3" /></>),
  reports: (<><circle cx="12" cy="12" r="9" /><path d="M12 3v9h9" /></>),
  assets: (<><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M12 12l9-5M12 12v10M12 12L3 7" /></>),
  warranties: (<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l1.8 1.8L15 10" /></>),
  connections: (<><path d="M9 12a3 3 0 0 1 0-4l2-2a3 3 0 0 1 4 4l-1 1" /><path d="M15 12a3 3 0 0 1 0 4l-2 2a3 3 0 0 1-4-4l1-1" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></>),
  apikeys: (<><circle cx="8" cy="14" r="3.5" /><path d="M10.5 11.5L20 2M17 5l2 2M14 8l2 2" /></>),
};

export function NavIcon({ name, className = 'h-5 w-5' }: { name: NavIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
