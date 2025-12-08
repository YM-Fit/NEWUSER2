import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Trainee } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  session: Session | null;
  trainee: Trainee | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadTrainee(session.user.phone || '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session) {
          await loadTrainee(session.user.phone || '');
        } else {
          setTrainee(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadTrainee = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('trainees')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setTrainee(data);
    } catch (error) {
      console.error('Error loading trainee:', error);
      toast.error('שגיאה בטעינת פרטי המשתמש');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trainee-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      setTrainee(data.trainee);
      toast.success(`ברוך הבא, ${data.trainee.full_name}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'שגיאה בהתחברות');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setTrainee(null);
      toast.success('התנתקת בהצלחה');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('שגיאה בהתנתקות');
    }
  };

  return (
    <AuthContext.Provider value={{ session, trainee, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
