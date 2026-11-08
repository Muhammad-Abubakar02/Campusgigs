export const CURRENCY = 'Rs.';

export const formatBudget = (n) => `${CURRENCY} ${Number(n || 0).toLocaleString('en-PK')}`;

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;
