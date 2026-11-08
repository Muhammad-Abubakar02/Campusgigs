import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';
import { errorMessage } from '../utils/format';

export default function Gigs() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/gigs')
      .then((res) => setGigs(res.data.gigs))
      .catch((err) => setError(errorMessage(err, 'Could not load gigs')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Browse Gigs</h2>
          <p className="muted">{loading ? 'Loading...' : `${gigs.length} open gig${gigs.length === 1 ? '' : 's'}`}</p>
        </div>
        {user?.role === 'client' && <Link to="/gigs/new" className="btn">+ Post a Gig</Link>}
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && !error && gigs.length === 0 && (
        <div className="card empty">
          <h3>No open gigs yet</h3>
          <p className="muted">Check back soon, or post the first one if you are a client.</p>
        </div>
      )}

      <div className="grid">
        {gigs.map((g) => (
          <GigCard key={g._id} gig={g} />
        ))}
      </div>
    </div>
  );
}
