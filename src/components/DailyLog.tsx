import { useEffect, useState } from 'react';
import { BookOpen, Droplet, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DailyLog as DailyLogType } from '../types';
import toast from 'react-hot-toast';

export default function DailyLog() {
  const { trainee } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    workout_completed: false,
    workout_notes: '',
    meals_followed: false,
    water_intake: '',
    sleep_hours: '',
    energy_level: '',
    notes: '',
  });

  useEffect(() => {
    if (trainee) {
      loadTodayLog();
    }
  }, [trainee]);

  const loadTodayLog = async () => {
    if (!trainee) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_log')
        .select('*')
        .eq('trainee_id', trainee.id)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          weight: data.weight?.toString() || '',
          workout_completed: data.workout_completed || false,
          workout_notes: data.workout_notes || '',
          meals_followed: data.meals_followed || false,
          water_intake: data.water_intake?.toString() || '',
          sleep_hours: data.sleep_hours?.toString() || '',
          energy_level: data.energy_level?.toString() || '',
          notes: data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error loading daily log:', error);
      toast.error('שגיאה בטעינת היומן');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!trainee) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from('daily_log')
        .select('id')
        .eq('trainee_id', trainee.id)
        .eq('date', today)
        .maybeSingle();

      const logData: any = {
        trainee_id: trainee.id,
        date: today,
        workout_completed: formData.workout_completed,
        meals_followed: formData.meals_followed,
      };

      if (formData.weight) logData.weight = parseFloat(formData.weight);
      if (formData.workout_notes) logData.workout_notes = formData.workout_notes;
      if (formData.water_intake) logData.water_intake = parseInt(formData.water_intake);
      if (formData.sleep_hours) logData.sleep_hours = parseFloat(formData.sleep_hours);
      if (formData.energy_level) logData.energy_level = parseInt(formData.energy_level);
      if (formData.notes) logData.notes = formData.notes;

      if (existing) {
        const { error } = await supabase
          .from('daily_log')
          .update(logData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_log').insert(logData);

        if (error) throw error;
      }

      toast.success('היומן נשמר בהצלחה');
    } catch (error) {
      console.error('Error saving daily log:', error);
      toast.error('שגיאה בשמירת היומן');
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">יומן יומי</h1>
            <p className="text-gray-600">
              {new Intl.DateTimeFormat('he-IL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            משקל היום (ק״ג)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לדוגמה: 75.5"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.workout_completed}
              onChange={(e) => setFormData({ ...formData, workout_completed: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">השלמתי את האימון היום</span>
          </label>

          {formData.workout_completed && (
            <textarea
              value={formData.workout_notes}
              onChange={(e) => setFormData({ ...formData, workout_notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="איך היה האימון? הערות..."
            />
          )}
        </div>

        <div>
          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.meals_followed}
              onChange={(e) => setFormData({ ...formData, meals_followed: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">עקבתי אחרי תוכנית התזונה</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Droplet className="w-5 h-5 text-blue-600" />
            כמות מים (כוסות)
          </label>
          <input
            type="number"
            value={formData.water_intake}
            onChange={(e) => setFormData({ ...formData, water_intake: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לדוגמה: 8"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Moon className="w-5 h-5 text-indigo-600" />
            שעות שינה
          </label>
          <input
            type="number"
            step="0.5"
            value={formData.sleep_hours}
            onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לדוגמה: 7.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">רמת אנרגיה</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, energy_level: level.toString() })}
                className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
                  formData.energy_level === level.toString()
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">1 = נמוך מאוד, 5 = גבוה מאוד</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">הערות כלליות</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="איך היה היום? מה הרגשת?"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {saving ? 'שומר...' : 'שמור יומן'}
        </button>
      </div>
    </div>
  );
}
