'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DocumentPreview from './document-preview';

const DOCUMENT_TYPES = [
  {
    id: 'contract',
    label: 'Service Contract',
    description: 'Bilingual (FR/EN) service agreement between your business and a client',
    icon: '📝',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    description: 'Professional invoice with GST/QST breakdown',
    icon: '🧾',
  },
  {
    id: 'nda',
    label: 'Non-Disclosure Agreement',
    description: 'Confidentiality agreement for partnerships and client engagements',
    icon: '🔒',
  },
];

export default function DocumentPicker() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    if (!selectedType) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: selectedType, data: {} }),
      });
      const data = await res.json();
      setGeneratedContent(data.content ?? '<!-- No content generated -->');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {DOCUMENT_TYPES.map((doc) => (
          <label
            key={doc.id}
            className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
              selectedType === doc.id
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="documentType"
              value={doc.id}
              checked={selectedType === doc.id}
              onChange={() => setSelectedType(doc.id)}
              className="mt-1 accent-brand-600"
            />
            <div>
              <div className="flex items-center gap-2">
                <span>{doc.icon}</span>
                <span className="font-medium text-gray-900">{doc.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>
            </div>
          </label>
        ))}
      </div>

      <Button
        onClick={generate}
        disabled={!selectedType}
        isLoading={isLoading}
      >
        Generate Document
      </Button>

      {generatedContent && (
        <DocumentPreview content={generatedContent} documentType={selectedType ?? ''} />
      )}
    </div>
  );
}
