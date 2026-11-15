import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { errorMessage, timeAgo } from '../utils/format';

export default function Conversation() {
  const { gigId, userId } = useParams();
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${gigId}/${userId}`);
      setInfo({ gig: res.data.gig, other: res.data.other });
      setMessages(res.data.messages);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load this conversation'));
    } finally {
      setLoading(false);
    }
  }, [gigId, userId]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, 5000); // simple polling keeps the thread fresh
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      bottomRef.current?.scrollIntoView?.({ block: 'end' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${gigId}/${userId}`, { text });
      setMessages((m) => [...m, res.data.message]);
      setText('');
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not send your message'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="center-text">Loading...</p>;
  if (!info) {
    return (
      <div className="card empty">
        <h3>{error || 'Conversation not found'}</h3>
        <Link to="/messages" className="btn">Back to messages</Link>
      </div>
    );
  }

  return (
    <div className="details">
      <Link to="/messages" className="back-link">← All messages</Link>
      <div className="card chat">
        <div className="chat-head">
          <div>
            <h3>{info.other.name}</h3>
            <p className="muted">
              {info.other.university ? `${info.other.university} · ` : ''}
              About: <Link to={`/gigs/${info.gig._id}`}>{info.gig.title}</Link>
            </p>
          </div>
          <StatusBadge status={info.gig.status} />
        </div>

        <div className="chat-body" aria-live="polite">
          {messages.length === 0 && <p className="muted center-text">No messages yet. Say hello 👋</p>}
          {messages.map((m) => {
            const mine = String(m.sender) === String(user.id);
            return (
              <div key={m._id} className={`bubble ${mine ? 'bubble-mine' : 'bubble-theirs'}`}>
                <span className="bubble-text">{m.text}</span>
                <span className="bubble-time">{timeAgo(m.createdAt)}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p className="error">{error}</p>}
        <form className="chat-form" onSubmit={handleSend}>
          <input
            aria-label="Message" placeholder="Type a message..." value={text} maxLength={1000}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn" disabled={sending || !text.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
