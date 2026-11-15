import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { errorMessage, timeAgo } from '../utils/format';

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get('/messages/threads')
        .then((res) => !cancelled && setThreads(res.data.threads))
        .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load your messages')))
        .finally(() => !cancelled && setLoading(false));
    load();
    const timer = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Messages</h2>
          <p className="muted">Conversations with gig owners and applicants</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && threads.length === 0 && (
        <div className="card empty">
          <h3>No conversations yet</h3>
          <p className="muted">
            Clients can message an applicant from the applicants list on their gig. Freelancers can reply once they have applied.
          </p>
          <Link to="/dashboard" className="btn">Go to dashboard</Link>
        </div>
      )}

      <div className="list">
        {threads.map((t) => (
          <Link key={`${t.gig._id}:${t.other._id}`} to={`/messages/${t.gig._id}/${t.other._id}`} className="list-row card thread-row">
            <div className="list-main">
              <span className="list-title">
                {t.other.name}
                {t.unread > 0 && <span className="unread-dot">{t.unread}</span>}
              </span>
              <div className="list-sub">
                <span>Gig: {t.gig.title}</span>
                <StatusBadge status={t.gig.status} />
              </div>
              <p className="thread-preview">
                {t.lastMessage.mine ? 'You: ' : ''}{t.lastMessage.text}
              </p>
            </div>
            <span className="muted">{timeAgo(t.lastMessage.createdAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
