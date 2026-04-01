import SnapshotCard from '@/components/financial/snapshot-card';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Your business launchpad overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-700">Roadmap Progress</h3>
          <p className="text-3xl font-bold text-brand-600 mt-2">0 / 12</p>
          <p className="text-sm text-gray-500 mt-1">steps completed</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700">Funding Matches</h3>
          <p className="text-3xl font-bold text-brand-600 mt-2">—</p>
          <p className="text-sm text-gray-500 mt-1">complete intake to unlock</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700">Est. Take-Home</h3>
          <p className="text-3xl font-bold text-brand-600 mt-2">—</p>
          <p className="text-sm text-gray-500 mt-1">complete intake to calculate</p>
        </div>
      </div>

      <SnapshotCard />
    </div>
  );
}
