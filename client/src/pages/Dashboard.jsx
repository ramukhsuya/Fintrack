import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('/api/transactions');
        setTransactions(res.data.data);
      } catch (err) {
        console.error("Error fetching transactions", err);
        setError('Could not load transactions.');
      }
    };
    fetchTransactions();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/transactions', { 
        text, 
        amount: Number(amount) 
      });
      setTransactions([res.data.data, ...transactions]);
      setText('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setError('Failed to add transaction.');
    }
  };

  // --- NEW DELETE FUNCTION ---
  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      // Instantly remove it from the UI by filtering it out of our state
      setTransactions(transactions.filter(transaction => transaction._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete transaction.');
    }
  };

  const amounts = transactions.map(transaction => transaction.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* --- NEW HEADER & LOGOUT --- */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>Financial Dashboard</h1>
        <button 
          onClick={() => window.location.href = 'http://localhost:5000/auth/logout'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      {/* ------------------------- */}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>Your Balance</h2>
        <h1 style={{ margin: '5px 0' }}>${total}</h1>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: '#f4f4f4', 
        padding: '20px', 
        marginBottom: '20px',
        borderRadius: '5px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h4>INCOME</h4>
          <p style={{ color: 'green', fontSize: '20px', margin: 0 }}>+${income}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4>EXPENSE</h4>
          <p style={{ color: 'red', fontSize: '20px', margin: 0 }}>-${expense}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3>Add New Transaction</h3>
        <input 
          type="text" 
          placeholder="Description (e.g. Salary, Coffee)..." 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="number" 
          placeholder="Amount (- for expense, + for income)..." 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#333', color: '#fff', border: 'none' }}>
          Add Transaction
        </button>
      </form>

      <h3>Your Transactions:</h3>
      {transactions.length === 0 ? (
        <p>No transactions found. Your database is empty!</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {transactions.map(t => (
            <li key={t._id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              borderBottom: '1px solid #ccc',
              backgroundColor: '#fff',
              marginBottom: '5px',
              borderRight: t.amount < 0 ? '5px solid red' : '5px solid green'
            }}>
              <span>{t.text}</span> 
              <div>
                <span style={{ marginRight: '15px' }}>{t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}</span>
                
                {/* --- NEW DELETE BUTTON --- */}
                <button 
                  onClick={() => deleteTransaction(t._id)}
                  style={{
                    backgroundColor: '#ff4d4d', color: 'white', border: 'none', 
                    padding: '5px 8px', cursor: 'pointer', borderRadius: '3px'
                  }}
                >
                  X
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}