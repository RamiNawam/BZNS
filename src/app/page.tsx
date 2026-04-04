import Link from "next/link";
import {
  MapPin,
  DollarSign,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── Data ───────────────────────────────────────────────

const personas = [
  {
    name: "Yara, 26",
    role: "Home Pastry Chef",
    city: "Villeray, Montréal",
    challenge:
      "Wants to sell baked goods from her kitchen but doesn't know where to start legally.",
    insight: "6 funding programs matched — BDC, Futurpreneur, FLI and more",
    gradient: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    tag: "Food Business",
    tagColor: "bg-amber-100 text-amber-800",
    avatarBg: "bg-amber-200",
    avatarText: "text-amber-800",
    avatarInitial: "Y",
  },
  {
    name: "Marcus, 23",
    role: "Freelance Developer",
    city: "Plateau, Montréal",
    challenge:
      'Thinks he\'s "just doing side work." About to miss QPP registrations and owe back taxes.',
    insight: "12.8% QPP surprise coming at year-end",
    gradient: "from-brand-50 to-teal-50",
    border: "border-brand-200",
    tag: "Freelancer",
    tagColor: "bg-brand-100 text-brand-800",
    avatarBg: "bg-brand-200",
    avatarText: "text-brand-800",
    avatarInitial: "M",
  },
  {
    name: "Fatima, 41",
    role: "Future Home Daycare",
    city: "Rosemont, Montréal",
    challenge:
      "One of the most regulated micro-businesses in QC — she needs 10 steps she never knew about.",
    insight: "STA income support program during startup",
    gradient: "from-violet-50 to-purple-50",
    border: "border-violet-200",
    tag: "Childcare",
    tagColor: "bg-violet-100 text-violet-800",
    avatarBg: "bg-violet-200",
    avatarText: "text-violet-800",
    avatarInitial: "F",
  },
];

const stats = [
  { value: "6+", label: "Government agencies navigated" },
  { value: "12+", label: "Funding programs evaluated" },
  { value: "1 min", label: "To your personalized roadmap" },
  { value: "Free", label: "Always" },
];

const howItWorks = [
  {
    title: "Tell us about your idea",
    desc: "8 plain-language questions. No jargon. Takes 1 minute.",
  },
  {
    title: "Get your personalized plan",
    desc: "AI generates your legal roadmap, funding matches, and tax snapshot instantly.",
  },
  {
    title: "Launch step by step",
    desc: "Every step has the exact form, fee, government link, and deadline. Nothing is vague.",
  },
];

// ─── Hero preview card ───────────────────────────────────────────────────────

function HeroPreviewCard() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-brand-400 rounded-full scale-90 translate-y-6" />
      <div className="card p-6 shadow-card-hover md:rotate-1">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            Your Roadmap — Food Business
          </span>
          <span className="text-xs text-slate-400 tabular-nums">2/7 steps</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full mb-5">
          <div
            className="h-1.5 bg-brand-500 rounded-full"
            style={{ width: "28.5%" }}
          />
        </div>
        <div className="flex flex-col gap-2.5 mb-5">
          {[
            { label: "Register with the REQ", done: true },
            { label: "MAPAQ food handler permit", done: true },
            { label: "GST/QST registration", done: false },
            { label: "Open business bank account", done: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 text-xs">
              <CheckCircle2
                size={13}
                className={
                  s.done ? "text-brand-500 shrink-0" : "text-slate-300 shrink-0"
                }
              />
              <span
                className={
                  s.done ? "text-slate-500 line-through" : "text-slate-600"
                }
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <DollarSign size={14} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700">
            6 funding programs matched
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Bento grid (extracted to avoid JSX dynamic-component issues) ────────────

function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Roadmap — wide card */}
      <div className="md:col-span-2 card border-t-2 border-t-brand-500 p-8 hover:shadow-card-hover hover:border-brand-300 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 mb-4">
          <MapPin size={20} className="text-brand-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          Legal Roadmap
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Personalized, dependency-ordered steps. Every form, fee, and deadline
          for your exact business.
        </p>
        <div className="flex flex-col gap-2">
          {[
            "Register with the REQ",
            "MAPAQ food permit",
            "GST/QST registration",
            "Open a business bank account",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
            >
              <span className="text-brand-600 font-mono font-bold w-5 shrink-0">
                0{i + 1}
              </span>
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
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          Funding Matcher
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          15+ Québec programs scored deterministically against your profile. No
          guesswork.
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { name: "BDC Micro-loan", amount: "Up to $100,000" },
            { name: "Futurpreneur Canada", amount: "Up to $75,000" },
            { name: "FLI — Local Fund", amount: "Up to $50,000" },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs"
            >
              <span className="font-medium text-slate-700">{p.name}</span>
              <span className="text-emerald-700 font-semibold tabular-nums">
                {p.amount}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-emerald-500 font-medium text-center mt-1.5">
          + 5 more programs evaluated
        </div>
      </div>

      {/* Tax snapshot */}
      <div className="card p-6 hover:shadow-card-hover hover:border-blue-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 mb-4">
          <BarChart3 size={20} className="text-blue-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          Tax Snapshot
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          Real numbers: gross → GST/QST → QPP → income tax → take-home. 2026
          rates.
        </p>
        <div className="space-y-2">
          {[
            {
              label: "Gross revenue",
              value: "$1,000/mo",
              cls: "text-slate-700",
              divider: false,
            },
            {
              label: "Taxes + QPP",
              value: "−$427",
              cls: "text-red-600",
              divider: false,
            },
            {
              label: "Take-home",
              value: "$573/mo",
              cls: "text-brand-700 font-bold",
              divider: true,
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex justify-between text-xs ${row.divider ? "border-t border-slate-100 pt-2 mt-2" : ""}`}
            >
              <span className="text-slate-500">{row.label}</span>
              <span className={`tabular-nums ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-300 mt-2">
          2026 QC rates · GST/QST + QPP included
        </p>
      </div>

      {/* AI Assistant — wide card */}
      <div className="md:col-span-2 card p-6 hover:shadow-card-hover transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-violet-50 mb-4">
          <MessageSquare size={20} className="text-violet-600" />
        </div>
        <h3 className="font-heading text-base font-semibold text-slate-900 mb-2">
          AI Assistant — always within reach
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          Ask anything about permits, taxes, or Bill 96. Grounded in official
          Québec sources. Cites links. Refers you to professionals when out of
          scope.
        </p>
        <div className="bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
          <p className="text-xs italic text-violet-600 mb-1">
            &ldquo;Can I sell food from home without a commercial
            kitchen?&rdquo;
          </p>
          <p className="text-xs font-medium text-violet-800">
            → Yes — under MAPAQ&apos;s home kitchen exemption for &lt;$25K/year.
            Here&apos;s the exact form...
          </p>
        </div>
      </div>
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
            <span className="font-heading font-bold text-slate-900 text-lg">
              BZNS
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#personas"
              className="hover:text-slate-900 transition-colors"
            >
              Who it&apos;s for
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        {/* Hero */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-16">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 text-xs font-medium text-brand-700 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              Built for Québec entrepreneurs
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 mb-5 leading-[1.1]">
              Start your business
              <br />
              in Québec.{" "}
              <span className="text-brand-600">The right way.</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
              Navigate 6+ government agencies, 80+ funding programs, and a tax
              system that surprises every first-time entrepreneur — in plain
              language, in any language.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/login" className="btn-primary btn-lg gap-2 group">
                Get my personalized roadmap
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link href="/dashboard" className="btn-secondary btn-lg">
                View live demo
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-brand-400" /> No credit
                card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-brand-400" /> Français
                &amp; English
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-brand-400" /> Always
                free
              </span>
            </div>
          </div>
          {/* Right — product preview, hidden on mobile */}
          <div className="hidden md:block">
            <HeroPreviewCard />
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-card grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <div
                className={`font-heading text-3xl md:text-4xl font-bold tabular-nums mb-1 ${
                  s.value === "Free" ? "text-brand-600" : "text-slate-900"
                }`}
              >
                {s.value}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">
              Launch in 3 steps
            </h2>
            <p className="text-slate-500">
              No lawyers. No accountants. No confusion.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-0">
            {howItWorks.map((step, i) => (
              <div
                key={step.title}
                className="flex-1 flex flex-col items-center text-center relative px-6"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute left-[calc(50%+2.5rem)] right-0 top-[1.1rem] border-t border-dashed border-slate-200" />
                )}
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white font-heading font-bold text-sm flex items-center justify-center mb-4 relative z-10 shrink-0">
                  {i + 1}
                </div>
                <h3 className="font-heading font-semibold text-slate-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
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
            <p className="text-slate-500">
              Not hypothetical entrepreneurs — actual situations we designed
              for.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((p) => (
              <div
                key={p.name}
                className={`card border ${p.border} overflow-hidden`}
              >
                <div
                  className={`bg-gradient-to-br ${p.gradient} px-6 pt-6 pb-4`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`badge text-xs font-semibold ${p.tagColor}`}
                    >
                      {p.tag}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={11} />
                      {p.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full ${p.avatarBg} flex items-center justify-center font-heading font-bold ${p.avatarText} text-sm shrink-0`}
                    >
                      {p.avatarInitial}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-slate-900">
                        {p.name}
                      </h3>
                      <p className="text-sm text-slate-600 font-medium">
                        {p.role}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    &ldquo;{p.challenge}&rdquo;
                  </p>
                  <div className="flex items-start gap-2 bg-gradient-to-r from-brand-50 to-transparent border-l-2 border-brand-400 pl-3 py-2 rounded-r-xl">
                    <Sparkles
                      size={13}
                      className="text-brand-500 mt-0.5 shrink-0"
                    />
                    <p className="text-xs font-semibold text-brand-700">
                      {p.insight}
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    See their roadmap <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official sources proof bar */}
        <div className="border-y border-slate-100 py-8 mb-8 text-center">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            Grounded in official sources
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Revenu Québec",
              "REQ",
              "MAPAQ",
              "Services Québec",
              "BDCQ",
            ].map((src) => (
              <span
                key={src}
                className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {src}
              </span>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-center py-14 px-8">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            Ready to launch?
          </h2>
          <p className="text-brand-100 mb-8 max-w-md mx-auto">
            8 questions. Your personalized Quebec business roadmap. Free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-sm"
            >
              Start now — takes 1 minute
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-brand-400 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-brand-500 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="text-brand-300 text-xs text-center mt-4">
            8 questions · 1 minute · Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-slate-700 text-sm">
              BZNS
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Not legal or financial advice. Always verify with official
            government sources and qualified professionals.
          </p>
          <p className="text-xs text-slate-400">Québec · 2026</p>
        </div>
      </footer>
    </div>
  );
}
