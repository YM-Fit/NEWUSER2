import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutPlanView from './components/WorkoutPlanView';
import WorkoutHistory from './components/WorkoutHistory';
import Measurements from './components/Measurements';
import DailyLog from './components/DailyLog';
import Meals from './components/Meals';
import MealPlanView from './components/MealPlanView';

function AppContent() {
  const { session, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'workout-plan':
        return <WorkoutPlanView />;
      case 'workout-history':
        return <WorkoutHistory />;
      case 'measurements':
        return <Measurements />;
      case 'daily-log':
        return <DailyLog />;
      case 'meals':
        return <Meals />;
      case 'meal-plan':
        return <MealPlanView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1f2937',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
