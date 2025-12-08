export interface Trainee {
  id: string;
  trainer_id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  gender?: string;
  is_active: boolean;
  created_at: string;
}

export interface Measurement {
  id: string;
  trainee_id: string;
  date: string;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  workout_date: string;
  is_completed: boolean;
  workout_exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  trainee_id: string;
  order_index: number;
  exercises: Exercise;
  exercise_sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight?: number;
  reps?: number;
  to_failure: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group_id?: string;
}

export interface WorkoutPlan {
  id: string;
  trainer_id: string;
  trainee_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  workout_plan_exercises: WorkoutPlanExercise[];
}

export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  exercise_id: string;
  day_number: number;
  order_index: number;
  sets_count?: number;
  reps_target?: string;
  weight_notes?: string;
  rest_seconds?: number;
  notes?: string;
  exercises: Exercise;
}

export interface MealPlan {
  id: string;
  trainee_id: string;
  name: string;
  is_active: boolean;
  meal_plan_items: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  plan_id: string;
  day_of_week: number;
  meal_type: string;
  description: string;
  notes?: string;
}

export interface DailyLog {
  id: string;
  trainee_id: string;
  date: string;
  weight?: number;
  workout_completed: boolean;
  workout_notes?: string;
  meals_followed: boolean;
  water_intake?: number;
  sleep_hours?: number;
  energy_level?: number;
  notes?: string;
  created_at: string;
}

export interface Meal {
  id: string;
  meal_plan_id?: string;
  trainee_id: string;
  name: string;
  time_of_day?: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
