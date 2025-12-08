import { useEffect, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';

export default function WorkoutHistory() {
  const { trainee } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  useEffect(() => {
    if (trainee) {
      loadWorkoutHistory();
    }
  }, [trainee]);

  const loadWorkoutHistory = async () => {
    if (!trainee) return;

    try {
      const { data, error } = await supabase
        .from('workout_trainees')
        .select(`
          workouts!inner (
            id,
            workout_date,
            is_completed,
            workout_exercises (
              id,
              order_index,
              exercises (name),
              exercise_sets (
                id,
                set_number,
                weight,
                reps,
                to_failure
              )
            )
          )
        `)
        .eq('trainee_id', trainee.id)
        .eq('workouts.is_completed', true)
        .order('workout_date', { foreignTable: 'workouts', ascending: false });

      if (error) throw error;

      const workoutsData = data?.map((item: any) => item.workouts) || [];
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">אין אימונים עדיין</h2>
        <p className="text-gray-600">כאשר תסיים אימונים, הם יופיעו כאן.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">היסטוריית אימונים</h1>
        </div>
        <p className="text-gray-600 mt-2">סה״כ {workouts.length} אימונים בוצעו</p>
      </div>

      <div className="space-y-3">
        {workouts.map((workout) => {
          const isExpanded = expandedWorkout === workout.id;
          const sortedExercises = workout.workout_exercises?.sort(
            (a, b) => a.order_index - b.order_index
          ) || [];

          return (
            <div key={workout.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleWorkout(workout.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatDate(workout.workout_date)}</p>
                    <p className="text-sm text-gray-600">{sortedExercises.length} תרגילים</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  {sortedExercises.map((exercise, index) => {
                    const sortedSets = exercise.exercise_sets?.sort(
                      (a, b) => a.set_number - b.set_number
                    ) || [];

                    return (
                      <div key={exercise.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-sm">
                            {index + 1}
                          </div>
                          <h3 className="font-bold text-gray-900">
                            {exercise.exercises?.name || 'תרגיל'}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          {sortedSets.map((set) => (
                            <div
                              key={set.id}
                              className="bg-white rounded-lg p-3 flex items-center justify-between"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                סט {set.set_number}
                              </span>
                              <div className="flex items-center gap-4 text-sm">
                                {set.weight && (
                                  <span className="text-gray-900 font-medium">
                                    {set.weight} ק״ג
                                  </span>
                                )}
                                {set.reps && (
                                  <span className="text-gray-900 font-medium">
                                    {set.reps} חזרות
                                  </span>
                                )}
                                {set.to_failure && (
                                  <span className="text-orange-600 font-medium text-xs">
                                    עד כשלון
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
