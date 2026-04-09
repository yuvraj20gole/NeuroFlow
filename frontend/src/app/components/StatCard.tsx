import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
  trend?: string;
  showSpeedButton?: boolean;
  onSpeedToggle?: () => void;
  isSpeedMode?: boolean;
}

export function StatCard({ title, value, icon: Icon, color = 'blue', trend, showSpeedButton, onSpeedToggle, isSpeedMode }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-500 dark:bg-green-600',
    yellow: 'bg-yellow-500 dark:bg-yellow-600',
    red: 'bg-red-500 dark:bg-red-600',
    blue: 'bg-blue-500 dark:bg-blue-600',
    purple: 'bg-purple-500 dark:bg-purple-600'
  };

  const glowClasses = {
    green: 'dark:shadow-green-500/30',
    yellow: 'dark:shadow-yellow-500/30',
    red: 'dark:shadow-red-500/30',
    blue: 'dark:shadow-blue-500/30',
    purple: 'dark:shadow-purple-500/30'
  };

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800 transition-all hover:scale-105">
      {showSpeedButton && (
        <button
          className={`absolute top-3 right-3 ${isSpeedMode ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-full px-2.5 py-1 text-xs font-bold hover:scale-110 transition-all shadow-md`}
          onClick={onSpeedToggle}
          title={isSpeedMode ? 'Switch to 1x speed' : 'Switch to 2x speed'}
        >
          {isSpeedMode ? '2x' : '1x'}
        </button>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{trend}</p>
          )}
        </div>
        <div className={`${colorClasses[color]} ${glowClasses[color]} p-3 rounded-lg shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}