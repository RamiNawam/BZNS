'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ExpenseInput from './expense-input';
import TakeHomeBreakdown from './take-home-breakdown';
import WatchOutFlags from './watch-out-flags';
import Button from '@/components/ui/button';
import type { FinancialSnapshot } from '@/types/financial';

export default function SnapshotCard() {
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function calculate() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/financial-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grossRevenue, expenses }),
      });
      const data = await res.json();
      setSnapshot(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Snapshot</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Estimate your take-home pay after taxes, QPP, and QPIP.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ExpenseInput
            label="Gross Revenue (CAD)"
            value={grossRevenue}
            onChange={setGrossRevenue}
          />
          <ExpenseInput
            label="Business Expenses (CAD)"
            value={expenses}
            onChange={setExpenses}
          />
        </div>
        <Button onClick={calculate} isLoading={isLoading}>
          Calculate
        </Button>
        {snapshot && (
          <div className="space-y-4 pt-2">
            <TakeHomeBreakdown snapshot={snapshot} />
            <WatchOutFlags warnings={snapshot.warnings ?? []} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
