import './Home.css';

const features = [
  ['01', 'Track your money', 'Keep income, expenses, and your current balance in one simple view.'],
  ['02', 'Plan your goals', 'Turn important plans into achievable goals and track each contribution.'],
  ['03', 'Stay prepared', 'Manage bills, calculate tax, explore investments, and get useful insights.'],
  ['04', 'Ask FinTrack AI', 'Get clear answers to everyday questions about your financial planning.']
];

const signIn = () => { window.location.href = 'http://localhost:5000/auth/google'; };

export default function Home() {
  return <main className="fin-home">
    <header className="fin-home-nav"><a href="/" className="fin-wordmark">FINTRACK</a><button onClick={signIn}>Log in</button></header>
    <section className="fin-intro"><p>PERSONAL FINANCE, SIMPLIFIED</p><h1>FINTRACK</h1><h2>Start your journey with us.</h2><span>A calmer way to understand your money, build better habits, and move towards the life you want.</span></section>
    <section className="fin-feature-section" id="features"><div className="fin-section-title"><p>WHAT YOU CAN DO</p><h2>Built around your financial life.</h2></div><div className="fin-feature-grid">{features.map(([number, title, text]) => <article key={title}><small>{number}</small><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <footer className="fin-footer"><span>FINTRACK</span><p>Make every rupee count.</p><button onClick={signIn}>Log in →</button></footer>
  </main>;
}
