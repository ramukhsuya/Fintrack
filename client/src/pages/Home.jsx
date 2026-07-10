import './Home.css';

const features = [
  ['↗', 'Balance Sheet', 'Track income, expenses, balances, and transactions in one clear financial picture.'],
  ['⌁', 'Tax Calculator', 'Estimate income tax and compare tax regimes before you make a decision.'],
  ['◎', 'Financial Goals', 'Set targets, follow your progress, and stay motivated as you save.'],
  ['◈', 'Investment Tracker', 'Track stock holdings, market movement, performance, and returns.'],
  ['◷', 'Smart Reminders', 'Stay ahead of bills with due-date reminders and payment tracking.'],
  ['∑', 'Return Calculator', 'Explore mutual-fund projections and understand long-term growth.'],
  ['✦', 'AI Assistant', 'Ask practical questions about money, budgeting, saving, and investing.'],
  ['▤', 'Financial Insights', 'See your spending patterns and clearer monthly financial summaries.'],
  ['▣', 'Tax Return Blueprint', 'Build a structured starting point for your income-tax return.']
];

const signIn = () => { window.location.href = 'http://localhost:5000/auth/google'; };

export default function Home() {
  return <main className="home-page">
    <header className="home-nav">
      <a className="home-logo" href="/" aria-label="FlowFin home"><span>F</span> FlowFin</a>
      <nav aria-label="Primary navigation"><a href="#features">Features</a><button onClick={signIn}>Log in</button></nav>
    </header>

    <section className="home-hero">
      <p className="home-kicker">YOUR MONEY, MADE CLEAR</p>
      <h1>Feel confident about <em>every</em> financial move.</h1>
      <p className="home-lede">FlowFin brings your spending, goals, investments, and financial planning together in one calm, clear place.</p>
      <div className="home-actions"><button className="primary-action" onClick={signIn}>Get started free <span>→</span></button><a href="#features">Explore features</a></div>
      <div className="hero-summary" aria-label="Sample financial overview"><div><span>Monthly balance</span><strong>₹ 48,250</strong><small>↑ 12.4% from last month</small></div><div className="summary-ring"><b>72%</b><span>goals on track</span></div><div className="summary-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
    </section>

    <section className="feature-section" id="features">
      <div className="section-heading"><p>BUILT FOR REAL LIFE</p><h2>Everything you need to make money feel simpler.</h2><span>One home for the financial habits that build a better future.</span></div>
      <div className="feature-grid">{features.map(([icon, title, text]) => <article className="home-feature-card" key={title}><div className="home-feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="home-cta"><p>START TODAY</p><h2>Your next financial win starts here.</h2><button className="primary-action" onClick={signIn}>Create your free account <span>→</span></button></section>
    <footer className="home-footer"><a className="home-logo" href="/"><span>F</span> FlowFin</a><p>Clarity for every rupee.</p></footer>
  </main>;
}
