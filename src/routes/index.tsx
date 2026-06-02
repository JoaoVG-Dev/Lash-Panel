import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lash Panel" },
      { name: "description", content: "Painel privado para profissionais de cílios." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}
