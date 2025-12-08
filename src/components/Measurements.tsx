import { useEffect, useState } from 'react';
import { Plus, Ruler, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Measurement } from '../types';
import toast from 'react-hot-toast';

export default function Measurements() {
  const { trainee } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    body_fat: '',
    muscle_mass: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (trainee) {
      loadMeasurements();
    }
  }, [trainee]);

  const loadMeasurements = async () => {
    if (!trainee) return;

    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('trainee_id', trainee.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error) {
      console.error('Error loading measurements:', error);
      toast.error('שגיאה בטעינת מדידות');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee) return;

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const measurementData: any = {
        trainee_id: trainee.id,
        date: today,
      };

      if (formData.weight) measurementData.weight = parseFloat(formData.weight);
      if (formData.height) measurementData.height = parseFloat(formData.height);
      if (formData.body_fat) measurementData.body_fat = parseFloat(formData.body_fat);
      if (formData.muscle_mass) measurementData.muscle_mass = parseFloat(formData.muscle_mass);
      if (formData.notes) measurementData.notes = formData.notes;

      const { error: measurementError } = await supabase
        .from('measurements')
        .insert(measurementData);

      if (measurementError) throw measurementError;

      toast.success('המדידה נוספה בהצלחה');
      setShowAddForm(false);
      setFormData({
        weight: '',
        height: '',
        body_fat: '',
        muscle_mass: '',
        notes: '',
      });
      loadMeasurements();
    } catch (error) {
      console.error('Error adding measurement:', error);
      toast.error('שגיאה בהוספת מדידה');
    } finally {
      setSubmitting(false);
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
            <Ruler className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">מדידות</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            הוסף מדידה
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">מדידה חדשה</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    משקל (ק״ג)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    גובה (ס״מ)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    אחוז שומן (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.body_fat}
                    onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מסת שריר (ק״ג)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.muscle_mass}
                    onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הערות
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="הערות נוספות..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {submitting ? 'שומר...' : 'שמור מדידה'}
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

      {measurements.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">אין מדידות עדיין</h2>
          <p className="text-gray-600">התחל לעקוב אחר ההתקדמות שלך על ידי הוספת מדידה ראשונה.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {measurements.map((measurement, index) => (
            <div key={measurement.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{formatDate(measurement.date)}</h3>
                {index === 0 && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    אחרון
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {measurement.weight && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">משקל</p>
                    <p className="text-lg font-bold text-gray-900">{measurement.weight} ק״ג</p>
                  </div>
                )}
                {measurement.height && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">גובה</p>
                    <p className="text-lg font-bold text-gray-900">{measurement.height} ס״מ</p>
                  </div>
                )}
                {measurement.body_fat && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">אחוז שומן</p>
                    <p className="text-lg font-bold text-gray-900">{measurement.body_fat}%</p>
                  </div>
                )}
                {measurement.muscle_mass && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">מסת שריר</p>
                    <p className="text-lg font-bold text-gray-900">{measurement.muscle_mass} ק״ג</p>
                  </div>
                )}
              </div>
              {measurement.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">הערות</p>
                  <p className="text-sm text-gray-900">{measurement.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
