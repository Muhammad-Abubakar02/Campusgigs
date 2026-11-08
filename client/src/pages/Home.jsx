import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';

const CATEGORIES = ['Graphic design', 'Video editing', 'Notes & typing', 'Presentations', 'Web help', 'Tutoring'];

const STEPS = [
  { n: '1', title: 'Create your account', text: 'Sign up as a client to hire, or as a freelancer to offer your skills.' },
  { n: '2', title: 'Post or find a gig', text: 'Clients describe the task and budget. Freelancers browse open gigs on campus.' },
  { n: '3', title: 'Apply and get started', text: 'Send a short note with your price and track every application from your dashboard.' },
];

export default function Home() {
  const { user } = useAuth();
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    api.get('/gigs').then((res) => setLatest(res.data.gigs.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <span className="hero-pill">Made for university students</span>
        <h1>Find student talent.<br />Offer your skills.</h1>
        <p>
          CampusGigs is a micro-freelance marketplace where students hire each other for design,
          video editing, notes and more, right on campus.
        </p>
        <div className="hero-actions">
          <Link to="/gigs" className="btn btn-lg">Browse Gigs</Link>
          {user ? (
            <Link to={user.role === 'client' ? '/gigs/new' : '/dashboard'} className="btn btn-outline btn-lg">
              {user.role === 'client' ? 'Post a Gig' : 'My Dashboard'}
            </Link>
          ) : (
            <Link to="/register" className="btn btn-outline btn-lg">Get started free</Link>
          )}
        </div>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step card">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section">
          <div className="page-head">
            <h2 className="section-title">Latest gigs</h2>
            <Link to="/gigs">View all →</Link>
          </div>
          <div className="grid">
            {latest.map((g) => (
              <GigCard key={g._id} gig={g} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
