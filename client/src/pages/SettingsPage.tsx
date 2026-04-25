import { useAuth } from "@/hooks/use-auth";
import { Mountain, User, Bell, Mail, Shield } from "lucide-react";
import CheckInAlerts from "@/components/settings/CheckInAlerts";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* Page heading */}
      <div>
        <h1 className="font-serif text-3xl font-light italic text-forest dark:text-parchment">
          Settings
        </h1>
        <p className="text-sm text-forest/50 dark:text-parchment/50 mt-1">
          Manage your profile and notification preferences.
        </p>
      </div>

      {/* Profile section */}
      <section className="bg-white dark:bg-dark-card rounded-3xl border border-earth/20 dark:border-earth/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth/10 dark:border-earth/10 bg-sage/5 dark:bg-sage/10 flex items-center gap-3">
          <User className="w-4 h-4 text-forest/60 dark:text-parchment/60" />
          <h2 className="text-sm font-semibold text-forest dark:text-parchment">Profile</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-clay/15 flex items-center justify-center flex-shrink-0">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <Mountain className="w-7 h-7 text-clay" />
              )}
            </div>
            <div>
              <p className="font-semibold text-forest dark:text-parchment">{user?.name}</p>
              <p className="text-sm text-forest/55 dark:text-parchment/55">{user?.role}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-earth/20 dark:border-earth/10 px-4 py-3 bg-cream/50 dark:bg-dark-bg/30">
              <p className="text-xs text-forest/45 dark:text-parchment/40 mb-0.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="text-sm text-forest dark:text-parchment font-medium truncate">
                {user?.email}
              </p>
            </div>
            <div className="rounded-2xl border border-earth/20 dark:border-earth/10 px-4 py-3 bg-cream/50 dark:bg-dark-bg/30">
              <p className="text-xs text-forest/45 dark:text-parchment/40 mb-0.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Sign-in method
              </p>
              <p className="text-sm text-forest dark:text-parchment font-medium capitalize">
                {user?.authProvider === "google" ? "Google" : "Email & password"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Check-in alerts section */}
      <section className="bg-white dark:bg-dark-card rounded-3xl border border-earth/20 dark:border-earth/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth/10 dark:border-earth/10 bg-sage/5 dark:bg-sage/10 flex items-center gap-3">
          <Bell className="w-4 h-4 text-forest/60 dark:text-parchment/60" />
          <h2 className="text-sm font-semibold text-forest dark:text-parchment">Check-in Reminders</h2>
        </div>
        <div className="px-6 py-6">
          <CheckInAlerts />
        </div>
      </section>

    </div>
  );
}
