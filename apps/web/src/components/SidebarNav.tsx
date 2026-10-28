type SidebarNavProps = {
  page: string;
  onNavigate: (page: string) => void;
};

const NAV_ITEMS = [
  { key: 'learn', label: 'Learn' },
  { key: 'code-lab', label: 'Code Lab' },
  { key: 'snippets', label: 'Snippets' },
  { key: 'guides', label: 'Engineering Guides' },
  { key: 'projects', label: 'Projects' },
  { key: 'progress', label: 'My Progress' },
];

export function SidebarNav({ page, onNavigate }: SidebarNavProps) {
  return (
    <nav className="sidebar-nav">
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              className={`nav-item ${item.key === page ? 'active' : ''}`}
              aria-current={item.key === page ? 'page' : undefined}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <p className="muted">ForgeLab v0.1.0</p>
        <p className="muted small">Phase 0 — Foundation</p>
      </div>
    </nav>
  );
}
