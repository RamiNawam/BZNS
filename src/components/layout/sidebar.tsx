"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Map,
  DollarSign,
  BarChart3,
  LogOut,
  Settings,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfileStore } from "@/stores/profile-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

const financialSubItems = [
  { hash: "fin-section-insight", label: "Financial Insight" },
  { hash: "fin-section-glance", label: "Numbers" },
  { hash: "fin-section-tax", label: "Taxes" },
  { hash: "fin-section-charts", label: "Outlook" },
  { hash: "fin-section-ops", label: "Operations" },
  { hash: "fin-section-planning", label: "Planning" },
  { hash: "fin-section-deductions", label: "Deductions" },
  { hash: "fin-section-risks", label: "Next Steps" },
];

const navItems: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/roadmap", labelKey: "nav.roadmap", icon: Map },
  { href: "/funding", labelKey: "nav.funding", icon: DollarSign },
  { href: "/financial", labelKey: "nav.finances", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearProfile } = useProfileStore();
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isFinancialActive =
    pathname === "/financial" || pathname.startsWith("/financial/");
  const [financialOpen, setFinancialOpen] = useState(isFinancialActive);

  useEffect(() => {
    setFinancialOpen(isFinancialActive);
  }, [isFinancialActive]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    clearProfile();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-slate-200">
        <Link href="/">
          <img src="/BZNS.png" alt="BZNS" className="h-10 object-contain" />
        </Link>
        <div>
          <div className="text-[10px] text-slate-800 font-medium leading-tight mt-0.5">
            {t("brand.tagline")}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isFinancial = item.href === "/financial";
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          if (isFinancial) {
            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isFinancialActive) {
                      router.push("/financial");
                    }
                    setFinancialOpen((prev) => !prev);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
                    isFinancialActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      isFinancialActive
                        ? "text-brand-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{t(item.labelKey)}</span>
                  <ChevronDown
                    size={14}
                    className={`ml-auto shrink-0 text-slate-400 transition-transform duration-200 ${
                      financialOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {financialOpen && (
                  <div className="ml-8 mt-0.5 space-y-0.5">
                    {financialSubItems.map((sub) => (
                      <button
                        key={sub.hash}
                        type="button"
                        onClick={() => {
                          if (!isFinancialActive) {
                            router.push(`/financial#${sub.hash}`);
                          } else {
                            document
                              .getElementById(sub.hash)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={17}
                className={`shrink-0 transition-colors ${
                  isActive
                    ? "text-brand-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>{t(item.labelKey)}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
            pathname === "/settings"
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings
            size={17}
            className={`shrink-0 transition-colors ${
              pathname === "/settings"
                ? "text-brand-600"
                : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
          <span>{t("nav.settings")}</span>
          {pathname === "/settings" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
          )}
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150 group disabled:opacity-50"
        >
          <LogOut
            size={17}
            className="shrink-0 text-slate-400 group-hover:text-slate-500 transition-colors"
          />
          <span>{isSigningOut ? t("nav.signingOut") : t("nav.signOut")}</span>
        </button>
      </div>
    </aside>
  );
}
