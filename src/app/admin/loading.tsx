export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-[var(--admin-hover)]" />
        <div className="h-4 w-72 max-w-full rounded-lg bg-[var(--admin-hover)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
      </div>
      <div className="h-80 rounded-2xl bg-[var(--admin-hover)]" />
    </div>
  );
}
