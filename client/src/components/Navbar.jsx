import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">CampusGigs</Link>
      <div className="nav-links">
        <NavLink to="/gigs">Browse Gigs</NavLink>
        {user ? (
          <>
            {user.role === 'client' && (
              <Link to="/gigs/new" className="btn btn-sm">+ Post a Gig</Link>
            )}
            <NavLink to="/dashboard">Dashboard</NavLink>
            <span className="nav-user">{user.name}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" className="btn btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
