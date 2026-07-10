import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AiChat from './pages/AiChat';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-chat" element={<AiChat />} />
        
        {/* Catch-all: If a user types a random URL, send them back to Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
