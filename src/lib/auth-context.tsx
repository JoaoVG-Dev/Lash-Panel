import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getMissingSupabaseClientEnv, supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const missingEnv = getMissingSupabaseClientEnv();
    if (missingEnv.length > 0) {
      setAuthError(
        `Variáveis ausentes: ${missingEnv.join(
          ", ",
        )}. Crie um arquivo .env.local na raiz do projeto.`,
      );
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const authListener = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
      });
      subscription = authListener.data.subscription;

      supabase.auth
        .getSession()
        .then(({ data }) => {
          setSession(data.session);
          setAuthError(null);
        })
        .catch((error: unknown) => {
          setAuthError(error instanceof Error ? error.message : "Erro ao carregar autenticação.");
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Erro ao carregar autenticação.");
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        authError,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
