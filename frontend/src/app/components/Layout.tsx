import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Activity, 
  Brain, 
  AlertCircle, 
  BarChart3, 
  Settings,
  Bell,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: 'alert', message: 'High traffic detected on North lane', time: '2m ago', read: false },
    { id: 2, type: 'success', message: 'Emergency vehicle cleared - East route', time: '5m ago', read: false },
    { id: 3, type: 'info', message: 'System learning completed - 94.2% accuracy', time: '15m ago', read: true },
    { id: 4, type: 'warning', message: 'Peak hour approaching - Auto mode enabled', time: '1h ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/simulation', label: 'Simulation', icon: Activity },
    { path: '/analysis', label: 'Analysis', icon: Brain },
    { path: '/emergency', label: 'Emergency Control', icon: AlertCircle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    // Ensure navigation feels responsive and prevents "stuck screen" artifacts.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setShowNotifications(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm dark:shadow-gray-900/50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-8 bg-red-500 rounded-full"></div>
              <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-8 bg-green-500 rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
              NeuroFlow
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed top-16 left-0 bottom-0 z-[9999] isolate pointer-events-auto w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={(e) => {
                  // Defensive: ensure navigation even if some element interferes with link defaults.
                  // Preserve new-tab behavior.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="relative z-0 ml-64 mt-16 p-8">
        <Outlet key={location.pathname} />
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-0 w-96 max-h-[600px] bg-white dark:bg-gray-900 border-l border-b border-gray-200 dark:border-gray-800 shadow-2xl dark:shadow-gray-900/50 z-50 rounded-bl-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-green-100 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.read ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-lg ${
                    n.type === 'alert' ? 'bg-red-100 dark:bg-red-900/30' : 
                    n.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 
                    n.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                    'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      n.type === 'alert' ? 'bg-red-500' : 
                      n.type === 'success' ? 'bg-green-500' : 
                      n.type === 'info' ? 'bg-blue-500' : 
                      'bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button className="w-full text-center text-sm text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}