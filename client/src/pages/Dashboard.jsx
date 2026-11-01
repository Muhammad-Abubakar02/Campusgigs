import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h2>Welcome, {user.name} 👋</h2>
      <p className="muted">
        Role: <b>{user.role}</b>
        {user.university && <> · {user.university}</>}
      </p>
      <p>
        {user.role === 'client'
          ? 'Gig posting and applicant tracking are coming in the next modules.'
          : 'Browsing and applying to gigs are coming in the next modules.'}
      </p>
    </div>
  );
}
