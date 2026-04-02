import Link from 'next/link';
import {
  MapPin,
  DollarSign,
  BarChart3,
  MessageSquare,
  FileText,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ─── Data ───────────────────────────────────────────────

const personas = [
  {
    name: 'Yara, 26',
    role: 'Home Pastry Chef',
    city: 'Villeray, Montréal',
    challenge: "Wants to sell baked goods from her kitchen but doesn't know where to start legally.",
    insight: '$90,000+ in funding she qualifies for',
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    tag: 'Food Business',
    tagColor: 'bg-amber-100 text-amber-800',
  },
  {
    name: 'Marcus, 23',
    role: 'Freelance Developer',
    city: 'Plateau, Montréal',
    challenge: "Thinks he's \"just doing side work.\" About to miss QPP registrations and owe back taxes.",
    insight: '12.8% QPP surprise coming at year-end',
    gradient: 'from-brand-50 to-teal-50',
    border: 'border-brand-200',
    tag: 'Freelancer',
    tagColor: 'bg-brand-100 text-brand-800',
  },
  {
    name: 'Fatima, 41',
    role: 'Future Home Daycare',
    city: 'Rosemont, Montréal',
    challenge: 'One of the most regulated micro-businesses in QC — she needs 10 steps she never knew about.',
    insight: 'STA income support program during startup',
    gradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    tag: 'Childcare',
    tagColor: 'bg-violet-100 text-violet-800',
  },
];

const stats = [
  { value: '6+', label: 'Government agencies navigated' },
  { value: '80+', label: 'Funding programs evaluated' },
  { value: '3 min', label: 'To your personalized roadmap' },
  { value: 'Free', label: 'Always' },
];

const smallFeatures: { icon: LucideIcon; label: string; description: string; color: string; bg: string }[] = [
  {
    icon: MessageSquare,
    label: 'AI Assistant',
    description: 'Ask anything about permits, taxes, or Bill 96. Grounded in official KB. Cites sources.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: FileText,
    label: 'Starter Documents',
    description: 'Bilingual contract, invoice template, business pitch — download-ready .docx.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

// ─── Bento grid (extracted to avoid JSX dynamic-component issues) ────────────

function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Roadmap — wide card */}
      <div className="md:col-span-2 card p-8 hover:shadow-card-hover hover:border-brand-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 mb-4">
          <MapPin size={20} className="text-brand-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">Legal Roadmap</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Personalized, dependency-ordered steps. Every form, fee, and deadline for your exact business.
        </p>
        <div className="flex flex-col gap-2">
          {['Register with the REQ', 'MAPAQ food permit', 'GST/QST registration', 'Open a business bank account'].map((step) => (
            <div key={step} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 size={13} className="text-brand-500 shrink-0" />
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Funding */}
      <div className="card p-6 hover:shadow-card-hover hover:border-emerald-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 mb-4">
          <DollarSign size={20} className="text-emerald-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">Funding Matcher</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          15+ Québec programs scored deterministically against your profile. No guesswork.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
          <div className="font-heading text-2xl font-bold text-emerald-700">$95K+</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">available for Yara</div>
        </div>
      </div>

      {/* Tax snapshot */}
      <div className="card p-6 hover:shadow-card-hover hover:border-blue-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 mb-4">
          <BarChart3 size={20} className="text-blue-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">Tax Snapshot</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          Real numbers: gross → GST/QST → QPP → income tax → take-home. 2026 rates.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Gross revenue', value: '$1,000/mo', cls: 'text-slate-700' },
            { label: 'Taxes + QPP', value: '−$427', cls: 'text-red-600' },
            { label: 'Take-home', value: '$573/mo', cls: 'text-brand-700 font-bold' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{row.label}</span>
              <span className={`tabular-nums ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Small features */}
      {smallFeatures.map((f) => (
        <div key={f.label} className="card p-6 hover:shadow-card-hover transition-all duration-200">
          <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${f.bg} mb-4`}>
            <f.icon size={20} className={f.color} />
          </div>
          <h3 className="font-heading text-base font-semibold text-slate-900 mb-2">{f.label}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-heading font-bold text-slate-900 text-lg">BZNS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#personas" className="hover:text-slate-900 transition-colors">Who it&apos;s for</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/login" className="btn-primary text-sm">Get started free</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            Claude Builders Hackathon · McGill 2026
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 mb-5 leading-[1.1]">
            Start your business<br />
            in Québec.{' '}
            <span className="text-brand-600">The right way.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            Navigate 6+ government agencies, 80+ funding programs, and a tax system
            that surprises every first-time entrepreneur — in plain language, in any language.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary btn-lg gap-2 group">
              Get my personalized roadmap
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/dashboard" className="btn-secondary btn-lg gap-2">
              View live demo
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="card p-5 text-center">
              <div className="font-heading text-3xl font-bold text-brand-600 mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features bento */}
        <div id="features" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">
              Everything to launch legally
            </h2>
            <p className="text-slate-500">One platform. Every step covered.</p>
          </div>
          <BentoGrid />
        </div>

        {/* Personas */}
        <div id="personas" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">
              Built for real people
            </h2>
            <p className="text-slate-500">Not hypothetical entrepreneurs — actual situations we designed for.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((p) => (
              <div key={p.name} className={`card border ${p.border} overflow-hidden`}>
                <div className={`bg-gradient-to-br ${p.gradient} px-6 pt-6 pb-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge text-xs font-semibold ${p.tagColor}`}>{p.tag}</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={11} />
                      {p.city}
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-600 font-medium">{p.role}</p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">{p.challenge}</p>
                  <div className="flex items-start gap-2 bg-white rounded-xl border border-slate-100 p-3">
                    <TrendingUp size={14} className="text-brand-600 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-slate-700">{p.insight}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-center py-14 px-8">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">Ready to launch?</h2>
          <p className="text-brand-100 mb-8 max-w-md mx-auto">
            8 questions. Your personalized Quebec business roadmap. Free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-sm"
            >
              Start now — takes 3 minutes
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-brand-400 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-brand-500 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-slate-700 text-sm">BZNS</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Not legal or financial advice. Always verify with official government sources and qualified professionals.
          </p>
          <p className="text-xs text-slate-400">Québec · 2026</p>
        </div>
      </footer>

    </div>
  );
}
