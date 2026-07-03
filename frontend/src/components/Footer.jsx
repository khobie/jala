export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="font-semibold text-slate-700">Artisan Koforidua</p>
          <p>Connecting clients with trusted artisans across the Koforidua Municipality.</p>
          <p>© {new Date().getFullYear()} — All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
