/*
  # Create Trainee Management System Tables

  ## Overview
  This migration creates all tables needed for the trainee management system,
  including authentication, profiles, workouts, meal plans, and daily logs.

  ## Tables Created
  
  ### 1. Authentication & Users
  - `trainee_auth` - Authentication data for trainees
  
  ### 2. Trainee Profiles
  - `trainees` - Trainee profile information
  
  ### 3. Measurements
  - `measurements` - Body measurements tracking
  
  ### 4. Workout System
  - `workouts` - Workout templates
  - `workout_trainees` - Assignment of workouts to trainees
  - `workout_exercises` - Exercises in a workout
  - `exercise_sets` - Sets for each exercise
  
  ### 5. Workout Plans
  - `workout_plans` - Weekly workout schedules
  
  ### 6. Meal Plans
  - `meal_plans` - Nutrition plans for trainees
  - `meals` - Individual meals in meal plans
  
  ### 7. Daily Logs
  - `daily_log` - Daily tracking by trainees

  ## Security (RLS Policies)
  
  All tables have Row Level Security enabled.
  Trainees can read their own data and write to daily_log and meals only.
*/

-- Create function to get trainee_id from session
CREATE OR REPLACE FUNCTION get_trainee_id_from_token()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Trainees Table (create first as it's referenced by others)
CREATE TABLE IF NOT EXISTS trainees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  birth_date date,
  gender text,
  trainer_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Trainee Auth Table
CREATE TABLE IF NOT EXISTS trainee_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3. Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  height numeric,
  body_fat numeric,
  muscle_mass numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trainer_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 5. Workout Trainees Table
CREATE TABLE IF NOT EXISTS workout_trainees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  assigned_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 6. Workout Exercises Table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  order_index integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 7. Exercise Sets Table
CREATE TABLE IF NOT EXISTS exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  reps integer,
  weight numeric,
  rest_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- 8. Workout Plans Table
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 9. Meal Plans Table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  daily_calories integer,
  daily_protein integer,
  daily_carbs integer,
  daily_fats integer,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 10. Meals Table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE,
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  name text NOT NULL,
  time_of_day text,
  description text,
  calories integer,
  protein integer,
  carbs integer,
  fats integer,
  created_at timestamptz DEFAULT now()
);

-- 11. Daily Log Table
CREATE TABLE IF NOT EXISTS daily_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid REFERENCES trainees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  workout_completed boolean DEFAULT false,
  workout_notes text,
  meals_followed boolean DEFAULT false,
  water_intake integer,
  sleep_hours numeric,
  energy_level integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trainee_id, date)
);

-- Enable RLS on all tables
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainee_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log ENABLE ROW LEVEL SECURITY;

-- Policies for trainees table
CREATE POLICY "Trainees can read own profile"
  ON trainees FOR SELECT
  TO authenticated
  USING (id = get_trainee_id_from_token());

-- Policies for measurements table
CREATE POLICY "Trainees can read own measurements"
  ON measurements FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Policies for workouts table
CREATE POLICY "Trainees can read assigned workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_trainees
      WHERE workout_trainees.workout_id = workouts.id
      AND workout_trainees.trainee_id = get_trainee_id_from_token()
    )
  );

-- Policies for workout_trainees table
CREATE POLICY "Trainees can read own workout assignments"
  ON workout_trainees FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Policies for workout_exercises table
CREATE POLICY "Trainees can read exercises in assigned workouts"
  ON workout_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_trainees
      WHERE workout_trainees.workout_id = workout_exercises.workout_id
      AND workout_trainees.trainee_id = get_trainee_id_from_token()
    )
  );

-- Policies for exercise_sets table
CREATE POLICY "Trainees can read sets in assigned workouts"
  ON exercise_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workout_trainees wt ON wt.workout_id = we.workout_id
      WHERE we.id = exercise_sets.workout_exercise_id
      AND wt.trainee_id = get_trainee_id_from_token()
    )
  );

-- Policies for workout_plans table
CREATE POLICY "Trainees can read own workout plans"
  ON workout_plans FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Policies for meal_plans table
CREATE POLICY "Trainees can read own meal plans"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Policies for meals table (read and write)
CREATE POLICY "Trainees can read own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token())
  WITH CHECK (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Policies for daily_log table (read and write)
CREATE POLICY "Trainees can read own daily logs"
  ON daily_log FOR SELECT
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can insert own daily logs"
  ON daily_log FOR INSERT
  TO authenticated
  WITH CHECK (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can update own daily logs"
  ON daily_log FOR UPDATE
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token())
  WITH CHECK (trainee_id = get_trainee_id_from_token());

CREATE POLICY "Trainees can delete own daily logs"
  ON daily_log FOR DELETE
  TO authenticated
  USING (trainee_id = get_trainee_id_from_token());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainee_auth_phone ON trainee_auth(phone);
CREATE INDEX IF NOT EXISTS idx_trainees_phone ON trainees(phone);
CREATE INDEX IF NOT EXISTS idx_measurements_trainee_date ON measurements(trainee_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_trainees_trainee ON workout_trainees(trainee_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_trainee ON workout_plans(trainee_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_trainee ON meal_plans(trainee_id);
CREATE INDEX IF NOT EXISTS idx_meals_trainee ON meals(trainee_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_trainee_date ON daily_log(trainee_id, date);
