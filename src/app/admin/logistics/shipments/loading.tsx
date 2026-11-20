export default function ShipmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[var(--admin-hover)]" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
        <div className="h-24 rounded-2xl bg-[var(--admin-hover)]" />
      </div>
      <div className="h-72 rounded-2xl bg-[var(--admin-hover)]" />
    </div>
  );
}
