export default function DashboardLoading() {
    return (
        <div className="flex-1 p-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-200 rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
    );
}
