import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
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
        <button onClick={() => window.location.href = 'http://localhost:5000/auth/logout'} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
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
          <button onClick={() => setShowReport(!showReport)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#1a5276', color: 'white', border: 'none', borderRadius: '3px' }}>
            {showReport ? 'View Transactions' : 'View Charts'}
          </button>
        </div>
      </div>

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
