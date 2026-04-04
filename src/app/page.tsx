'use client';

import Link from "next/link";
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
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ─── Bento grid (extracted to avoid JSX dynamic-component issues) ────────────

function BentoGrid() {
  const { t } = useTranslation();

  const smallFeatures: {
    icon: LucideIcon;
    label: string;
    description: string;
    color: string;
    bg: string;
  }[] = [
    {
      icon: MessageSquare,
      label: t('home.bento.aiTitle'),
      description: t('home.bento.aiDesc'),
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: FileText,
      label: t('home.bento.docsTitle'),
      description: t('home.bento.docsDesc'),
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Roadmap — wide card */}
      <div className="md:col-span-2 card p-8 hover:shadow-card-hover hover:border-brand-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 mb-4">
          <MapPin size={20} className="text-brand-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          {t('home.bento.roadmapTitle')}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          {t('home.bento.roadmapDesc')}
        </p>
        <div className="flex flex-col gap-2">
          {[
            t('home.bento.step1'),
            t('home.bento.step2'),
            t('home.bento.step3'),
            t('home.bento.step4'),
          ].map((step) => (
            <div
              key={step}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
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
          {t('home.bento.fundingTitle')}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          {t('home.bento.fundingDesc')}
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
          <div className="font-heading text-2xl font-bold text-emerald-700">
            $95K+
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            {t('home.bento.availableFor')}
          </div>
        </div>
      </div>

      {/* Tax snapshot */}
      <div className="card p-6 hover:shadow-card-hover hover:border-blue-200 transition-all duration-200">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 mb-4">
          <BarChart3 size={20} className="text-blue-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          {t('home.bento.taxTitle')}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          {t('home.bento.taxDesc')}
        </p>
        <div className="space-y-2">
          {[
            {
              label: t('home.bento.grossRevenue'),
              value: "$1,000/mo",
              cls: "text-slate-700",
            },
            { label: t('home.bento.taxesQPP'), value: "−$427", cls: "text-red-600" },
            {
              label: t('home.bento.takeHome'),
              value: "$573/mo",
              cls: "text-brand-700 font-bold",
            },
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
        <div
          key={f.label}
          className="card p-6 hover:shadow-card-hover transition-all duration-200"
        >
          <div
            className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${f.bg} mb-4`}
          >
            <f.icon size={20} className={f.color} />
          </div>
          <h3 className="font-heading text-base font-semibold text-slate-900 mb-2">
            {f.label}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            {f.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function HomePage() {
  const { t } = useTranslation();

  const personas = [
    {
      name: t('home.personas.yara.name'),
      role: t('home.personas.yara.role'),
      city: t('home.personas.yara.city'),
      challenge: t('home.personas.yara.challenge'),
      insight: t('home.personas.yara.insight'),
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      tag: t('home.personas.yara.tag'),
      tagColor: "bg-amber-100 text-amber-800",
    },
    {
      name: t('home.personas.marcus.name'),
      role: t('home.personas.marcus.role'),
      city: t('home.personas.marcus.city'),
      challenge: t('home.personas.marcus.challenge'),
      insight: t('home.personas.marcus.insight'),
      gradient: "from-brand-50 to-teal-50",
      border: "border-brand-200",
      tag: t('home.personas.marcus.tag'),
      tagColor: "bg-brand-100 text-brand-800",
    },
    {
      name: t('home.personas.fatima.name'),
      role: t('home.personas.fatima.role'),
      city: t('home.personas.fatima.city'),
      challenge: t('home.personas.fatima.challenge'),
      insight: t('home.personas.fatima.insight'),
      gradient: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      tag: t('home.personas.fatima.tag'),
      tagColor: "bg-violet-100 text-violet-800",
    },
  ];

  const stats = [
    { value: "6+", label: t('home.stats.agencies') },
    { value: "80+", label: t('home.stats.programs') },
    { value: "3 min", label: t('home.stats.time') },
    { value: "Free", label: t('home.stats.price') },
  ];

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
              {t('home.features')}
            </a>
            <a
              href="#personas"
              className="hover:text-slate-900 transition-colors"
            >
              {t('home.whoFor')}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              {t('home.signIn')}
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              {t('home.getStartedFree')}
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 mb-5 leading-[1.1]">
            {t('home.heroTitle1')}
            <br />
            {t('home.heroTitle2')} <span className="text-brand-600">{t('home.heroTitle3')}</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary btn-lg gap-2 group">
              {t('home.getRoadmap')}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link href="/dashboard" className="btn-secondary btn-lg gap-2">
              {t('home.viewDemo')}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="card p-5 text-center">
              <div className="font-heading text-3xl font-bold text-brand-600 mb-1">
                {s.value}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features bento */}
        <div id="features" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">
              {t('home.everythingToLaunch')}
            </h2>
            <p className="text-slate-500">{t('home.onePlatform')}</p>
          </div>
          <BentoGrid />
        </div>

        {/* Personas */}
        <div id="personas" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-slate-900 mb-2">
              {t('home.builtForReal')}
            </h2>
            <p className="text-slate-500">
              {t('home.builtForRealSub')}
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
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">{p.role}</p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {p.challenge}
                  </p>
                  <div className="flex items-start gap-2 bg-white rounded-xl border border-slate-100 p-3">
                    <TrendingUp
                      size={14}
                      className="text-brand-600 mt-0.5 shrink-0"
                    />
                    <p className="text-xs font-medium text-slate-700">
                      {p.insight}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-center py-14 px-8">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            {t('home.readyToLaunch')}
          </h2>
          <p className="text-brand-100 mb-8 max-w-md mx-auto">
            {t('home.readyToLaunchSub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-sm"
            >
              {t('home.startNow')}
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-brand-400 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-brand-500 transition-colors text-sm"
            >
              {t('home.signIn')}
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
            <span className="font-heading font-semibold text-slate-700 text-sm">
              BZNS
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            {t('home.disclaimer')}
          </p>
          <p className="text-xs text-slate-400">Québec · 2026</p>
        </div>
      </footer>
    </div>
  );
}
