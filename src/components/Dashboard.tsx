import { useEffect, useState } from 'react';
import { Calendar, Dumbbell, Droplet, Footprints, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DailyLog, WorkoutPlan } from '../types';

export default function Dashboard() {
  const { trainee } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trainee) {
      loadDashboardData();
    }
  }, [trainee]);

  const loadDashboardData = async () => {
    if (!trainee) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const [logResult, planResult] = await Promise.all([
        supabase
          .from('daily_log')
          .select('*')
          .eq('trainee_id', trainee.id)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('workout_plans')
          .select('*, workout_plan_exercises(*)')
          .eq('trainee_id', trainee.id)
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      if (logResult.data) setTodayLog(logResult.data);
      if (planResult.data) setWorkoutPlan(planResult.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayWorkoutDay = () => {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 ? 7 : dayOfWeek;
  };

  const todayWorkouts = workoutPlan?.workout_plan_exercises?.filter(
    (ex) => ex.day_number === getTodayWorkoutDay()
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">שלום, {trainee?.full_name}!</h1>
        <p className="text-blue-100">בואו נשמור על הכושר היום</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Droplet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">מים</p>
              <p className="text-xl font-bold text-gray-900">
                {todayLog?.water_ml || 0}
                <span className="text-sm font-normal text-gray-500"> מ״ל</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <Footprints className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">צעדים</p>
              <p className="text-xl font-bold text-gray-900">{todayLog?.steps || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Moon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">שינה</p>
              <p className="text-xl font-bold text-gray-900">
                {todayLog?.sleep_hours || 0}
                <span className="text-sm font-normal text-gray-500"> שעות</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">תרגילים היום</p>
              <p className="text-xl font-bold text-gray-900">{todayWorkouts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {todayWorkouts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">האימון של היום</h2>
          </div>
          <div className="space-y-3">
            {todayWorkouts.slice(0, 3).map((exercise, index) => (
              <div key={exercise.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{exercise.exercises?.name || 'תרגיל'}</p>
                  <p className="text-sm text-gray-600">
                    {exercise.sets_count} סטים × {exercise.reps_target} חזרות
                  </p>
                </div>
              </div>
            ))}
            {todayWorkouts.length > 3 && (
              <p className="text-sm text-gray-500 text-center">ועוד {todayWorkouts.length - 3} תרגילים...</p>
            )}
          </div>
        </div>
      )}

      {!workoutPlan && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">אין לך תוכנית אימון פעילה כרגע. פנה למאמן שלך.</p>
        </div>
      )}
    </div>
  );
}
