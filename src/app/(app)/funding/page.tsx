import FundingList from '@/components/funding/funding-list';

export default function FundingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funding Matches</h1>
        <p className="text-gray-500 mt-1">
          Grants, loans, and programs matched to your business profile.
        </p>
      </div>
      <FundingList />
    </div>
  );
}
