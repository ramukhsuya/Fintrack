import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title);

export default function Dashboard() {
  const navigate = useNavigate();
  // --- TRANSACTION STATE ---
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // --- GOAL STATE ---
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false); // NEW: Tracks if we are editing the selected goal
  
  // Goal Form Fields (Used for both Create and Edit)
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalPriority, setGoalPriority] = useState('Medium');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalInitial, setGoalInitial] = useState(0); // Also used as currentAmount when editing
  const [goalDeadline, setGoalDeadline] = useState('');

  // Contribution Modal State
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');

  // --- REMINDER STATE ---
  const [reminders, setReminders] = useState([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderCategory, setReminderCategory] = useState('');
  const [reminderDueDate, setReminderDueDate] = useState('');
  const [reminderRecurringType, setReminderRecurringType] = useState('none');
  const [reminderDays, setReminderDays] = useState('3');
  const [reminderNotes, setReminderNotes] = useState('');

  // --- ITR TAX CALCULATOR STATE (FY 2024-25) ---
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [taxRegime, setTaxRegime] = useState('new');
  const [ageGroup, setAgeGroup] = useState('general');
  const [salaryIncome, setSalaryIncome] = useState('');
  const [otherTaxIncome, setOtherTaxIncome] = useState('');
  const [section80C, setSection80C] = useState('');
  const [section80D, setSection80D] = useState('');
  const [housingLoan, setHousingLoan] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [taxResult, setTaxResult] = useState(null);

  // --- MUTUAL FUND CALCULATOR STATE ---
  const [showMutualFundCalculator, setShowMutualFundCalculator] = useState(false);
  const [investmentType, setInvestmentType] = useState('sip');
  const [lumpsumAmount, setLumpsumAmount] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [investmentDuration, setInvestmentDuration] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('');
  const [mutualFundResult, setMutualFundResult] = useState(null);

  // --- PORTFOLIO STATE ---
  const [portfolio, setPortfolio] = useState([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockExchange, setStockExchange] = useState('NSE');
  const [stockShares, setStockShares] = useState('');
  const [stockPurchasePrice, setStockPurchasePrice] = useState('');
  const [stockPurchaseDate, setStockPurchaseDate] = useState('');
  const [portfolioDetails, setPortfolioDetails] = useState(null);
  const [portfolioRange, setPortfolioRange] = useState('6m');
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // --- UI STATE ---
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef(null);

  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      const transRes = await axios.get('/api/transactions');
      setTransactions(transRes.data.data);
      
      const goalRes = await axios.get('/api/goals');
      setGoals(goalRes.data.data);

      const reminderRes = await axios.get('/api/reminders');
      setReminders(reminderRes.data.data);

      const portfolioRes = await axios.get('/api/portfolio');
      setPortfolio(portfolioRes.data.data);
    } catch (err) {
      console.error("Error fetching data", err);
      setError('Could not load dashboard data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- TRANSACTION LOGIC ---
  const onTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put(`/api/transactions/${editingId}`, { text, amount: Number(amount) });
        setTransactions(transactions.map(t => t._id === editingId ? res.data.data : t));
        setEditingId(null);
      } else {
        const res = await axios.post('/api/transactions', { text, amount: Number(amount) });
        setTransactions([res.data.data, ...transactions]);
      }
      setText('');
      setAmount('');
    } catch (err) {
      setError(editingId ? 'Failed to update transaction.' : 'Failed to add transaction.');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };

  const initiateEdit = (transaction) => {
    setText(transaction.text);
    setAmount(transaction.amount);
    setEditingId(transaction._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setText('');
    setAmount('');
    setEditingId(null);
  };

  // --- GOAL LOGIC ---
  const onGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/goals', {
        name: goalName,
        description: goalDescription,
        category: goalCategory,
        priority: goalPriority,
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalInitial),
        targetDate: goalDeadline
      });
      setGoals([...goals, res.data.data]);
      
      resetGoalForm();
      setShowGoalForm(false);
    } catch (err) {
      setError('Failed to add goal.');
    }
  };

  const resetGoalForm = () => {
    setGoalName(''); setGoalDescription(''); setGoalCategory(''); setGoalPriority('Medium');
    setGoalTarget(''); setGoalInitial(0); setGoalDeadline('');
  };

  // NEW: Pre-fill form and enter edit mode
  const handleEditGoalClick = () => {
    setGoalName(selectedGoal.name);
    setGoalDescription(selectedGoal.description || '');
    setGoalCategory(selectedGoal.category);
    setGoalPriority(selectedGoal.priority);
    setGoalTarget(selectedGoal.targetAmount);
    setGoalInitial(selectedGoal.currentAmount); // Load current progress
    setGoalDeadline(selectedGoal.targetDate ? new Date(selectedGoal.targetDate).toISOString().split('T')[0] : '');
    setIsEditingGoal(true);
  };

  // NEW: Submit the edited goal
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/goals/${selectedGoal._id}`, {
        name: goalName,
        description: goalDescription,
        category: goalCategory,
        priority: goalPriority,
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalInitial),
        targetDate: goalDeadline
      });
      
      setGoals(goals.map(g => g._id === selectedGoal._id ? res.data.data : g));
      setSelectedGoal(res.data.data); // Update the detailed view with fresh data
      setIsEditingGoal(false);
    } catch (err) {
      setError('Failed to update goal.');
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    try {
      const newAmount = selectedGoal.currentAmount + Number(contributeAmount);
      const res = await axios.put(`/api/goals/${selectedGoal._id}`, { currentAmount: newAmount });
      
      setGoals(goals.map(g => g._id === selectedGoal._id ? res.data.data : g));
      setSelectedGoal(res.data.data);
      
      setContributeAmount('');
      setShowContributeModal(false);
    } catch (err) {
      setError('Failed to add contribution.');
    }
  };

  const handleMarkComplete = async () => {
    try {
      const res = await axios.put(`/api/goals/${selectedGoal._id}`, { 
        isCompleted: true, 
        currentAmount: selectedGoal.targetAmount 
      });
      setGoals(goals.map(g => g._id === selectedGoal._id ? res.data.data : g));
      setSelectedGoal(res.data.data);
    } catch (err) {
      setError('Failed to complete goal.');
    }
  };

  const handleDeleteGoal = async () => {
    if (!window.confirm("Are you sure you want to delete this goal? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/goals/${selectedGoal._id}`);
      setGoals(goals.filter(g => g._id !== selectedGoal._id));
      setSelectedGoal(null);
      setIsEditingGoal(false);
    } catch (err) {
      setError('Failed to delete goal.');
    }
  };

  // --- REMINDER LOGIC ---
  const resetReminderForm = () => {
    setReminderTitle('');
    setReminderAmount('');
    setReminderCategory('');
    setReminderDueDate('');
    setReminderRecurringType('none');
    setReminderDays('3');
    setReminderNotes('');
  };

  const reminderPayload = () => ({
    title: reminderTitle,
    amount: Number(reminderAmount),
    category: reminderCategory,
    dueDate: reminderDueDate,
    recurringType: reminderRecurringType,
    reminderDays: Number(reminderDays),
    notes: reminderNotes
  });

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/reminders', reminderPayload());
      setReminders([...reminders, res.data.data].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      resetReminderForm();
      setShowReminderForm(false);
    } catch (err) {
      setError('Failed to add reminder.');
    }
  };

  const handleEditReminderClick = () => {
    setReminderTitle(selectedReminder.title);
    setReminderAmount(selectedReminder.amount);
    setReminderCategory(selectedReminder.category);
    setReminderDueDate(new Date(selectedReminder.dueDate).toISOString().split('T')[0]);
    setReminderRecurringType(selectedReminder.recurringType || 'none');
    setReminderDays(String(selectedReminder.reminderDays || 3));
    setReminderNotes(selectedReminder.notes || '');
    setIsEditingReminder(true);
  };

  const handleUpdateReminder = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/reminders/${selectedReminder._id}`, reminderPayload());
      setReminders(reminders.map(r => r._id === selectedReminder._id ? res.data.data : r));
      setSelectedReminder(res.data.data);
      setIsEditingReminder(false);
    } catch (err) {
      setError('Failed to update reminder.');
    }
  };

  const handleReminderPaid = async () => {
    try {
      const res = await axios.put(`/api/reminders/${selectedReminder._id}`, { isPaid: !selectedReminder.isPaid });
      setReminders(reminders.map(r => r._id === selectedReminder._id ? res.data.data : r));
      setSelectedReminder(res.data.data);
    } catch (err) {
      setError('Failed to update reminder status.');
    }
  };

  const handleDeleteReminder = async () => {
    if (!window.confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/reminders/${selectedReminder._id}`);
      setReminders(reminders.filter(r => r._id !== selectedReminder._id));
      setSelectedReminder(null);
      setIsEditingReminder(false);
    } catch (err) {
      setError('Failed to delete reminder.');
    }
  };

  // --- ITR TAX CALCULATOR LOGIC (AY 2026-27 / FY 2025-26 rough estimate) ---
  const calculateTaxForRegime = (regime, age, grossIncome, oldRegimeDeductions) => {
    const taxableIncome = Math.max(0, grossIncome - oldRegimeDeductions);
    let tax = 0;
    let slabs = [];

    const addSlab = (label, rate, taxableAmount) => {
      const slabTax = Math.max(0, taxableAmount) * rate;
      slabs.push({ label, rate: `${rate * 100}%`, tax: slabTax });
      tax += slabTax;
    };

    if (regime === 'new') {
      addSlab('₹0 - ₹4,00,000', 0, Math.min(taxableIncome, 400000));
      addSlab('₹4,00,001 - ₹8,00,000', 0.05, Math.min(Math.max(taxableIncome - 400000, 0), 400000));
      addSlab('₹8,00,001 - ₹12,00,000', 0.10, Math.min(Math.max(taxableIncome - 800000, 0), 400000));
      addSlab('₹12,00,001 - ₹16,00,000', 0.15, Math.min(Math.max(taxableIncome - 1200000, 0), 400000));
      addSlab('₹16,00,001 - ₹20,00,000', 0.20, Math.min(Math.max(taxableIncome - 1600000, 0), 400000));
      addSlab('₹20,00,001 - ₹24,00,000', 0.25, Math.min(Math.max(taxableIncome - 2000000, 0), 400000));
      addSlab('Above ₹24,00,000', 0.30, Math.max(taxableIncome - 2400000, 0));
    } else {
      const exemption = age === 'general' ? 250000 : age === 'senior' ? 300000 : 500000;
      const exemptionLabel = age === 'general' ? '₹0 - ₹2,50,000' : age === 'senior' ? '₹0 - ₹3,00,000' : '₹0 - ₹5,00,000';
      addSlab(exemptionLabel, 0, Math.min(taxableIncome, exemption));
      const fivePercentBand = age === 'superSenior' ? 0 : 500000 - exemption;
      if (fivePercentBand) addSlab(age === 'general' ? '₹2,50,001 - ₹5,00,000' : '₹3,00,001 - ₹5,00,000', 0.05, Math.min(Math.max(taxableIncome - exemption, 0), fivePercentBand));
      addSlab(age === 'superSenior' ? '₹5,00,001 - ₹10,00,000' : '₹5,00,001 - ₹10,00,000', 0.20, Math.min(Math.max(taxableIncome - 500000, 0), 500000));
      addSlab('Above ₹10,00,000', 0.30, Math.max(taxableIncome - 1000000, 0));
    }

    return { taxableIncome, tax, slabs };
  };

  const applyTaxRebate = (regime, taxableIncome, incomeTax) => {
    const eligible = regime === 'new' ? taxableIncome <= 1200000 : taxableIncome <= 500000;
    const limit = regime === 'new' ? 60000 : 12500;
    return eligible ? Math.min(incomeTax, limit) : 0;
  };

  const calculateTax = () => {
    const salary = Number(salaryIncome) || 0;
    const otherIncome = Number(otherTaxIncome) || 0;
    const grossIncome = salary + otherIncome;
    const oldStandardDeduction = Math.min(50000, salary);
    const newStandardDeduction = Math.min(75000, salary);
    const enteredDeductions = oldStandardDeduction + Math.min(Number(section80C) || 0, 150000) + (Number(section80D) || 0) + (Number(housingLoan) || 0) + (Number(otherDeductions) || 0);
    const deductionAmount = taxRegime === 'old' ? enteredDeductions : newStandardDeduction;
    const calculation = calculateTaxForRegime(taxRegime, ageGroup, grossIncome, deductionAmount);
    const rebate = applyTaxRebate(taxRegime, calculation.taxableIncome, calculation.tax);
    const incomeTaxAfterRebate = calculation.tax - rebate;
    const cess = incomeTaxAfterRebate * 0.04;
    const totalTax = incomeTaxAfterRebate + cess;

    const newCalculation = calculateTaxForRegime('new', ageGroup, grossIncome, newStandardDeduction);
    const oldCalculation = calculateTaxForRegime('old', ageGroup, grossIncome, enteredDeductions);
    const newComparison = (newCalculation.tax - applyTaxRebate('new', newCalculation.taxableIncome, newCalculation.tax)) * 1.04;
    const oldComparison = (oldCalculation.tax - applyTaxRebate('old', oldCalculation.taxableIncome, oldCalculation.tax)) * 1.04;
    setTaxResult({
      grossIncome,
      deductions: deductionAmount,
      taxableIncome: calculation.taxableIncome,
      taxBeforeRebate: calculation.tax,
      incomeTax: incomeTaxAfterRebate,
      rebate,
      cess,
      totalTax,
      effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
      slabs: calculation.slabs,
      newComparison: Math.round(newComparison),
      oldComparison: Math.round(oldComparison)
    });
  };

  const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // --- MUTUAL FUND CALCULATOR LOGIC ---
  const calculateMutualFundReturns = () => {
    const years = Number(investmentDuration);
    const annualRate = Number(expectedReturnRate);
    const amount = Number(investmentType === 'lumpsum' ? lumpsumAmount : sipAmount);
    if (!amount || amount <= 0 || !years || years <= 0 || annualRate < 0) {
      setError('Enter a positive investment amount and duration, plus a non-negative expected return.');
      return;
    }

    const yearlyData = [];
    let totalInvestment;
    let totalValue;

    if (investmentType === 'lumpsum') {
      totalInvestment = amount;
      totalValue = amount * Math.pow(1 + annualRate / 100, years);
      for (let year = 0; year <= Math.floor(years); year += 1) {
        const value = amount * Math.pow(1 + annualRate / 100, year);
        yearlyData.push({ year, investment: amount, returns: value - amount });
      }
    } else {
      const monthlyRate = annualRate / 1200;
      const months = Math.round(years * 12);
      totalInvestment = amount * months;
      totalValue = monthlyRate === 0
        ? totalInvestment
        : amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      for (let year = 0; year <= Math.floor(years); year += 1) {
        const monthsElapsed = year * 12;
        const investment = amount * monthsElapsed;
        const value = monthlyRate === 0 || monthsElapsed === 0
          ? investment
          : amount * ((Math.pow(1 + monthlyRate, monthsElapsed) - 1) / monthlyRate) * (1 + monthlyRate);
        yearlyData.push({ year, investment, returns: value - investment });
      }
    }

    setError('');
    setMutualFundResult({ totalInvestment, totalValue, estimatedReturns: totalValue - totalInvestment, yearlyData });
  };

  // --- PORTFOLIO LOGIC ---
  const loadPortfolio = async () => {
    const response = await axios.get('/api/portfolio');
    setPortfolio(response.data.data);
  };

  const addHolding = async (event) => {
    event.preventDefault();
    try {
      setPortfolioLoading(true);
      await axios.post('/api/portfolio/stocks', {
        symbol: stockSymbol.toUpperCase(), exchange: stockExchange, shares: Number(stockShares),
        purchasePrice: Number(stockPurchasePrice), purchaseDate: stockPurchaseDate || undefined
      });
      await loadPortfolio();
      setStockSymbol(''); setStockShares(''); setStockPurchasePrice(''); setStockPurchaseDate('');
      setShowHoldingForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add the holding.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const removeHolding = async (holding) => {
    if (!window.confirm(`Remove ${holding.symbol} from your portfolio?`)) return;
    try {
      await axios.delete(`/api/portfolio/stocks/${holding._id}`);
      setPortfolio(portfolio.filter(item => item._id !== holding._id));
      if (selectedHolding?._id === holding._id) { setSelectedHolding(null); setPortfolioDetails(null); }
    } catch (err) {
      setError('Could not remove the holding.');
    }
  };

  const loadHoldingDetails = async (holding, range = portfolioRange) => {
    try {
      setPortfolioLoading(true);
      const response = await axios.get(`/api/portfolio/details/${holding.symbol}`, { params: { exchange: holding.exchange, range } });
      setSelectedHolding(holding);
      setPortfolioDetails(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load stock details.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const changePortfolioRange = async (range) => {
    setPortfolioRange(range);
    if (selectedHolding) await loadHoldingDetails(selectedHolding, range);
  };

  // --- CSV LOGIC ---
  const exportToCSV = () => {
    let csvContent = "Description,Amount,Date\n";
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      csvContent += `${t.text},${t.amount},${date}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "my_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = event.target.result.split('\n');
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',');
        if (row.length >= 2) {
          const desc = row[0].trim();
          const amt = Number(row[1].trim());
          if (desc && !isNaN(amt)) {
            try { await axios.post('/api/transactions', { text: desc, amount: amt }); } catch (err) {}
          }
        }
      }
      fileInputRef.current.value = "";
      fetchData();
    };
    reader.readAsText(file);
  };

  // --- MATH & CHARTS ---
  const amounts = transactions.map(t => t.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

  const doughnutData = {
    labels: ['Income', 'Expense'],
    datasets: [{ data: [income, expense], backgroundColor: ['#28a745', '#dc3545'], borderWidth: 1 }]
  };

  const expenseMap = {};
  transactions.forEach(t => {
    if (t.amount < 0) {
      const desc = t.text.toLowerCase();
      expenseMap[desc] = (expenseMap[desc] || 0) + Math.abs(t.amount);
    }
  });
  const barData = {
    labels: Object.keys(expenseMap),
    datasets: [{ label: 'Amount Spent', data: Object.values(expenseMap), backgroundColor: '#007bff' }]
  };

  let savingsSummary = null;
  const targetAmt = parseFloat(goalTarget) || 0;
  const initialAmt = parseFloat(goalInitial) || 0;
  if (targetAmt > 0 && goalDeadline) {
    const targetDateObj = new Date(goalDeadline);
    const daysRemaining = Math.ceil((targetDateObj - today) / (1000 * 60 * 60 * 24));
    const amountNeeded = targetAmt - initialAmt;
    if (daysRemaining > 0 && amountNeeded > 0) {
      const weeksRemaining = Math.ceil(daysRemaining / 7);
      const monthsRemaining = Math.ceil(daysRemaining / 30) || 1; 
      savingsSummary = {
        amountNeeded, daysRemaining,
        daily: (amountNeeded / daysRemaining).toFixed(2),
        weekly: (amountNeeded / weeksRemaining).toFixed(2),
        monthly: (amountNeeded / monthsRemaining).toFixed(2)
      };
    }
  }

  const getDaysUntilDue = (reminder) => {
    if (typeof reminder.daysUntilDue === 'number') return reminder.daysUntilDue;
    const dueDate = new Date(reminder.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return Math.round((dueDate - currentDate) / (1000 * 60 * 60 * 24));
  };
  const activeReminders = reminders.filter(reminder => !reminder.isPaid);
  const overdueReminders = activeReminders.filter(reminder => getDaysUntilDue(reminder) < 0);
  const upcomingReminders = activeReminders.filter(reminder => getDaysUntilDue(reminder) >= 0);
  const paidReminders = reminders.filter(reminder => reminder.isPaid);

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #48c9b0' }}>
        <h1 style={{ margin: 0, color: '#1a5276' }}>FlowFin Dashboard</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/ai-chat')} style={{ padding: '8px 16px', backgroundColor: '#1a5276', color: '#fff', border: '1px solid #1a5276', borderRadius: '4px', cursor: 'pointer' }}>AI Assistant</button>
          <button onClick={() => window.location.href = 'http://localhost:5000/auth/logout'} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* OVERVIEW CARDS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#2e86c1', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h4>Overall Balance</h4>
          <h2 style={{ margin: '10px 0 0 0' }}>${total}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: '#28b463', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h4>Total Income</h4>
          <h2 style={{ margin: '10px 0 0 0' }}>+${income}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: '#e74c3c', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h4>Total Expenses</h4>
          <h2 style={{ margin: '10px 0 0 0' }}>-${expense}</h2>
        </div>
      </div>

      {/* FINANCIAL GOALS SECTION */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e0e0e0' }}>
        
        {/* VIEW 1: DETAILED GOAL VIEW OR EDIT GOAL VIEW */}
        {selectedGoal ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #48c9b0', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#1a5276' }}>
                {isEditingGoal ? `Edit Goal: ${selectedGoal.name}` : selectedGoal.name}
              </h2>
              <button 
                onClick={() => {
                  if (isEditingGoal) setIsEditingGoal(false);
                  else setSelectedGoal(null);
                }} 
                style={{ padding: '6px 12px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                {isEditingGoal ? 'Cancel Edit' : 'Back to Goals'}
              </button>
            </div>

            {isEditingGoal ? (
              /* --- EDIT GOAL FORM --- */
              <form onSubmit={handleUpdateGoal} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Goal Name</label><input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Category</label><select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}><option value="Emergency Fund">Emergency Fund</option><option value="Savings">Savings</option><option value="Debt Repayment">Debt Repayment</option><option value="Purchase">Major Purchase</option><option value="Investment">Investment</option><option value="Education">Education</option><option value="Travel">Travel</option><option value="Other">Other</option></select></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Target Amount ($)</label><input type="number" min={goalInitial} step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /><small style={{color: '#666'}}>Must be at least equal to current amount.</small></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Current Amount ($)</label><input type="number" min="0" step="0.01" value={goalInitial} onChange={e => setGoalInitial(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Target Date</label><input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Priority</label><select value={goalPriority} onChange={e => setGoalPriority(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
                </div>
                <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Description (Optional)</label><textarea value={goalDescription} onChange={e => setGoalDescription(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}></textarea></div>
                
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Save Changes</button>
              </form>
            ) : (
              /* --- STANDARD DETAILED GOAL VIEW --- */
              <>
                <div style={{ 
                  padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', alignItems: 'center',
                  backgroundColor: selectedGoal.isCompleted ? '#d4edda' : (selectedGoal.isOnTrack ? '#d1ecf1' : '#fff3cd'),
                  color: selectedGoal.isCompleted ? '#155724' : (selectedGoal.isOnTrack ? '#0c5460' : '#856404'),
                  border: `1px solid ${selectedGoal.isCompleted ? '#c3e6cb' : (selectedGoal.isOnTrack ? '#bee5eb' : '#ffeeba')}`
                }}>
                  <span style={{ fontSize: '24px', marginRight: '15px' }}>{selectedGoal.isCompleted ? '🏆' : (selectedGoal.isOnTrack ? '✅' : '⚠️')}</span>
                  <div>
                    <strong>{selectedGoal.isCompleted ? 'Goal Completed!' : (selectedGoal.isOnTrack ? 'On Track.' : 'Needs Attention.')}</strong> 
                    {selectedGoal.isCompleted ? ' Congratulations on achieving your financial goal.' : (selectedGoal.isOnTrack ? " You're making good progress toward your goal." : " You're behind schedule on this goal.")}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #ddd' }}><h5 style={{ margin: 0 }}>Goal Details</h5></div>
                    <div style={{ padding: '15px' }}>
                      {selectedGoal.description && <><p>{selectedGoal.description}</p><hr/></>}
                      <p><strong>Category:</strong> {selectedGoal.category}</p>
                      <p><strong>Priority:</strong> <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: 'white', backgroundColor: selectedGoal.priority === 'High' ? '#e74c3c' : selectedGoal.priority === 'Medium' ? '#f39c12' : '#3498db' }}>{selectedGoal.priority}</span></p>
                      <p><strong>Start Date:</strong> {new Date(selectedGoal.startDate).toLocaleDateString()}</p>
                      <p><strong>Target Date:</strong> {new Date(selectedGoal.targetDate).toLocaleDateString()}</p>
                      {!selectedGoal.isCompleted && <p><strong>Days Remaining:</strong> <span style={{ color: selectedGoal.daysRemaining < 30 ? '#e74c3c' : 'inherit' }}>{selectedGoal.daysRemaining} days</span></p>}
                    </div>
                  </div>

                  <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #ddd' }}><h5 style={{ margin: 0 }}>Progress</h5></div>
                    <div style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{
                        width: '150px', height: '150px', borderRadius: '50%', margin: '0 auto 20px auto',
                        background: `conic-gradient(#28b463 ${Math.round(selectedGoal.progressPercentage)}%, #eee 0)`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}>
                        <div style={{ width: '120px', height: '120px', background: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{Math.round(selectedGoal.progressPercentage)}%</span>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>Complete</span>
                        </div>
                      </div>

                      <p><strong>Target Amount:</strong> ${selectedGoal.targetAmount.toFixed(2)}</p>
                      <p><strong>Current Amount:</strong> <span style={{ color: '#28b463' }}>${selectedGoal.currentAmount.toFixed(2)}</span></p>
                      
                      {!selectedGoal.isCompleted && (
                        <>
                          <p><strong>Still Needed:</strong> <span style={{ color: '#e74c3c' }}>${(selectedGoal.targetAmount - selectedGoal.currentAmount).toFixed(2)}</span></p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <div>
                    {/* --- NEW EDIT BUTTON ALONGSIDE ADD CONTRIBUTION --- */}
                    <button onClick={handleEditGoalClick} style={{ padding: '8px 16px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                      ✎ Edit Goal
                    </button>

                    {!selectedGoal.isCompleted && (
                      <button onClick={() => setShowContributeModal(true)} style={{ padding: '8px 16px', backgroundColor: '#28b463', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        + Add Contribution
                      </button>
                    )}
                  </div>
                  <div>
                    {!selectedGoal.isCompleted && (
                      <button onClick={handleMarkComplete} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#28b463', border: '1px solid #28b463', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                        ✓ Mark as Complete
                      </button>
                    )}
                    <button onClick={handleDeleteGoal} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer' }}>
                      X Delete Goal
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          
          /* VIEW 2: STANDARD GOALS LIST */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#1a5276' }}>Financial Goals</h2>
              <button onClick={() => setShowGoalForm(!showGoalForm)} style={{ padding: '6px 12px', backgroundColor: showGoalForm ? '#6c757d' : '#48c9b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {showGoalForm ? 'Cancel' : '+ Add Goal'}
              </button>
            </div>

            {showGoalForm && (
              <form onSubmit={onGoalSubmit} style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#1a5276' }}>Create New Financial Goal</h4>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Goal Name</label><input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Category</label><select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}><option value="">Select a category</option><option value="Emergency Fund">Emergency Fund</option><option value="Savings">Savings</option><option value="Debt Repayment">Debt Repayment</option><option value="Purchase">Major Purchase</option><option value="Investment">Investment</option><option value="Education">Education</option><option value="Travel">Travel</option><option value="Other">Other</option></select></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Target Amount ($)</label><input type="number" min="1" step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Initial Contribution ($)</label><input type="number" min="0" step="0.01" value={goalInitial} onChange={e => setGoalInitial(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Target Date</label><input type="date" min={todayFormatted} value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Priority</label><select value={goalPriority} onChange={e => setGoalPriority(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
                </div>
                <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Description (Optional)</label><textarea value={goalDescription} onChange={e => setGoalDescription(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}></textarea></div>
                
                {savingsSummary && (
                  <div style={{ backgroundColor: '#d1ecf1', color: '#0c5460', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #bee5eb' }}>
                    <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Goal Summary</h5>
                    <p style={{ margin: '0 0 10px 0' }}>You need to save <strong>${savingsSummary.amountNeeded.toFixed(2)}</strong> in <strong>{savingsSummary.daysRemaining}</strong> days.</p>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>Daily savings needed: <strong>${savingsSummary.daily}</strong></li>
                      <li>Weekly savings needed: <strong>${savingsSummary.weekly}</strong></li>
                      <li>Monthly savings needed: <strong>${savingsSummary.monthly}</strong></li>
                    </ul>
                  </div>
                )}
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Create Goal</button>
              </form>
            )}

            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {goals.length === 0 ? <p style={{ color: '#777' }}>No goals set yet. Start saving!</p> : (
                goals.map(goal => (
                  <div key={goal._id} style={{ minWidth: '280px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ backgroundColor: '#48c9b0', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>{goal.name}</h4>
                      <span style={{ fontSize: '12px', backgroundColor: goal.isOnTrack ? '#28b463' : '#f1c40f', padding: '2px 8px', borderRadius: '10px' }}>{goal.isOnTrack ? 'On Track' : 'Behind'}</span>
                    </div>
                    <div style={{ padding: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Target:</strong> ${goal.targetAmount}</p>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Progress:</strong> ${goal.currentAmount}</p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}><strong>Days Left:</strong> {goal.daysRemaining}</p>
                      <div style={{ backgroundColor: '#eee', height: '15px', borderRadius: '10px', overflow: 'hidden', marginBottom: '5px' }}>
                        <div style={{ width: `${goal.progressPercentage}%`, backgroundColor: '#1a5276', height: '100%' }}></div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', color: '#555', marginBottom: '15px' }}>{Math.round(goal.progressPercentage)}%</div>
                      
                      <button onClick={() => setSelectedGoal(goal)} style={{ width: '100%', padding: '8px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* BILL REMINDERS SECTION */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e0e0e0' }}>
        {selectedReminder ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #48c9b0', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#1a5276' }}>{isEditingReminder ? `Edit Reminder: ${selectedReminder.title}` : selectedReminder.title}</h2>
              <button onClick={() => isEditingReminder ? setIsEditingReminder(false) : setSelectedReminder(null)} style={{ padding: '6px 12px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>{isEditingReminder ? 'Cancel Edit' : 'Back to Reminders'}</button>
            </div>

            {isEditingReminder ? (
              <form onSubmit={handleUpdateReminder} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bill Name</label><input value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount ($)</label><input type="number" min="0.01" step="0.01" value={reminderAmount} onChange={e => setReminderAmount(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label><select value={reminderCategory} onChange={e => setReminderCategory(e.target.value)} required style={{ width: '100%', padding: '10px' }}><option value="">Select a category</option><option>Utilities</option><option>Rent/Mortgage</option><option>Insurance</option><option>Subscription</option><option>Credit Card</option><option>Loan Payment</option><option>Phone/Internet</option><option>Education</option><option>Healthcare</option><option>Tax</option><option>Other</option></select></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Due Date</label><input type="date" value={reminderDueDate} onChange={e => setReminderDueDate(e.target.value)} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Repeats</label><select value={reminderRecurringType} onChange={e => setReminderRecurringType(e.target.value)} style={{ width: '100%', padding: '10px' }}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Remind Me</label><select value={reminderDays} onChange={e => setReminderDays(e.target.value)} style={{ width: '100%', padding: '10px' }}><option value="1">1 day before</option><option value="2">2 days before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option><option value="14">14 days before</option></select></div>
                </div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes (optional)</label><textarea value={reminderNotes} onChange={e => setReminderNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} />
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
              </form>
            ) : (
              <>
                {(() => {
                  const days = getDaysUntilDue(selectedReminder);
                  const status = selectedReminder.isPaid ? { label: 'Paid', color: '#28b463' } : days < 0 ? { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, color: '#e74c3c' } : { label: days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`, color: days <= Number(selectedReminder.reminderDays || 3) ? '#f39c12' : '#2e86c1' };
                  return <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '5px', color: 'white', backgroundColor: status.color }}><strong>{status.label}</strong></div>;
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}><strong>Amount</strong><p style={{ fontSize: '22px', color: '#1a5276', marginBottom: 0 }}>${Number(selectedReminder.amount).toFixed(2)}</p></div>
                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}><strong>Due Date</strong><p style={{ marginBottom: 0 }}>{new Date(selectedReminder.dueDate).toLocaleDateString()}</p></div>
                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}><strong>Category</strong><p style={{ marginBottom: 0 }}>{selectedReminder.category}</p></div>
                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}><strong>Repeats</strong><p style={{ marginBottom: 0, textTransform: 'capitalize' }}>{selectedReminder.recurringType || 'none'}</p></div>
                </div>
                {selectedReminder.notes && <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}><strong>Notes</strong><p style={{ marginBottom: 0 }}>{selectedReminder.notes}</p></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <div><button onClick={handleEditReminderClick} style={{ padding: '8px 16px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Edit Reminder</button><button onClick={handleReminderPaid} style={{ padding: '8px 16px', backgroundColor: '#28b463', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{selectedReminder.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}</button></div>
                  <button onClick={handleDeleteReminder} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer' }}>Delete Reminder</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h2 style={{ margin: 0, color: '#1a5276' }}>Bill Reminders</h2><button onClick={() => { setShowReminderForm(!showReminderForm); resetReminderForm(); }} style={{ padding: '6px 12px', backgroundColor: showReminderForm ? '#6c757d' : '#48c9b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{showReminderForm ? 'Cancel' : '+ Add Reminder'}</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}><div style={{ padding: '14px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#fdecea', color: '#c0392b' }}><strong>Overdue</strong><div style={{ fontSize: '24px' }}>{overdueReminders.length}</div></div><div style={{ padding: '14px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#eaf4fb', color: '#1a5276' }}><strong>Upcoming</strong><div style={{ fontSize: '24px' }}>{upcomingReminders.length}</div></div><div style={{ padding: '14px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#eafaf1', color: '#1e8449' }}><strong>Paid</strong><div style={{ fontSize: '24px' }}>{paidReminders.length}</div></div></div>
            {showReminderForm && <form onSubmit={handleReminderSubmit} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', marginBottom: '20px' }}><h4 style={{ marginTop: 0 }}>Add Bill Reminder</h4><div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><input placeholder="Bill name" value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} required style={{ flex: 1, padding: '10px' }} /><input type="number" placeholder="Amount" min="0.01" step="0.01" value={reminderAmount} onChange={e => setReminderAmount(e.target.value)} required style={{ flex: 1, padding: '10px' }} /></div><div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><select value={reminderCategory} onChange={e => setReminderCategory(e.target.value)} required style={{ flex: 1, padding: '10px' }}><option value="">Select category</option><option>Utilities</option><option>Rent/Mortgage</option><option>Insurance</option><option>Subscription</option><option>Credit Card</option><option>Loan Payment</option><option>Phone/Internet</option><option>Education</option><option>Healthcare</option><option>Tax</option><option>Other</option></select><input type="date" min={todayFormatted} value={reminderDueDate} onChange={e => setReminderDueDate(e.target.value)} required style={{ flex: 1, padding: '10px' }} /></div><div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><select value={reminderRecurringType} onChange={e => setReminderRecurringType(e.target.value)} style={{ flex: 1, padding: '10px' }}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select><select value={reminderDays} onChange={e => setReminderDays(e.target.value)} style={{ flex: 1, padding: '10px' }}><option value="1">1 day before</option><option value="2">2 days before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option><option value="14">14 days before</option></select></div><textarea placeholder="Notes (optional)" value={reminderNotes} onChange={e => setReminderNotes(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} /><button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Create Reminder</button></form>}
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>{reminders.length === 0 ? <p style={{ color: '#777' }}>No bill reminders yet. Add one to track upcoming payments.</p> : reminders.map(reminder => { const days = getDaysUntilDue(reminder); const color = reminder.isPaid ? '#28b463' : days < 0 ? '#e74c3c' : days <= Number(reminder.reminderDays || 3) ? '#f39c12' : '#2e86c1'; const label = reminder.isPaid ? 'Paid' : days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`; return <div key={reminder._id} style={{ minWidth: '260px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ backgroundColor: color, color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}><strong>{reminder.title}</strong><span style={{ fontSize: '12px' }}>{label}</span></div><div style={{ padding: '15px' }}><p><strong>${Number(reminder.amount).toFixed(2)}</strong> · {reminder.category}</p><p style={{ fontSize: '14px' }}>Due {new Date(reminder.dueDate).toLocaleDateString()}</p><button onClick={() => setSelectedReminder(reminder)} style={{ width: '100%', padding: '8px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>View Details</button></div></div>; })}</div>
          </>
        )}
      </div>

      {/* QUICK ACTIONS & REPORTS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f4f4f4', borderRadius: '5px' }}>
        <div><strong>Data & Reports</strong></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={{ padding: '8px 12px', cursor: 'pointer' }}>Export CSV</button>
          <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={importFromCSV} />
          <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 12px', cursor: 'pointer' }}>Import CSV</button>
          <button onClick={() => setShowTaxCalculator(!showTaxCalculator)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '3px' }}>
            {showTaxCalculator ? 'Close ITR Calculator' : 'Start ITR Calculator'}
          </button>
          <button onClick={() => setShowMutualFundCalculator(!showMutualFundCalculator)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#148f77', color: 'white', border: 'none', borderRadius: '3px' }}>
            {showMutualFundCalculator ? 'Close MF Calculator' : 'Start MF Calculator'}
          </button>
          <button onClick={() => setShowPortfolio(!showPortfolio)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#c26b15', color: 'white', border: 'none', borderRadius: '3px' }}>
            {showPortfolio ? 'Close Portfolio' : 'View Portfolio'}
          </button>
          <button onClick={() => setShowReport(!showReport)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '3px' }}>
            {showReport ? 'View Transactions' : 'View Charts'}
          </button>
        </div>
      </div>

      {showTaxCalculator && (
        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
            <h2 style={{ color: '#1a5276', margin: 0 }}>ITR Tax Calculator</h2>
            <span style={{ color: '#666', fontSize: '14px' }}>AY 2026-27 · FY 2025-26</span>
          </div>
          <p style={{ color: '#666', marginTop: 0 }}>A rough estimate for resident individuals. It excludes surcharge, marginal relief, special-rate income, and filing calculations—verify before filing.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '18px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, color: '#1a5276' }}>Income and deductions</h4>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Tax regime</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button type="button" onClick={() => setTaxRegime('new')} style={{ flex: 1, padding: '9px', border: '1px solid #1a5276', borderRadius: '4px', cursor: 'pointer', backgroundColor: taxRegime === 'new' ? '#1a5276' : 'white', color: taxRegime === 'new' ? 'white' : '#1a5276' }}>New regime</button>
                <button type="button" onClick={() => setTaxRegime('old')} style={{ flex: 1, padding: '9px', border: '1px solid #1a5276', borderRadius: '4px', cursor: 'pointer', backgroundColor: taxRegime === 'old' ? '#1a5276' : 'white', color: taxRegime === 'old' ? 'white' : '#1a5276' }}>Old regime</button>
              </div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Age group</label>
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }}><option value="general">Below 60 years</option><option value="senior">60 to 80 years</option><option value="superSenior">Above 80 years</option></select>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Salary income</label>
              <input type="number" min="0" placeholder="Annual salary before deductions" value={salaryIncome} onChange={e => setSalaryIncome(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} />
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Other income</label>
              <input type="number" min="0" placeholder="Interest, rental income, etc." value={otherTaxIncome} onChange={e => setOtherTaxIncome(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />

              {taxRegime === 'old' && <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                <h4 style={{ marginTop: 0, color: '#1a5276' }}>Old-regime deductions</h4>
                <p style={{ fontSize: '13px', color: '#666' }}>A standard deduction of up to ₹50,000 is included automatically for salary income.</p>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Section 80C (maximum ₹1,50,000)</label><input type="number" min="0" value={section80C} onChange={e => setSection80C(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Section 80D (medical insurance)</label><input type="number" min="0" value={section80D} onChange={e => setSection80D(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Housing-loan interest</label><input type="number" min="0" value={housingLoan} onChange={e => setHousingLoan(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Other deductions</label><input type="number" min="0" value={otherDeductions} onChange={e => setOtherDeductions(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
              </div>}
              <button type="button" onClick={calculateTax} style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Calculate tax</button>
            </div>

            <div>
              {!taxResult ? <div style={{ height: '100%', minHeight: '220px', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '20px', border: '1px dashed #bbb', borderRadius: '8px', color: '#777' }}>Enter your annual income and select <strong>Calculate tax</strong> to view the estimate.</div> : <>
                <div style={{ padding: '18px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ marginTop: 0, color: '#1a5276' }}>Tax calculation results</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                    {[['Gross total income', taxResult.grossIncome], ['Total deductions', taxResult.deductions], ['Taxable income', taxResult.taxableIncome], ['Income tax before rebate', taxResult.taxBeforeRebate], ['Section 87A rebate', taxResult.rebate], ['Income tax after rebate', taxResult.incomeTax], ['Health & education cess (4%)', taxResult.cess]].map(([label, value]) => <tr key={label}><th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee' }}>{label}</th><td style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid #eee' }}>{formatINR(value)}</td></tr>)}
                    <tr><th style={{ textAlign: 'left', paddingTop: '12px', color: '#1a5276' }}>Total tax liability</th><td style={{ textAlign: 'right', paddingTop: '12px', color: '#1a5276', fontWeight: 'bold' }}>{formatINR(taxResult.totalTax)}</td></tr>
                  </tbody></table>
                  <p style={{ marginBottom: 0, color: '#666' }}>Effective tax rate: <strong>{taxResult.effectiveRate.toFixed(2)}%</strong></p>
                </div>
                <div style={{ padding: '18px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ marginTop: 0, color: '#1a5276' }}>Tax slab breakdown</h4>
                  {taxResult.slabs.filter(slab => slab.tax > 0 || slab.rate === '0%').map(slab => <div key={slab.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}><span>{slab.label} ({slab.rate})</span><strong>{formatINR(slab.tax)}</strong></div>)}
                </div>
                <div style={{ padding: '18px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ marginTop: 0, color: '#1a5276' }}>Regime comparison</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}><span>New regime: <strong>{formatINR(taxResult.newComparison)}</strong></span><span>Old regime: <strong>{formatINR(taxResult.oldComparison)}</strong></span></div>
                  <p style={{ marginBottom: 0, color: taxResult.newComparison < taxResult.oldComparison ? '#1e8449' : '#b9770e' }}><strong>{taxResult.newComparison < taxResult.oldComparison ? 'New' : 'Old'} regime</strong> saves {formatINR(Math.abs(taxResult.newComparison - taxResult.oldComparison))} using the deductions entered above.</p>
                </div>
                <div style={{ maxWidth: '320px', margin: '0 auto' }}><Doughnut data={{ labels: ['Take-home pay', 'Tax payable'], datasets: [{ data: [Math.max(0, taxResult.grossIncome - taxResult.totalTax), taxResult.totalTax], backgroundColor: ['#28a745', '#dc3545'], borderWidth: 1 }] }} options={{ plugins: { legend: { position: 'bottom' } } }} /></div>
              </>}
            </div>
          </div>
        </div>
      )}

      {showMutualFundCalculator && (
        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
          <h2 style={{ color: '#1a5276', marginTop: 0 }}>Mutual Fund Return Calculator</h2>
          <p style={{ color: '#666', marginTop: 0 }}>A rough projection based on a constant expected return. Mutual-fund returns are market-linked and are not guaranteed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '18px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, color: '#1a5276' }}>Investment details</h4>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><button type="button" onClick={() => setInvestmentType('sip')} style={{ flex: 1, padding: '9px', border: '1px solid #148f77', borderRadius: '4px', cursor: 'pointer', backgroundColor: investmentType === 'sip' ? '#148f77' : 'white', color: investmentType === 'sip' ? 'white' : '#148f77' }}>SIP</button><button type="button" onClick={() => setInvestmentType('lumpsum')} style={{ flex: 1, padding: '9px', border: '1px solid #148f77', borderRadius: '4px', cursor: 'pointer', backgroundColor: investmentType === 'lumpsum' ? '#148f77' : 'white', color: investmentType === 'lumpsum' ? 'white' : '#148f77' }}>Lump sum</button></div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>{investmentType === 'sip' ? 'Monthly SIP amount' : 'One-time investment amount'}</label>
              <input type="number" min="1" placeholder="Amount in ₹" value={investmentType === 'sip' ? sipAmount : lumpsumAmount} onChange={e => investmentType === 'sip' ? setSipAmount(e.target.value) : setLumpsumAmount(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} />
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Investment duration (years)</label>
              <input type="number" min="1" step="0.5" placeholder="For example, 10" value={investmentDuration} onChange={e => setInvestmentDuration(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} />
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Expected annual return (%)</label>
              <input type="number" min="0" step="0.1" placeholder="For example, 12" value={expectedReturnRate} onChange={e => setExpectedReturnRate(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
              <button type="button" onClick={calculateMutualFundReturns} style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#148f77', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Calculate projection</button>
            </div>
            <div>{!mutualFundResult ? <div style={{ minHeight: '220px', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '20px', border: '1px dashed #bbb', borderRadius: '8px', color: '#777' }}>Choose SIP or lump sum, then calculate your estimated future value.</div> : <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}><div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eaf4fb' }}><small>Invested</small><strong style={{ display: 'block', color: '#1a5276' }}>{formatINR(mutualFundResult.totalInvestment)}</strong></div><div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eafaf1' }}><small>Estimated returns</small><strong style={{ display: 'block', color: '#148f77' }}>{formatINR(mutualFundResult.estimatedReturns)}</strong></div><div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f4ecf7' }}><small>Future value</small><strong style={{ display: 'block', color: '#6f42c1' }}>{formatINR(mutualFundResult.totalValue)}</strong></div></div><Bar data={{ labels: mutualFundResult.yearlyData.map(item => `Year ${item.year}`), datasets: [{ label: 'Investment', data: mutualFundResult.yearlyData.map(item => item.investment), backgroundColor: 'rgba(54, 162, 235, 0.6)' }, { label: 'Estimated returns', data: mutualFundResult.yearlyData.map(item => item.returns), backgroundColor: 'rgba(20, 143, 119, 0.6)' }] }} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }} /></>}</div>
          </div>
        </div>
      )}

      {showPortfolio && (
        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
          {selectedHolding && portfolioDetails ? (() => {
            const quote = portfolioDetails.quote;
            const holding = portfolio.find(item => item._id === selectedHolding._id) || selectedHolding;
            const price = quote.regularMarketPrice || 0;
            const totalInvestment = holding.shares * holding.purchasePrice;
            const currentValue = holding.shares * price;
            const gain = currentValue - totalInvestment;
            return <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #48c9b0', paddingBottom: '10px' }}><div><h2 style={{ color: '#1a5276', margin: 0 }}>{holding.symbol} <span style={{ fontSize: '15px', color: '#666' }}>({holding.exchange})</span></h2><p style={{ margin: '4px 0 0', color: '#666' }}>{quote.longName || quote.shortName || holding.symbol}</p></div><button onClick={() => { setSelectedHolding(null); setPortfolioDetails(null); }} style={{ padding: '7px 12px', cursor: 'pointer' }}>Back to Portfolio</button></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '20px' }}><div style={{ padding: '14px', backgroundColor: '#eaf4fb', borderRadius: '8px' }}><small>Current price</small><strong style={{ display: 'block', fontSize: '22px', color: '#1a5276' }}>{formatINR(price)}</strong><span style={{ color: quote.regularMarketChange >= 0 ? '#148f77' : '#c0392b' }}>{quote.regularMarketChange >= 0 ? '+' : ''}{formatINR(quote.regularMarketChange)} ({Number(quote.regularMarketChangePercent || 0).toFixed(2)}%)</span></div><div style={{ padding: '14px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}><small>Shares owned</small><strong style={{ display: 'block', fontSize: '22px' }}>{holding.shares}</strong><span>Average price: {formatINR(holding.purchasePrice)}</span></div><div style={{ padding: '14px', backgroundColor: gain >= 0 ? '#eafaf1' : '#fdecea', borderRadius: '8px' }}><small>Gain / loss</small><strong style={{ display: 'block', fontSize: '22px', color: gain >= 0 ? '#148f77' : '#c0392b' }}>{gain >= 0 ? '+' : ''}{formatINR(gain)}</strong><span>{totalInvestment ? ((gain / totalInvestment) * 100).toFixed(2) : '0.00'}%</span></div><div style={{ padding: '14px', backgroundColor: '#f4ecf7', borderRadius: '8px' }}><small>Current value</small><strong style={{ display: 'block', fontSize: '22px', color: '#6f42c1' }}>{formatINR(currentValue)}</strong><span>Invested: {formatINR(totalInvestment)}</span></div></div>
              <div style={{ padding: '18px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }}><div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}><h4 style={{ margin: 0, color: '#1a5276' }}>Price history</h4><div style={{ display: 'flex', gap: '6px' }}>{['1m', '3m', '6m', '1y', '5y'].map(range => <button key={range} onClick={() => changePortfolioRange(range)} style={{ padding: '5px 8px', cursor: 'pointer', border: '1px solid #1a5276', borderRadius: '3px', backgroundColor: portfolioRange === range ? '#1a5276' : 'white', color: portfolioRange === range ? 'white' : '#1a5276' }}>{range.toUpperCase()}</button>)}</div></div><Line data={{ labels: portfolioDetails.historical.map(day => new Date(day.date).toLocaleDateString()), datasets: [{ label: 'Closing price', data: portfolioDetails.historical.map(day => day.close), borderColor: '#1a5276', backgroundColor: 'rgba(26, 82, 118, 0.12)', fill: true, tension: 0.2, pointRadius: 0 }] }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: false } } }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', color: '#555', fontSize: '14px' }}><span>Previous close: <strong>{formatINR(quote.regularMarketPreviousClose)}</strong></span><span>Day range: <strong>{formatINR(quote.regularMarketDayLow)} – {formatINR(quote.regularMarketDayHigh)}</strong></span><span>52-week range: <strong>{formatINR(quote.fiftyTwoWeekLow)} – {formatINR(quote.fiftyTwoWeekHigh)}</strong></span><span>Market cap: <strong>{quote.marketCap ? formatINR(quote.marketCap) : '—'}</strong></span></div>
            </>;
          })() : <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '10px' }}><div><h2 style={{ color: '#1a5276', margin: 0 }}>Stock Portfolio</h2><p style={{ color: '#666', margin: '4px 0 0' }}>Saved holdings with live Yahoo Finance market data.</p></div><button onClick={() => setShowHoldingForm(!showHoldingForm)} style={{ padding: '8px 12px', backgroundColor: '#c26b15', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{showHoldingForm ? 'Cancel' : '+ Add Holding'}</button></div>
            {showHoldingForm && <form onSubmit={addHolding} style={{ padding: '15px', margin: '18px 0', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}><h4 style={{ marginTop: 0 }}>Add a stock holding</h4><p style={{ color: '#666', fontSize: '13px' }}>Use the ticker without the exchange suffix: for example, RELIANCE for NSE or BSE.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}><input placeholder="Symbol (e.g. RELIANCE)" value={stockSymbol} onChange={e => setStockSymbol(e.target.value.toUpperCase())} required style={{ padding: '10px' }} /><select value={stockExchange} onChange={e => setStockExchange(e.target.value)} style={{ padding: '10px' }}><option value="NSE">NSE</option><option value="BSE">BSE</option></select><input type="number" min="0.0001" step="any" placeholder="Shares" value={stockShares} onChange={e => setStockShares(e.target.value)} required style={{ padding: '10px' }} /><input type="number" min="0" step="0.01" placeholder="Purchase price (₹)" value={stockPurchasePrice} onChange={e => setStockPurchasePrice(e.target.value)} required style={{ padding: '10px' }} /><input type="date" value={stockPurchaseDate} onChange={e => setStockPurchaseDate(e.target.value)} style={{ padding: '10px' }} /></div><button type="submit" disabled={portfolioLoading} style={{ marginTop: '12px', padding: '10px 16px', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{portfolioLoading ? 'Verifying…' : 'Save Holding'}</button></form>}
            {portfolio.length === 0 ? <div style={{ padding: '35px', textAlign: 'center', border: '1px dashed #bbb', borderRadius: '8px', color: '#777' }}>No holdings yet. Add your first NSE or BSE stock to start tracking it.</div> : <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', margin: '20px 0' }}><div style={{ padding: '13px', borderRadius: '8px', backgroundColor: '#eaf4fb' }}><small>Total invested</small><strong style={{ display: 'block', fontSize: '20px' }}>{formatINR(portfolio.reduce((sum, item) => sum + (item.totalInvestment || item.shares * item.purchasePrice), 0))}</strong></div><div style={{ padding: '13px', borderRadius: '8px', backgroundColor: '#eafaf1' }}><small>Live value</small><strong style={{ display: 'block', fontSize: '20px' }}>{formatINR(portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0))}</strong></div><div style={{ padding: '13px', borderRadius: '8px', backgroundColor: '#f4ecf7' }}><small>Live gain / loss</small><strong style={{ display: 'block', fontSize: '20px' }}>{formatINR(portfolio.reduce((sum, item) => sum + (item.gain || 0), 0))}</strong></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>{portfolio.map(holding => <div key={holding._id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}><div style={{ padding: '12px 15px', backgroundColor: '#1a5276', color: 'white', display: 'flex', justifyContent: 'space-between' }}><strong>{holding.symbol}</strong><span>{holding.exchange}</span></div><div style={{ padding: '15px' }}><p style={{ marginTop: 0, color: '#666', minHeight: '20px' }}>{holding.name || holding.quoteError || 'Loading quote…'}</p><p><strong>{holding.currentPrice ? formatINR(holding.currentPrice) : '—'}</strong> · {holding.shares} shares</p><p style={{ color: holding.gain >= 0 ? '#148f77' : '#c0392b' }}>{holding.gain === undefined ? 'Live price unavailable' : `${holding.gain >= 0 ? '+' : ''}${formatINR(holding.gain)} (${holding.gainPercentage.toFixed(2)}%)`}</p><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => loadHoldingDetails(holding)} disabled={portfolioLoading || !!holding.quoteError} style={{ flex: 1, padding: '8px', cursor: 'pointer' }}>View Details</button><button onClick={() => removeHolding(holding)} style={{ padding: '8px', color: '#c0392b', cursor: 'pointer' }}>Remove</button></div></div></div>)}</div></>}
          </>}
        </div>
      )}

      {showReport ? (
        <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Financial Reports</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
            <div style={{ width: '300px' }}><h4 style={{ textAlign: 'center' }}>Income vs Expense</h4><Doughnut data={doughnutData} /></div>
            <div style={{ width: '100%', marginTop: '30px' }}>
              <h4 style={{ textAlign: 'center' }}>Expense Breakdown</h4>
              {Object.keys(expenseMap).length > 0 ? <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} /> : <p style={{ textAlign: 'center' }}>No expenses logged.</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={onTransactionSubmit} style={{ marginBottom: '30px', display: 'flex', gap: '10px', padding: '15px', backgroundColor: editingId ? '#fff3cd' : '#f9f9f9', borderRadius: '5px', border: editingId ? '1px solid #ffeeba' : '1px solid #eee' }}>
            <input type="text" placeholder="Description..." value={text} onChange={(e) => setText(e.target.value)} required style={{ flex: 2, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}/>
            <input type="number" placeholder="Amount (- for expense)..." value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}/>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: editingId ? '#28a745' : '#48c9b0', color: '#fff', border: 'none', borderRadius: '4px' }}>{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={cancelEdit} style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}>Cancel</button>}
          </form>

          <h3 style={{ color: '#1a5276' }}>Recent Transactions</h3>
          {transactions.length === 0 ? <p>No transactions found.</p> : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {transactions.map(t => (
                <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fff', marginBottom: '8px', borderRadius: '4px', borderLeft: t.amount < 0 ? '5px solid #e74c3c' : '5px solid #28b463', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <strong style={{ fontSize: '16px' }}>{t.text}</strong> 
                  <div>
                    <span style={{ marginRight: '15px', fontWeight: 'bold' }}>{t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}</span>
                    <button onClick={() => initiateEdit(t)} style={{ backgroundColor: '#f39c12', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px', marginRight: '5px' }}>✎ Edit</button>
                    <button onClick={() => deleteTransaction(t._id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>X</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* --- ADD CONTRIBUTION MODAL OVERLAY --- */}
      {showContributeModal && selectedGoal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Add Contribution</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>You need ${Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount).toFixed(2)} to reach your target!</p>
            
            <form onSubmit={handleContribute}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount ($)</label>
              <input 
                type="number" step="0.01" min="0.01" value={contributeAmount} 
                onChange={(e) => setContributeAmount(e.target.value)} 
                required style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowContributeModal(false)} style={{ padding: '10px 15px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28b463', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Funds</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
