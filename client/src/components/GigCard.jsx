import { Link } from 'react-router-dom';
import { formatBudget, formatDate } from '../utils/format';

export default function GigCard({ gig }) {
  const desc = gig.description.length > 130 ? gig.description.slice(0, 130) + '…' : gig.description;
  return (
    <Link to={`/gigs/${gig._id}`} className="gig-card">
      <div className="gig-card-top">
        <h3>{gig.title}</h3>
        <span className="budget">{formatBudget(gig.budget)}</span>
      </div>
      <p className="gig-desc">{desc}</p>
      <div className="tags">
        {gig.tags.map((t) => (
          <span key={t} className="tag">#{t}</span>
        ))}
      </div>
      <div className="gig-meta">
        <span>
          {gig.postedBy?.name || 'Unknown'}
          {gig.postedBy?.university ? ` · ${gig.postedBy.university}` : ''}
        </span>
        {gig.deadline && <span>Due {formatDate(gig.deadline)}</span>}
      </div>
    </Link>
  );
}
