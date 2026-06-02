import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, LayoutDashboard, LogOut, Package, Settings, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { getUserSettings, isOnboardingComplete } from "@/lib/settings-api";
import { BrandMark } from "@/components/app/brand-mark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/atendimentos", label: "Agenda", icon: CalendarCheck },
  { to: "/configuracoes", label: "Mais", icon: Settings },
] as const;

function AuthenticatedLayout() {
  const { session, loading, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnboarding = pathname.startsWith("/onboarding");
  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
    enabled: Boolean(session),
  });

  if (loading) {
    return (
      <div className="app-background flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (isLoadingSettings) {
    return (
      <div className="app-background flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isSettingsError && !isOnboardingComplete(settings) && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  const current = navItems.find((i) => pathname.startsWith(i.to));
  const businessName = settings?.business_name || "Lash Panel";
  const professionalName = settings?.professional_name || "Painel profissional";

  return (
    <div className="app-background min-h-screen">
      {!isOnboarding && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border/70 bg-card/85 px-5 py-6 shadow-xl shadow-primary/5 backdrop-blur md:flex md:flex-col">
          <BrandMark />

          <div className="mt-7 rounded-2xl border bg-secondary/70 p-4">
            <p className="truncate text-sm font-bold text-foreground">{businessName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{professionalName}</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="outline" className="mt-auto justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </aside>
      )}

      <div className={cn("min-h-screen", !isOnboarding && "md:pl-72")}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur md:hidden">
          <BrandMark compact />
          <div className="flex min-w-0 flex-1 flex-col px-3">
            <span className="truncate text-sm font-bold text-foreground">
              {current?.label ?? "Lash Panel"}
            </span>
            <span className="truncate text-xs text-muted-foreground">{businessName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className={cn("min-h-screen pb-28 md:pb-8", isOnboarding && "pb-8")}>
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 md:py-6">
            {isSettingsError && (
              <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {settingsError instanceof Error
                  ? settingsError.message
                  : "Não foi possível carregar suas configurações agora."}
              </div>
            )}
            <Outlet />
          </div>
        </main>

        {!isOnboarding && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/70 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <ul className="mx-auto grid max-w-2xl grid-cols-5 px-2">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition-colors",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-10 place-items-center rounded-full",
                          active && "bg-primary/10",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
