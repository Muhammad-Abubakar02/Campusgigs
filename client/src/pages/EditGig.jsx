import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import GigForm from '../components/GigForm';
import { errorMessage } from '../utils/format';

export default function EditGig() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/gigs/${id}`)
      .then((res) => setGig(res.data.gig))
      .catch((err) => setError(errorMessage(err, 'Could not load this gig')));
  }, [id]);

  const handleSubmit = async (form) => {
    await api.put(`/gigs/${id}`, form);
    navigate(`/gigs/${id}`);
  };

  if (error) {
    return (
      <div className="card empty">
        <h3>{error}</h3>
        <Link to="/dashboard" className="btn">Back to dashboard</Link>
      </div>
    );
  }
  if (!gig) return <p className="center-text">Loading...</p>;

  if (String(gig.postedBy?._id) !== String(user.id)) {
    return (
      <div className="card empty">
        <h3>You can only edit your own gigs</h3>
        <Link to={`/gigs/${id}`} className="btn">Back to gig</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h2>Edit Gig</h2>
      </div>
      <GigForm initial={gig} submitLabel="Save changes" onSubmit={handleSubmit}
        onCancel={() => navigate(`/gigs/${id}`)} />
    </div>
  );
}
