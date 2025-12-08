import { useEffect, useState } from 'react';
import { Calendar, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { WorkoutPlan } from '../types';

const DAY_NAMES = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function WorkoutPlanView() {
  const { trainee } = useAuth();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (trainee) {
      loadWorkoutPlan();
    }
  }, [trainee]);

  const loadWorkoutPlan = async () => {
    if (!trainee) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_plan_exercises (
            *,
            exercises (name)
          )
        `)
        .eq('trainee_id', trainee.id)
        .eq('is_active', true)
        .order('order_index', { foreignTable: 'workout_plan_exercises', ascending: true })
        .maybeSingle();

      if (error) throw error;
      setWorkoutPlan(data);
    } catch (error) {
      console.error('Error loading workout plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const exercisesByDay = workoutPlan?.workout_plan_exercises?.reduce((acc, exercise) => {
    if (!acc[exercise.day_number]) {
      acc[exercise.day_number] = [];
    }
    acc[exercise.day_number].push(exercise);
    return acc;
  }, {} as Record<number, typeof workoutPlan.workout_plan_exercises>) || {};

  const availableDays = Object.keys(exercisesByDay).map(Number).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workoutPlan) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">אין תוכנית אימון פעילה</h2>
        <p className="text-gray-600">המאמן שלך עדיין לא הקצה לך תוכנית אימון.</p>
      </div>
    );
  }

  const selectedExercises = exercisesByDay[selectedDay] || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{workoutPlan.name}</h1>
        </div>
        {workoutPlan.description && (
          <p className="text-gray-600">{workoutPlan.description}</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              יום {DAY_NAMES[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {selectedExercises.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-600">אין תרגילים ליום זה</p>
          </div>
        ) : (
          selectedExercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {exercise.exercises?.name || 'תרגיל'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {exercise.sets_count && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">סטים</p>
                        <p className="text-lg font-bold text-gray-900">{exercise.sets_count}</p>
                      </div>
                    )}
                    {exercise.reps_target && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">חזרות</p>
                        <p className="text-lg font-bold text-gray-900">{exercise.reps_target}</p>
                      </div>
                    )}
                    {exercise.rest_seconds && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">מנוחה</p>
                        <p className="text-lg font-bold text-gray-900">{exercise.rest_seconds}״</p>
                      </div>
                    )}
                    {exercise.weight_notes && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-600">משקל</p>
                        <p className="text-sm font-medium text-gray-900">{exercise.weight_notes}</p>
                      </div>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-900">{exercise.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
