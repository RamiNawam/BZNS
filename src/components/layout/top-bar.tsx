"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useLocaleStore } from "@/stores/locale-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

const pageKeys: Record<string, string> = {
  "/dashboard": "dashboard",
  "/roadmap": "roadmap",
  "/funding": "funding",
  "/financial": "financial",
  "/starter-kit": "starterKit",
  "/intake": "intake",
  "/settings": "settings",
};

function getInitials(
  profile: { full_name?: string | null; business_name?: string | null } | null,
): string {
  if (profile?.full_name) {
    return profile.full_name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (profile?.business_name) {
    return profile.business_name.slice(0, 2).toUpperCase();
  }
  return "U";
}

export default function TopBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const { profile } = useProfileStore();
  const initials = getInitials(profile);

  const key = pageKeys[pathname];
  const title = key ? t(`topbar.${key}.title`) : "BZNS";
  const subtitle = key ? t(`topbar.${key}.subtitle`) : "";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="font-heading font-semibold text-slate-900 text-base leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "fr" : "en")}
          className="h-8 px-2.5 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          aria-label={
            locale === "en" ? "Passer au français" : "Switch to English"
          }
        >
          {locale === "en" ? "EN" : "FR"}
        </button>

        <button
          type="button"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <Link
          href="/settings"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>

        {/* Avatar → settings */}
        <Link
          href="/settings"
          className="h-8 w-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center hover:border-brand-400 transition-colors"
          title={profile?.business_name ?? profile?.full_name ?? "Your profile"}
        >
          <span className="text-xs font-bold text-brand-700">{initials}</span>
        </Link>
      </div>
    </header>
  );
}
