import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-brand-700 tracking-tight">
            BZNS
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered micro-business launchpad for Quebec entrepreneurs.
          </p>
          <p className="text-gray-500">
            Get a personalised registration roadmap, funding matches, tax
            snapshot, and compliance checklist — powered by Claude AI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/intake"
            className="btn-primary text-center text-lg px-8 py-3"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="border border-brand-600 text-brand-600 px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors font-medium text-lg text-center"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8">
          {[
            { icon: '🗺️', label: 'Registration Roadmap' },
            { icon: '💰', label: 'Funding Matches' },
            { icon: '📊', label: 'Tax Snapshot' },
            { icon: '✅', label: 'Compliance Checklist' },
            { icon: '🤖', label: 'AI Assistant' },
            { icon: '📄', label: 'Starter Documents' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="card text-center py-4"
            >
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-sm font-medium text-gray-700">
                {feature.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
