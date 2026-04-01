import RoadmapList from '@/components/roadmap/roadmap-list';

export default function RoadmapPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Roadmap</h1>
        <p className="text-gray-500 mt-1">
          Step-by-step guide to registering and launching your business in
          Quebec.
        </p>
      </div>
      <RoadmapList />
    </div>
  );
}
