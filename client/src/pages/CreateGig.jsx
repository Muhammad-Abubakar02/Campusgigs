import { useNavigate } from 'react-router-dom';
import api from '../api';
import GigForm from '../components/GigForm';

export default function CreateGig() {
  const navigate = useNavigate();

  const handleSubmit = async (form) => {
    const res = await api.post('/gigs', form);
    navigate(`/gigs/${res.data.gig._id}`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Post a Gig</h2>
          <p className="muted">Describe the task and students can apply to it.</p>
        </div>
      </div>
      <GigForm submitLabel="Post gig" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
