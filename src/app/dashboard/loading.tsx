export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-black/30 border-t-black animate-spin" />
        <p className="text-gray-700 text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
