import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';
import { errorMessage } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'budget_high', label: 'Budget: high to low' },
  { value: 'budget_low', label: 'Budget: low to high' },
];

export default function Gigs() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const tag = params.get('tag') || '';
  const minBudget = params.get('minBudget') || '';
  const maxBudget = params.get('maxBudget') || '';
  const sort = params.get('sort') || 'newest';
  const page = parseInt(params.get('page'), 10) || 1;

  const [draft, setDraft] = useState({ q, minBudget, maxBudget });
  const [data, setData] = useState({ gigs: [], total: 0, pages: 1, page: 1 });
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // keep the form in sync when the URL changes (back button, tag click, clear)
  useEffect(() => {
    setDraft({ q, minBudget, maxBudget });
  }, [q, minBudget, maxBudget]);

  useEffect(() => {
    api.get('/gigs/tags').then((res) => setAllTags(res.data.tags)).catch(() => {});
  }, []);

  const query = params.toString();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get(`/gigs?${query}`)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load gigs')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  // update one or more URL params; page resets to 1 unless told otherwise
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([k, v]) => {
      if (v === '' || v == null || (k === 'sort' && v === 'newest') || (k === 'page' && Number(v) <= 1)) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    update({ q: draft.q.trim(), minBudget: draft.minBudget, maxBudget: draft.maxBudget });
  };

  const activeTags = tag ? tag.split(',').filter(Boolean) : [];
  const toggleTag = (t) => {
    const next = activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t];
    update({ tag: next.join(',') });
  };

  const hasFilters = q || tag || minBudget || maxBudget;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Browse Gigs</h2>
          <p className="muted">
            {loading ? 'Loading...' : `${data.total} open gig${data.total === 1 ? '' : 's'}${hasFilters ? (data.total === 1 ? ' matches' : ' match') + ' your filters' : ''}`}
          </p>
        </div>
        {user?.role === 'client' && <Link to="/gigs/new" className="btn">+ Post a Gig</Link>}
      </div>

      <form className="filters card" onSubmit={handleSearch}>
        <div className="filters-row">
          <input
            type="search"
            aria-label="Search gigs"
            placeholder="Search by title, description or tag..."
            value={draft.q}
            maxLength={100}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
          <button className="btn">Search</button>
        </div>
        <div className="filters-row">
          <input
            type="number" min="0" aria-label="Minimum budget" placeholder="Min budget (Rs.)"
            value={draft.minBudget} onChange={(e) => setDraft({ ...draft, minBudget: e.target.value })}
          />
          <input
            type="number" min="0" aria-label="Maximum budget" placeholder="Max budget (Rs.)"
            value={draft.maxBudget} onChange={(e) => setDraft({ ...draft, maxBudget: e.target.value })}
          />
          <select aria-label="Sort gigs" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-outline" onClick={() => setParams(new URLSearchParams())}>
              Clear filters
            </button>
          )}
        </div>
        {(allTags.length > 0 || activeTags.length > 0) && (
          <div className="tag-filter">
            <span className="muted">Tags:</span>
            {[...new Set([...activeTags, ...allTags.map((t) => t.tag)])].map((t) => (
              <button
                type="button" key={t}
                className={`chip chip-btn ${activeTags.includes(t) ? 'chip-active' : ''}`}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {!loading && !error && data.gigs.length === 0 && (
        <div className="card empty">
          <h3>{hasFilters ? 'No gigs match your filters' : 'No open gigs yet'}</h3>
          <p className="muted">
            {hasFilters ? 'Try a different search or clear the filters.' : 'Check back soon, or post the first one if you are a client.'}
          </p>
        </div>
      )}

      <div className="grid">
        {data.gigs.map((g) => (
          <GigCard key={g._id} gig={g} />
        ))}
      </div>

      {data.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 })}>
            ← Previous
          </button>
          <span className="muted">Page {data.page} of {data.pages}</span>
          <button className="btn btn-outline btn-sm" disabled={data.page >= data.pages} onClick={() => update({ page: data.page + 1 })}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
