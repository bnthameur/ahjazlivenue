export default function Loading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="h-16 border-b border-slate-100" />
            <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
                <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-100 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
