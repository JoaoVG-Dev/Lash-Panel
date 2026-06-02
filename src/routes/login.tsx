import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/app/brand-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar - Lash Panel" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { session, loading, authError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast.error("Informe seu e-mail para receber o link de recuperação.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Enviamos o link de recuperação para o seu e-mail.");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se necessário.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-background min-h-screen px-4 py-8 text-foreground sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-8">
      <section className="hidden min-h-[calc(100vh-4rem)] overflow-hidden rounded-[2rem] border bg-card/80 p-8 shadow-2xl shadow-primary/10 lg:flex lg:flex-col">
        <BrandMark />
        <div className="mt-auto max-w-xl">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="display-title text-6xl text-foreground">Seu estúdio com rotina leve.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Organize clientes, fichas técnicas, produtos, agenda e mensagens em um painel delicado
            feito para lash designers.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {["Clientes", "Agenda", "Anamnese"].map((item) => (
              <div key={item} className="rounded-2xl border bg-secondary/70 p-4 text-sm font-bold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandMark />
        </div>

        {authError ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTitle>Supabase não configurado</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Crie um arquivo .env.local na raiz do projeto com VITE_SUPABASE_URL e
                VITE_SUPABASE_PUBLISHABLE_KEY.
              </p>
              <p className="text-xs opacity-90">{authError}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Acesso seguro
              </p>
              <h1 className="display-title text-4xl text-foreground">
                {mode === "signin" ? "Bem-vinda de volta" : "Crie sua conta"}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {mode === "signin"
                  ? "Entre para continuar cuidando da sua agenda e das suas clientes."
                  : "Comece configurando seu painel profissional em poucos minutos."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="beauty-panel space-y-4 rounded-2xl p-5 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Senha</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="h-12 w-full" disabled={submitting}>
                {submitting ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <LockKeyhole className="h-3.5 w-3.5" />
                Suas informações ficam protegidas no seu acesso.
              </p>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full rounded-2xl border bg-card/70 px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signin" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
