import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card empty">
      <h2>404 — Page not found</h2>
      <p className="muted">The page you are looking for does not exist or was moved.</p>
      <div className="form-actions" style={{ justifyContent: 'center' }}>
        <Link to="/" className="btn">Go home</Link>
        <Link to="/gigs" className="btn btn-outline">Browse Gigs</Link>
      </div>
    </div>
  );
}
