import DocumentPicker from '@/components/starter-kit/document-picker';

export default function StarterKitPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Starter Document Kit</h1>
        <p className="text-gray-500 mt-1">
          Generate bilingual (FR/EN) contracts, invoices, and other essential
          documents pre-filled with your business details.
        </p>
      </div>
      <DocumentPicker />
    </div>
  );
}
