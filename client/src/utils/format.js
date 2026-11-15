export const CURRENCY = 'Rs.';

export const formatBudget = (n) => `${CURRENCY} ${Number(n || 0).toLocaleString('en-PK')}`;

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return formatDate(d);
};
