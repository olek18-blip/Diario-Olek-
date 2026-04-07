import { useState, useEffect } from 'react';

export interface DemoUser {
  id: string;
  email: string;
  user_metadata: { display_name: string };
}

const USER_KEY = 'mi_diario_user_v2';

export const useAuth = () => {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, displayName?: string) => {
    const newUser: DemoUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: { display_name: displayName || email.split('@')[0] },
    };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return { data: { user: newUser }, error: null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const u = JSON.parse(stored) as DemoUser;
        if (u.email === email) { setUser(u); return { data: { user: u }, error: null }; }
      }
    } catch {}
    return signUp(email, password);
  };

  const signOut = async () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    return { error: null };
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) return { error: new Error('Sin usuario') };
    const updated: DemoUser = { ...user, user_metadata: { display_name: displayName } };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
    return { error: null };
  };

  return { user, loading, signUp, signIn, signOut, updateDisplayName };
};
