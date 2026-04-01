'use client';

import { useEffect, useState } from 'react';
import FundingCard from './funding-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { FundingMatch } from '@/types/funding';

export default function FundingList() {
  const [matches, setMatches] = useState<FundingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/funding');
        const data = await res.json();
        setMatches(data.matches ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">💰</p>
        <p className="font-medium">No funding matches yet</p>
        <p className="text-sm mt-1">Complete your business profile to see personalised funding matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <FundingCard key={match.programId} match={match} />
      ))}
    </div>
  );
}
