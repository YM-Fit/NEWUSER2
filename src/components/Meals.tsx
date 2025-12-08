import { useEffect, useState } from 'react';
import { Plus, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Meal, MealType } from '../types';
import toast from 'react-hot-toast';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'ארוחת בוקר', icon: '🌅' },
  { value: 'lunch', label: 'ארוחת צהריים', icon: '🌞' },
  { value: 'dinner', label: 'ארוחת ערב', icon: '🌙' },
  { value: 'snack', label: 'נשנוש', icon: '🍎' },
];

export default function Meals() {
  const { trainee } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    meal_type: 'breakfast' as MealType,
    meal_time: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (trainee) {
      loadTodayMeals();
    }
  }, [trainee]);

  const loadTodayMeals = async () => {
    if (!trainee) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('trainee_id', trainee.id)
        .eq('meal_date', today)
        .order('meal_time', { ascending: true });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      toast.error('שגיאה בטעינת ארוחות');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee || !formData.description) return;

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('meals').insert({
        trainee_id: trainee.id,
        meal_date: today,
        meal_type: formData.meal_type,
        meal_time: formData.meal_time || null,
        description: formData.description,
      });

      if (error) throw error;

      toast.success('הארוחה נוספה בהצלחה');
      setShowAddForm(false);
      setFormData({
        meal_type: 'breakfast',
        meal_time: '',
        description: '',
      });
      loadTodayMeals();
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('שגיאה בהוספת ארוחה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק ארוחה זו?')) return;

    try {
      const { error } = await supabase.from('meals').delete().eq('id', mealId);

      if (error) throw error;

      toast.success('הארוחה נמחקה');
      loadTodayMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('שגיאה במחיקת ארוחה');
    }
  };

  const getMealTypeLabel = (type: string) => {
    return MEAL_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getMealTypeIcon = (type: string) => {
    return MEAL_TYPES.find((t) => t.value === type)?.icon || '🍽️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ארוחות היום</h1>
              <p className="text-gray-600">
                {new Intl.DateTimeFormat('he-IL', {
                  day: 'numeric',
                  month: 'long',
                }).format(new Date())}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            הוסף ארוחה
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">ארוחה חדשה</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סוג ארוחה</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, meal_type: type.value as MealType })}
                      className={`py-3 px-4 rounded-lg border-2 transition-all text-right ${
                        formData.meal_type === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl ml-2">{type.icon}</span>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שעה (אופציונלי)</label>
                <input
                  type="time"
                  value={formData.meal_time}
                  onChange={(e) => setFormData({ ...formData, meal_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור הארוחה</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="מה אכלת?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {submitting ? 'שומר...' : 'שמור ארוחה'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {meals.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">אין ארוחות רשומות היום</h2>
          <p className="text-gray-600">התחל לתעד את הארוחות שלך כדי לעקוב אחר התזונה.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{getMealTypeIcon(meal.meal_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{getMealTypeLabel(meal.meal_type)}</h3>
                      {meal.meal_time && (
                        <span className="text-sm text-gray-500">{meal.meal_time}</span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{meal.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
