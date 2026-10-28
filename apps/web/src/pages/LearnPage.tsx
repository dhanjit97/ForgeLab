import { LearnCard } from '../components/LearnCard';

export function LearnPage() {
  return (
    <section className="page learn-page">
      <header className="page-header">
        <h1>Learn</h1>
        <p className="lead">
          Structured lessons for C, C++, Rust, and Python. Read, run, and explain code.
        </p>
      </header>
      <div className="grid">
        <LearnCard
          language="cpp"
          title="C++ — First Program"
          description="Your first compiled program. Learn about main, iostream, and basic syntax."
          level="beginner"
          minutes={15}
        />
        <LearnCard
          language="rust"
          title="Rust — Variables and Mutability"
          description="Understand let, mut, shadowing, and Rust's ownership model."
          level="beginner"
          minutes={20}
        />
        <LearnCard
          language="python"
          title="Python — Functions"
          description="Define functions with parameters, return values, and docstrings."
          level="beginner"
          minutes={20}
        />
        <LearnCard
          language="c"
          title="C — Pointers and Memory"
          description="Pointers, addresses, and manual memory management."
          level="intermediate"
          minutes={25}
        />
      </div>
      <div className="empty-placeholder">
        <p>Content validation and CI checks run on every change.</p>
      </div>
    </section>
  );
}
