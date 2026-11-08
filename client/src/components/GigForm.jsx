import { useState } from 'react';
import { toDateInput } from '../utils/format';

// Shared form for creating and editing a gig
export default function GigForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    budget: initial?.budget ?? '',
    tags: initial?.tags?.join(', ') || '',
    deadline: toDateInput(initial?.deadline),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the gig');
      setBusy(false);
    }
  };

  return (
    <form className="card form form-wide" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <label htmlFor="title">Title</label>
      <input id="title" name="title" value={form.title} onChange={handleChange}
        placeholder="e.g. Design a poster for our society event" maxLength={100} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" rows={6} value={form.description}
        onChange={handleChange} placeholder="Describe the task, what you expect and any requirements"
        maxLength={2000} required />

      <div className="form-row">
        <div>
          <label htmlFor="budget">Budget (Rs.)</label>
          <input id="budget" name="budget" type="number" min="0" max="1000000" value={form.budget}
            onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="deadline">Deadline (optional)</label>
          <input id="deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
        </div>
      </div>

      <label htmlFor="tags">Tags</label>
      <input id="tags" name="tags" value={form.tags} onChange={handleChange}
        placeholder="design, poster, photoshop (comma separated, max 8)" />

      <div className="form-actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
