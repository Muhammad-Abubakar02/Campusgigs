import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // poll the unread-message count while logged in
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }
    let cancelled = false;
    const load = () =>
      api.get('/messages/unread-count').then((res) => !cancelled && setUnread(res.data.count)).catch(() => {});
    load();
    const timer = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]);

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
            <NavLink to="/messages">
              Messages{unread > 0 && <span className="unread-dot">{unread}</span>}
            </NavLink>
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
