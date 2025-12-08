import { useEffect, useState } from 'react';
import { BookOpen, Droplet, Footprints, Moon, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DailyLog as DailyLogType } from '../types';
import toast from 'react-hot-toast';

const MOOD_OPTIONS = [
  { value: 'excellent', label: 'מצוין', emoji: '😄' },
  { value: 'good', label: 'טוב', emoji: '🙂' },
  { value: 'ok', label: 'בסדר', emoji: '😐' },
  { value: 'bad', label: 'לא טוב', emoji: '😕' },
  { value: 'terrible', label: 'גרוע', emoji: '😢' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 5, label: 'מעולה' },
  { value: 4, label: 'טוב' },
  { value: 3, label: 'בינוני' },
  { value: 2, label: 'גרוע' },
  { value: 1, label: 'מאוד גרוע' },
];

export default function DailyLog() {
  const { trainee } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    water_ml: '',
    steps: '',
    sleep_hours: '',
    sleep_quality: '',
    mood: '',
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
        .eq('log_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          water_ml: data.water_ml?.toString() || '',
          steps: data.steps?.toString() || '',
          sleep_hours: data.sleep_hours?.toString() || '',
          sleep_quality: data.sleep_quality?.toString() || '',
          mood: data.mood || '',
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
        .eq('log_date', today)
        .maybeSingle();

      const logData: any = {
        trainee_id: trainee.id,
        log_date: today,
      };

      if (formData.water_ml) logData.water_ml = parseInt(formData.water_ml);
      if (formData.steps) logData.steps = parseInt(formData.steps);
      if (formData.sleep_hours) logData.sleep_hours = parseFloat(formData.sleep_hours);
      if (formData.sleep_quality) logData.sleep_quality = parseInt(formData.sleep_quality);
      if (formData.mood) logData.mood = formData.mood;
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
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Droplet className="w-5 h-5 text-blue-600" />
            כמות מים (מ״ל)
          </label>
          <input
            type="number"
            value={formData.water_ml}
            onChange={(e) => setFormData({ ...formData, water_ml: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לדוגמה: 2000"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Footprints className="w-5 h-5 text-green-600" />
            צעדים
          </label>
          <input
            type="number"
            value={formData.steps}
            onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="לדוגמה: 10000"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Moon className="w-5 h-5 text-purple-600" />
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
          <label className="block text-sm font-medium text-gray-700 mb-3">איכות שינה</label>
          <div className="flex gap-2">
            {SLEEP_QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, sleep_quality: option.value.toString() })}
                className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
                  formData.sleep_quality === option.value.toString()
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Smile className="w-5 h-5 text-yellow-600" />
            מצב רוח
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, mood: option.value })}
                className={`py-3 px-2 rounded-lg border-2 transition-all ${
                  formData.mood === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-xs font-medium text-gray-700">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">הערות</label>
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
