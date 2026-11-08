import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { errorMessage, formatBudget, formatDate } from '../utils/format';

export default function GigDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [gig, setGig] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ coverNote: '', proposedPrice: '' });
  const [busy, setBusy] = useState(false);

  const isFreelancer = user?.role === 'freelancer';
  const isOwner = !!user && !!gig && String(gig.postedBy?._id) === String(user.id);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/gigs/${id}`)
      .then((res) => !cancelled && setGig(res.data.gig))
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Could not load this gig')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!isFreelancer) return;
    api
      .get(`/gigs/${id}/application`)
      .then((res) => setApplication(res.data.application))
      .catch(() => {});
  }, [id, isFreelancer]);

  const bumpCount = (delta) =>
    setGig((g) => ({ ...g, applicantsCount: Math.max(0, (g.applicantsCount || 0) + delta) }));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleApply = async (e) => {
    e.preventDefault();
    setActionError('');
    setBusy(true);
    try {
      const res = await api.post(`/gigs/${id}/apply`, form);
      setApplication(res.data.application);
      bumpCount(1);
      setNotice('Your application has been sent.');
    } catch (err) {
      setActionError(errorMessage(err, 'Could not send your application'));
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw your application?')) return;
    setActionError('');
    try {
      await api.delete(`/applications/${application._id}`);
      setApplication(null);
      bumpCount(-1);
      setNotice('Application withdrawn.');
    } catch (err) {
      setActionError(errorMessage(err, 'Could not withdraw the application'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this gig and all its applications? This cannot be undone.')) return;
    try {
      await api.delete(`/gigs/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setActionError(errorMessage(err, 'Could not delete the gig'));
    }
  };

  if (loading) return <p className="center-text">Loading...</p>;
  if (loadError) {
    return (
      <div className="card empty">
        <h3>{loadError}</h3>
        <Link to="/gigs" className="btn">Back to gigs</Link>
      </div>
    );
  }

  return (
    <div className="details">
      <Link to="/gigs" className="back-link">← All gigs</Link>

      <div className="card">
        <div className="details-head">
          <div>
            <h2>{gig.title}</h2>
            <p className="muted">
              Posted by <b>{gig.postedBy?.name || 'Unknown'}</b>
              {gig.postedBy?.university ? ` · ${gig.postedBy.university}` : ''}
            </p>
          </div>
          <div className="details-side">
            <span className="budget budget-lg">{formatBudget(gig.budget)}</span>
            <StatusBadge status={gig.status} />
          </div>
        </div>

        <div className="tags">
          {gig.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>

        <p className="description">{gig.description}</p>

        <div className="facts">
          <span>👥 {gig.applicantsCount} applicant{gig.applicantsCount === 1 ? '' : 's'}</span>
          {gig.deadline && <span>⏰ Due {formatDate(gig.deadline)}</span>}
          <span>📅 Posted {formatDate(gig.createdAt)}</span>
        </div>

        {isOwner && (
          <div className="form-actions">
            <Link to={`/gigs/${gig._id}/edit`} className="btn">Edit gig</Link>
            <button className="btn btn-danger" onClick={handleDelete}>Delete gig</button>
          </div>
        )}
      </div>

      {notice && <p className="success">{notice}</p>}
      {actionError && <p className="error">{actionError}</p>}

      {!isOwner && (
        <div className="card apply-box">
          {!user && (
            <>
              <h3>Interested in this gig?</h3>
              <p className="muted">Log in as a freelancer to apply.</p>
              <Link to="/login" state={{ from: location }} className="btn">Login to apply</Link>
            </>
          )}

          {user && !isFreelancer && (
            <p className="muted">Only freelancer accounts can apply to gigs.</p>
          )}

          {isFreelancer && application && (
            <>
              <h3>You applied to this gig</h3>
              <p className="muted">
                Status: <StatusBadge status={application.status} />
                {application.proposedPrice != null && <> · Your price: <b>{formatBudget(application.proposedPrice)}</b></>}
              </p>
              {application.coverNote && <p className="description">“{application.coverNote}”</p>}
              {application.status === 'pending' && (
                <button className="btn btn-outline" onClick={handleWithdraw}>Withdraw application</button>
              )}
            </>
          )}

          {isFreelancer && !application && gig.status !== 'open' && (
            <p className="muted">This gig is no longer accepting applications.</p>
          )}

          {isFreelancer && !application && gig.status === 'open' && (
            <form className="form" onSubmit={handleApply}>
              <h3>Apply to this gig</h3>
              <label htmlFor="coverNote">Cover note</label>
              <textarea id="coverNote" name="coverNote" rows={4} maxLength={1000} value={form.coverNote}
                onChange={handleChange} placeholder="Why are you a good fit? Share past work or experience." />
              <label htmlFor="proposedPrice">Your price (Rs.) <span className="muted">optional</span></label>
              <input id="proposedPrice" name="proposedPrice" type="number" min="0" max="1000000"
                value={form.proposedPrice} onChange={handleChange} />
              <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send application'}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
