"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useLocaleStore } from "@/stores/locale-store";

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
  const { profile } = useProfileStore();
  const { locale, setLocale } = useLocaleStore();
  const initials = getInitials(profile);

  return (
    <header className="fixed top-0 right-0 h-16 flex items-center justify-end px-6 z-50 pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
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
