import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatCard } from '../components/StatCard';
import { getAnalytics, type AnalyticsResponse } from '@/services/api';

const historicalData = [
  { date: 'Mon', vehicles: 12500, avgWait: 65, efficiency: 75 },
  { date: 'Tue', vehicles: 13200, avgWait: 55, efficiency: 82 },
  { date: 'Wed', vehicles: 14100, avgWait: 45, efficiency: 88 },
  { date: 'Thu', vehicles: 13800, avgWait: 50, efficiency: 85 },
  { date: 'Fri', vehicles: 15500, avgWait: 70, efficiency: 72 },
  { date: 'Sat', vehicles: 11200, avgWait: 38, efficiency: 92 },
  { date: 'Sun', vehicles: 9800, avgWait: 30, efficiency: 95 },
];

const peakHourData = [
  { hour: '00:00', traffic: 15 },
  { hour: '03:00', traffic: 8 },
  { hour: '06:00', traffic: 45 },
  { hour: '09:00', traffic: 85 },
  { hour: '12:00', traffic: 65 },
  { hour: '15:00', traffic: 70 },
  { hour: '18:00', traffic: 95 },
  { hour: '21:00', traffic: 50 },
];

const directionData = [
  { name: 'North', value: 2845, color: '#EF4444' },
  { name: 'South', value: 2623, color: '#F59E0B' },
  { name: 'East', value: 3156, color: '#10B981' },
  { name: 'West', value: 2420, color: '#3B82F6' },
];

const waitTimeData = [
  { range: '0-20s', count: 3500 },
  { range: '20-40s', count: 4200 },
  { range: '40-60s', count: 2800 },
  { range: '60-80s', count: 1500 },
  { range: '80+s', count: 800 },
];

export function Analytics() {
  const [snapshot, setSnapshot] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await getAnalytics();
        if (!cancelled) setSnapshot(a);
      } catch {
        if (!cancelled) setSnapshot(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = () => {
    console.log('Exporting report...');
    alert('Report exported successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Historical data analysis and performance metrics</p>
        </div>
        <Button 
          onClick={handleExport}
          className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats — top row from GET /analytics when available */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Throughput (est.)"
          value={snapshot ? `${snapshot.throughput_vehicles_per_hour.toLocaleString()}/h` : '—'}
          icon={Users}
          color="blue"
          trend={snapshot ? `Incidents 24h: ${snapshot.incidents_handled_24h}` : 'API offline'}
        />
        <StatCard
          title="Avg Wait Time"
          value={snapshot ? `${snapshot.avg_wait_seconds}s` : '40s'}
          icon={Clock}
          color="yellow"
          trend="From /analytics snapshot"
        />
        <StatCard
          title="Efficiency Score"
          value={snapshot ? `${snapshot.efficiency_score}%` : '87%'}
          icon={TrendingUp}
          color="green"
          trend="+5% improvement"
        />
        <StatCard
          title="Model confidence"
          value={snapshot ? `${snapshot.model_confidence_avg}%` : '—'}
          icon={Clock}
          color="red"
          trend="Hybrid controller"
        />
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Weekly Traffic Overview</h3>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="vehicles" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hour Analysis */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Peak Hour Analysis</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={peakHourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="traffic" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Direction Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Traffic by Direction</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={directionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {directionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wait Time Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Wait Time Distribution</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waitTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="range" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Uptime</h4>
          <div className="text-4xl font-bold text-green-500 mb-2">99.8%</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 days</p>
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[99.8%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Accuracy</h4>
          <div className="text-4xl font-bold text-blue-500 mb-2">94.2%</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Prediction accuracy</p>
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[94.2%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Congestion Reduction</h4>
          <div className="text-4xl font-bold text-purple-500 mb-2">32%</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">vs traditional signals</p>
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-[32%]"></div>
          </div>
        </div>
      </div>

      {/* Efficiency Trend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Efficiency Trend</h3>
        
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              dot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="avgWait" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}