interface TrafficLightProps {
  active: 'red' | 'yellow' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

export function TrafficLight({ active, size = 'md' }: TrafficLightProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  
  const lightSize = sizeClasses[size];

  return (
    <div className="flex flex-col gap-1 bg-gray-800 dark:bg-gray-950 p-2 rounded-lg">
      <div 
        className={`${lightSize} rounded-full transition-all ${
          active === 'red' 
            ? 'bg-red-500 shadow-lg shadow-red-500/50' 
            : 'bg-red-900/30'
        }`}
      />
      <div 
        className={`${lightSize} rounded-full transition-all ${
          active === 'yellow' 
            ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' 
            : 'bg-yellow-900/30'
        }`}
      />
      <div 
        className={`${lightSize} rounded-full transition-all ${
          active === 'green' 
            ? 'bg-green-500 shadow-lg shadow-green-500/50' 
            : 'bg-green-900/30'
        }`}
      />
    </div>
  );
}
