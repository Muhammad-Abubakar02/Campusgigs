import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { errorMessage, formatBudget, formatDate } from '../utils/format';

function Stat({ label, value }) {
  return (
    <div className="stat card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ClientDashboard() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/gigs/mine')
      .then((res) => setGigs(res.data.gigs))
      .catch((err) => setError(errorMessage(err, 'Could not load your gigs')))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (gig) => {
    if (!window.confirm(`Delete "${gig.title}" and all its applications?`)) return;
    try {
      await api.delete(`/gigs/${gig._id}`);
      setGigs((list) => list.filter((g) => g._id !== gig._id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the gig'));
    }
  };

  const applicants = gigs.reduce((sum, g) => sum + g.applicantsCount, 0);

  return (
    <>
      <div className="stats">
        <Stat label="Gigs posted" value={gigs.length} />
        <Stat label="Open gigs" value={gigs.filter((g) => g.status === 'open').length} />
        <Stat label="Total applicants" value={applicants} />
      </div>

      <h3 className="section-title">My posted gigs</h3>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && gigs.length === 0 && (
        <div className="card empty">
          <h3>You have not posted any gigs yet</h3>
          <p className="muted">Post your first gig and students can start applying.</p>
          <Link to="/gigs/new" className="btn">+ Post a Gig</Link>
        </div>
      )}

      <div className="list">
        {gigs.map((g) => (
          <div key={g._id} className="list-row card">
            <div className="list-main">
              <Link to={`/gigs/${g._id}`} className="list-title">{g.title}</Link>
              <div className="list-sub">
                <StatusBadge status={g.status} />
                <span>{formatBudget(g.budget)}</span>
                <span>👥 {g.applicantsCount} applicant{g.applicantsCount === 1 ? '' : 's'}</span>
                <span>Posted {formatDate(g.createdAt)}</span>
              </div>
            </div>
            <div className="list-actions">
              <Link to={`/gigs/${g._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FreelancerDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/applications/mine')
      .then((res) => setApplications(res.data.applications))
      .catch((err) => setError(errorMessage(err, 'Could not load your applications')))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (a) => {
    if (!window.confirm(`Withdraw your application to "${a.gig.title}"?`)) return;
    try {
      await api.delete(`/applications/${a._id}`);
      setApplications((list) => list.filter((x) => x._id !== a._id));
    } catch (err) {
      setError(errorMessage(err, 'Could not withdraw the application'));
    }
  };

  const count = (s) => applications.filter((a) => a.status === s).length;

  return (
    <>
      <div className="stats">
        <Stat label="Applications" value={applications.length} />
        <Stat label="Pending" value={count('pending')} />
        <Stat label="Accepted" value={count('accepted')} />
      </div>

      <h3 className="section-title">Gigs I applied to</h3>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && applications.length === 0 && (
        <div className="card empty">
          <h3>No applications yet</h3>
          <p className="muted">Browse open gigs and apply to the ones that match your skills.</p>
          <Link to="/gigs" className="btn">Browse Gigs</Link>
        </div>
      )}

      <div className="list">
        {applications.map((a) => (
          <div key={a._id} className="list-row card">
            <div className="list-main">
              <Link to={`/gigs/${a.gig._id}`} className="list-title">{a.gig.title}</Link>
              <div className="list-sub">
                <StatusBadge status={a.status} />
                <span>Gig budget {formatBudget(a.gig.budget)}</span>
                {a.proposedPrice != null && <span>Your price {formatBudget(a.proposedPrice)}</span>}
                <span>Applied {formatDate(a.createdAt)}</span>
              </div>
            </div>
            <div className="list-actions">
              {a.status === 'pending' && (
                <button className="btn btn-outline btn-sm" onClick={() => handleWithdraw(a)}>Withdraw</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isClient = user.role === 'client';

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Welcome, {user.name} 👋</h2>
          <p className="muted">
            {isClient ? 'Client' : 'Freelancer'}
            {user.university && <> · {user.university}</>}
          </p>
        </div>
        {isClient ? (
          <Link to="/gigs/new" className="btn">+ Post a Gig</Link>
        ) : (
          <Link to="/gigs" className="btn">Browse Gigs</Link>
        )}
      </div>
      {isClient ? <ClientDashboard /> : <FreelancerDashboard />}
    </div>
  );
}
