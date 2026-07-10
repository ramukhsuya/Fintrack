import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './AiChat.css';

export default function AiChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const activeConversation = conversations.find((conversation) => conversation._id === activeId);

  useEffect(() => {
    axios.get('/api/ai/conversations')
      .then(({ data }) => {
        const loadedConversations = Array.isArray(data.conversations) ? data.conversations : [];
        setConversations(loadedConversations);
        if (loadedConversations[0]) setActiveId(loadedConversations[0]._id);
      })
      .catch(() => setError('Could not load your conversations. Please sign in again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConversation?.messages?.length, sending]);

  const startNewChat = () => {
    setActiveId(null);
    setMessage('');
    setError('');
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');
    setMessage('');
    try {
      const { data } = await axios.post('/api/ai/chat', { message: text, conversationId: activeId });
      setConversations((current) => [data.conversation, ...current.filter((item) => item._id !== data.conversation._id)]);
      setActiveId(data.conversation._id);
    } catch (requestError) {
      setMessage(text);
      setError(requestError.response?.data?.error || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const renameConversation = async (conversation) => {
    const title = window.prompt('Conversation name', conversation.title)?.trim();
    if (!title || title === conversation.title) return;
    try {
      const { data } = await axios.patch(`/api/ai/conversations/${conversation._id}`, { title });
      setConversations((current) => current.map((item) => item._id === data.conversation._id ? data.conversation : item));
    } catch { setError('Could not rename the conversation.'); }
  };

  const deleteConversation = async (conversation) => {
    if (!window.confirm(`Delete “${conversation.title}”?`)) return;
    try {
      await axios.delete(`/api/ai/conversations/${conversation._id}`);
      setConversations((current) => current.filter((item) => item._id !== conversation._id));
      if (activeId === conversation._id) setActiveId(null);
    } catch { setError('Could not delete the conversation.'); }
  };

  return <main className="ai-chat-page">
    <aside className="ai-sidebar">
      <div className="ai-sidebar-heading"><div><p className="eyebrow">FlowFin</p><h1>Conversations</h1></div><a href="/dashboard" aria-label="Back to dashboard">×</a></div>
      <button className="new-chat-button" onClick={startNewChat}>＋ New chat</button>
      <nav className="conversation-list" aria-label="Past conversations">
        {loading ? <p className="muted">Loading…</p> : conversations.map((conversation) => <div className={`conversation-item ${activeId === conversation._id ? 'selected' : ''}`} key={conversation._id}>
          <button className="conversation-title" onClick={() => setActiveId(conversation._id)}>{conversation.title}</button>
          <div className="conversation-actions"><button onClick={() => renameConversation(conversation)} title="Rename">✎</button><button onClick={() => deleteConversation(conversation)} title="Delete">×</button></div>
        </div>)}
      </nav>
    </aside>
    <section className="ai-chat-panel">
      <header className="ai-chat-header"><div><p className="eyebrow">AI FINANCIAL GUIDE</p><h2>{activeConversation?.title || 'New conversation'}</h2></div><span className="status-dot">Online</span></header>
      <div className="message-area">
        {!activeConversation && !sending && <div className="welcome"><div className="bot-avatar">F</div><h2>How can I help with your finances?</h2><p>Ask about budgeting, saving, investing, or understanding your money.</p></div>}
        {(activeConversation?.messages || []).map((item, index) => <div key={`${item.timestamp}-${index}`} className={`message-row ${item.sender}`}><div className="message-bubble">{item.content}</div></div>)}
        {sending && <div className="message-row ai"><div className="message-bubble typing"><span></span><span></span><span></span></div></div>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="chat-error">{error}</p>}
      <form className="chat-composer" onSubmit={sendMessage}><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} rows="1" maxLength="4000" placeholder="Ask about financial planning…" disabled={sending} /><button type="submit" disabled={sending || !message.trim()} aria-label="Send message">↑</button></form>
      <p className="disclaimer">FlowFin provides general educational information, not individual financial advice.</p>
    </section>
  </main>;
}
