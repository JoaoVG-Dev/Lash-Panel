import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, CalendarCheck, Package, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { getUserSettings, isOnboardingComplete } from "@/lib/settings-api";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/atendimentos", label: "Agenda", icon: CalendarCheck },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/configuracoes", label: "Config", icon: Settings },
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
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (isLoadingSettings) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isSettingsError && !isOnboardingComplete(settings) && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  const current = navItems.find((i) => pathname.startsWith(i.to));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4">
        <h1 className="text-base font-semibold text-foreground">
          {current?.label ?? "Lash Manager"}
        </h1>
        <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {isSettingsError && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
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
          className="fixed bottom-0 left-0 right-0 z-20 border-t bg-card"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex h-16 flex-col items-center justify-center gap-1 text-xs ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
