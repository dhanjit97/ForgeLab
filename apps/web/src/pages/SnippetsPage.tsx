export function SnippetsPage() {
  return (
    <section className="page snippets-page">
      <header className="page-header">
        <h1>Snippets</h1>
        <p className="lead">
          Searchable snippet library. Search by title, language, tag, topic, level, and full-text
          content.
        </p>
      </header>
      <div className="empty-state">
        <p>Snippet library comes in Phase 1 (UI prototype) with mock data.</p>
      </div>
    </section>
  );
}
