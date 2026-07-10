import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AiChat from './pages/AiChat';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route loads the Login page */}
        <Route path="/" element={<Login />} />
        
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
