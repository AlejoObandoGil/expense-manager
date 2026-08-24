'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Mode = 'login' | 'signup';

/**
 * Translates the expected Supabase Auth error cases into curated Spanish
 * copy. Anything not recognized falls back to a generic message instead of
 * leaking the raw English SDK string.
 */
function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Credenciales inválidas.';
  }
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('already exists')
  ) {
    return 'Ese correo ya está registrado.';
  }
  if (normalized.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirmá tu correo antes de iniciar sesión.';
  }

  return 'Ocurrió un error. Intentá de nuevo.';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          router.replace('/');
          router.refresh();
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPendingConfirmation(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    const supabase = createBrowserClient();

    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(translateAuthError(authError.message));
          return;
        }

        if (data.session) {
          router.replace('/');
          router.refresh();
        } else {
          setError('Ocurrió un error. Intentá de nuevo.');
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) {
          setError(translateAuthError(authError.message));
          return;
        }

        if (data.session) {
          router.replace('/');
          router.refresh();
        } else if (data.user?.identities?.length === 0) {
          // Supabase's anti-enumeration behavior: signUp() for an already
          // registered, confirmed email returns an obfuscated user object
          // with no error and no session — indistinguishable from a genuine
          // pending-confirmation signup except for this empty identities
          // array.
          setError('Ese correo ya está registrado.');
        } else {
          setPendingConfirmation(true);
        }
      }
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 text-card-foreground">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Ingresá tus credenciales para continuar.'
              : 'Registrate para empezar a usar la app.'}
          </p>
        </div>

        {pendingConfirmation ? (
          <p className="rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
            Revisá tu correo para confirmar tu cuenta.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? 'Cargando...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Registrarse'}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              ¿No tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setPendingConfirmation(false);
                }}
                className="font-medium text-primary hover:underline"
              >
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setPendingConfirmation(false);
                }}
                className="font-medium text-primary hover:underline"
              >
                Iniciá sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
