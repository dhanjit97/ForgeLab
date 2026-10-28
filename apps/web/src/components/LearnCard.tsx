export function LearnCard({
  language,
  title,
  description,
  level,
  minutes,
}: {
  language: string;
  title: string;
  description: string;
  level: string;
  minutes: number;
}) {
  return (
    <article className="learn-card">
      <div className="learn-card-header">
        <span className="language-badge">{language}</span>
        <span className="level-badge">{level}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <footer className="learn-card-footer">
        <span>{minutes} min</span>
        <button className="btn btn-text">Start lesson</button>
      </footer>
    </article>
  );
}
