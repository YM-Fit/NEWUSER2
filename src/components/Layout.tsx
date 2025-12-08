import { ReactNode } from 'react';
import {
  BookOpen,
  ChefHat,
  Dumbbell,
  History,
  Home,
  LogOut,
  Ruler,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'ראשי' },
    { id: 'workout-plan', icon: Dumbbell, label: 'תוכנית' },
    { id: 'workout-history', icon: History, label: 'אימונים' },
    { id: 'measurements', icon: Ruler, label: 'מדידות' },
    { id: 'daily-log', icon: BookOpen, label: 'יומן' },
    { id: 'meals', icon: UtensilsCrossed, label: 'ארוחות' },
    { id: 'meal-plan', icon: ChefHat, label: 'תפריט' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">אזור מתאמנים</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">יציאה</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center justify-center py-3 transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
