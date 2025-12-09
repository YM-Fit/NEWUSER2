import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Trainee {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  trainer_id: string;
}

interface AuthContextType {
  trainee: Trainee | null;
  traineeId: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTraineeId = localStorage.getItem('trainee_id');
    if (storedTraineeId) {
      loadTrainee(storedTraineeId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTrainee = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('trainees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setTrainee(data);
      setTraineeId(id);
    } catch (error) {
      console.error('Error loading trainee:', error);
      localStorage.removeItem('trainee_id');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('trainee_login', {
        phone_input: phone,
        password_input: password
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      localStorage.setItem('trainee_id', data.trainee_id);
      setTrainee(data.trainee);
      setTraineeId(data.trainee_id);

      toast.success('התחברת בהצלחה!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'שגיאה בהתחברות');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('trainee_id');
    setTrainee(null);
    setTraineeId(null);
    toast.success('התנתקת בהצלחה');
  };

  return (
    <AuthContext.Provider value={{ trainee, traineeId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
