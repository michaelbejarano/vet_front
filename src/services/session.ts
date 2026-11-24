import type { Session } from '@/types/auth.types';

const KEY = 'vetcare_session';
const LOCAL_EVENT = 'vetcare:session-changed';

// Obtener sesión
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) return null;

    const session = JSON.parse(raw) as Session;

    if (
      !session?.token ||
      !session?.user ||
      isTokenExpired(session.token)
    ) {
      localStorage.removeItem(KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

// Notificar cambios
function notify(): void {
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

// Guardar sesión
export function saveSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

// Eliminar sesión
export function clearSession(): void {
  localStorage.removeItem(KEY);
  notify();
}

// Obtener token
export function getToken(): string | null {
  return getSession()?.token ?? null;
}

// Sincronizar sesión entre pestañas
export function subscribeSession(
  callback: () => void
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      callback();
    }
  };

  const onLocal = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCAL_EVENT, onLocal);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCAL_EVENT, onLocal);
  };
}

// Obtener fecha de expiración del JWT
export function getTokenExpiry(
  token: string
): number | null {
  try {
    const encoded = token.split('.')[1];

    if (!encoded) return null;

    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      '='
    );

    const payload = JSON.parse(atob(padded));

    return typeof payload.exp === 'number'
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

// Verificar expiración
export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);

  return expiry === null || Date.now() >= expiry;
}