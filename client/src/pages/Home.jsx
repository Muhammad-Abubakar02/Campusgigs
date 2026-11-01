import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="hero">
      <h1>Find student talent. Offer your skills.</h1>
      <p>
        CampusGigs is a micro-freelance marketplace for university students: design, video editing,
        notes and more.
      </p>
      {user ? (
        <Link to="/dashboard" className="btn">Go to Dashboard</Link>
      ) : (
        <Link to="/register" className="btn">Get started</Link>
      )}
    </div>
  );
}
