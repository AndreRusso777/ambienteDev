import { useState, useEffect } from 'react';

/**
 * Obtém o sessionId do cookie auth_session
 */
export function getSessionId(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => 
    cookie.trim().startsWith('auth_session=')
  );

  if (!authCookie) {
    return null;
  }

  return authCookie.split('=')[1]?.trim() || null;
}

/**
 * Hook para obter o sessionId reativo
 */
export function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);

    const interval = setInterval(() => {
      const currentId = getSessionId();
      setSessionId(prevId => {
        if (currentId !== prevId) {
          return currentId;
        }
        return prevId;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return sessionId;
}
