import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { memo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TrafficFlowChartProps {
  data: Array<{
    time: string;
    north: number;
    south: number;
    east: number;
    west: number;
  }>;
}

export const TrafficFlowChart = memo(({ data }: TrafficFlowChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? '#374151' : '#E5E7EB'} 
          opacity={0.5} 
        />
        <XAxis 
          dataKey="time" 
          stroke={isDark ? '#9CA3AF' : '#6B7280'} 
        />
        <YAxis 
          stroke={isDark ? '#9CA3AF' : '#6B7280'}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
            borderRadius: '8px',
            color: isDark ? '#F3F4F6' : '#111827',
          }}
          labelStyle={{
            color: isDark ? '#F3F4F6' : '#111827',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="north" 
          name="North" 
          stroke="#EF4444" 
          strokeWidth={3} 
          dot={{ r: 5, fill: '#EF4444' }}
          activeDot={{ r: 7 }}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="south" 
          name="South" 
          stroke="#F59E0B" 
          strokeWidth={3} 
          dot={{ r: 5, fill: '#F59E0B' }}
          activeDot={{ r: 7 }}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="east" 
          name="East" 
          stroke="#10B981" 
          strokeWidth={3} 
          dot={{ r: 5, fill: '#10B981' }}
          activeDot={{ r: 7 }}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="west" 
          name="West" 
          stroke="#3B82F6" 
          strokeWidth={3} 
          dot={{ r: 5, fill: '#3B82F6' }}
          activeDot={{ r: 7 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

TrafficFlowChart.displayName = 'TrafficFlowChart';