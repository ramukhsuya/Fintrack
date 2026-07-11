import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './DashboardOverview.css';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function DashboardOverview() {
  const [data, setData] = useState({ transactions: [], goals: [], reminders: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([axios.get('/api/transactions'), axios.get('/api/goals'), axios.get('/api/reminders')])
      .then(([transactions, goals, reminders]) => setData({ transactions: transactions.data.data || [], goals: goals.data.data || [], reminders: reminders.data.data || [] }))
      .catch(() => setError('Your dashboard could not be loaded. Please refresh and try again.'));
  }, []);

  const amounts = data.transactions.map((transaction) => Number(transaction.amount));
  const income = amounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
  const expenses = Math.abs(amounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0));
  const visibleGoals = data.goals.filter((goal) => !goal.isCompleted).slice(0, 3);
  const visibleReminders = data.reminders.filter((reminder) => !reminder.isPaid).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);

  return <main className="overview-page">
    <header className="overview-nav"><Link to="/dashboard" className="overview-brand">FINTRACK</Link><nav><Link to="/ai-chat">AI assistant</Link><a href="http://localhost:5000/auth/logout">Log out</a></nav></header>
    <section className="overview-heading"><div><p>YOUR OVERVIEW</p><h1>Good to see you.</h1><span>A simple view of where your money stands today.</span></div><Link to="/transactions" className="outline-link">Manage finances →</Link></section>
    {error && <p className="overview-error">{error}</p>}
    <section className="balance-grid"><article className="balance-card balance-card-main"><span>Available balance</span><strong>{money(income - expenses)}</strong><small>Income minus your recorded expenses</small></article><article className="balance-card"><span>Total income</span><strong className="positive">{money(income)}</strong><small>{data.transactions.filter((item) => Number(item.amount) > 0).length} income entries</small></article><article className="balance-card"><span>Total expenses</span><strong className="negative">{money(expenses)}</strong><small>{data.transactions.filter((item) => Number(item.amount) < 0).length} expense entries</small></article></section>
    <section className="overview-two-column"><section className="overview-panel"><div className="panel-heading"><div><p>GOALS</p><h2>Your active goals</h2></div><Link to="/goals">View all →</Link></div>{visibleGoals.length ? <div className="goal-preview-list">{visibleGoals.map((goal) => { const percent = Math.min(100, Math.round((Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100)); return <article key={goal._id}><div><strong>{goal.name}</strong><span>{money(goal.currentAmount)} of {money(goal.targetAmount)}</span></div><b>{percent}%</b><i><em style={{ width: `${percent}%` }} /></i></article>; })}</div> : <div className="empty-state">No goals yet. <Link to="/goals">Add your first goal.</Link></div>}</section>
    <section className="overview-panel"><div className="panel-heading"><div><p>REMINDERS</p><h2>Upcoming payments</h2></div><Link to="/reminders">View all →</Link></div>{visibleReminders.length ? <div className="reminder-preview-list">{visibleReminders.map((reminder) => <article key={reminder._id}><div><strong>{reminder.title}</strong><span>{reminder.category || 'Reminder'} · Due {new Date(reminder.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div><b>{money(reminder.amount)}</b></article>)}</div> : <div className="empty-state">Nothing upcoming. <Link to="/reminders">Create a reminder.</Link></div>}</section></section>
    <section className="tools-section"><div className="panel-heading"><div><p>EXPLORE</p><h2>More from FinTrack</h2></div></div><div className="tool-grid"><Link to="/reports"><small>01</small><strong>Monthly reports</strong><span>See spending charts and income breakdowns.</span></Link><Link to="/calculators#itr"><small>02</small><strong>ITR calculator</strong><span>Estimate tax under the old or new regime.</span></Link><Link to="/calculators#mutual-funds"><small>03</small><strong>Mutual funds</strong><span>Project potential investment growth.</span></Link><Link to="/portfolio"><small>04</small><strong>Portfolio</strong><span>Follow your holdings and performance.</span></Link><Link to="/ai-chat"><small>05</small><strong>AI assistant</strong><span>Ask a financial planning question.</span></Link></div></section>
  </main>;
}
