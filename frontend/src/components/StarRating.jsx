export default function StarRating({ value = 0, count, size = 'sm', onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const dim = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const interactive = typeof onChange === 'function';

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {stars.map((s) => (
          <svg
            key={s}
            onClick={interactive ? () => onChange(s) : undefined}
            className={`${dim} ${interactive ? 'cursor-pointer' : ''} ${
              s <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0L5.27 18.6c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.17 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L9.05 2.93z" />
          </svg>
        ))}
      </span>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-500">
          {value ? Number(value).toFixed(1) : '0.0'} ({count})
        </span>
      )}
    </span>
  );
}
