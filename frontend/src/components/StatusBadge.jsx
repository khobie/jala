const styles = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-rose-100 text-rose-700',
};

export default function StatusBadge({ status }) {
  return <span className={`badge capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
