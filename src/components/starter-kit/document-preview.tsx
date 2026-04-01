'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';

interface DocumentPreviewProps {
  content: string;
  documentType: string;
}

export default function DocumentPreview({ content, documentType }: DocumentPreviewProps) {
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bzns_${documentType}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Preview</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            Download
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-96 overflow-y-auto">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>
    </Card>
  );
}
