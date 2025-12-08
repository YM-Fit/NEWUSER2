import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MealPlan } from '../types';

const DAY_NAMES = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  lunch: 'ארוחת צהריים',
  dinner: 'ארוחת ערב',
  snack: 'נשנוש',
};

const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🌞',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealPlanView() {
  const { trainee } = useAuth();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (trainee) {
      loadMealPlan();
    }
  }, [trainee]);

  const loadMealPlan = async () => {
    if (!trainee) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_items (*)
        `)
        .eq('trainee_id', trainee.id)
        .eq('is_active', true)
        .order('day_of_week', { foreignTable: 'meal_plan_items', ascending: true })
        .order('meal_type', { foreignTable: 'meal_plan_items', ascending: true })
        .maybeSingle();

      if (error) throw error;
      setMealPlan(data);
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemsByDay = mealPlan?.meal_plan_items?.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, typeof mealPlan.meal_plan_items>) || {};

  const availableDays = Object.keys(itemsByDay).map(Number).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">אין תפריט פעיל</h2>
        <p className="text-gray-600">המאמן שלך עדיין לא הקצה לך תפריט תזונה.</p>
      </div>
    );
  }

  const selectedItems = itemsByDay[selectedDay] || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <ChefHat className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{mealPlan.name}</h1>
        </div>
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
        {selectedItems.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-600">אין ארוחות מתוכננות ליום זה</p>
          </div>
        ) : (
          selectedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">
                  {MEAL_TYPE_ICONS[item.meal_type] || '🍽️'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {MEAL_TYPE_LABELS[item.meal_type] || item.meal_type}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">{item.description}</p>
                  {item.notes && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-2">
                      <p className="text-sm text-blue-900">{item.notes}</p>
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
