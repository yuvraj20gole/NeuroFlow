// Suppress known Recharts duplicate key warnings
// These are internal Recharts library bugs that don't affect functionality

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  
  // Filter out Recharts duplicate key warnings
  if (
    message.includes('Encountered two children with the same key') ||
    message.includes('Keys should be unique')
  ) {
    return;
  }
  
  originalConsoleError.apply(console, args);
};

console.warn = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  
  // Filter out Recharts duplicate key warnings
  if (
    message.includes('Encountered two children with the same key') ||
    message.includes('Keys should be unique')
  ) {
    return;
  }
  
  originalConsoleWarn.apply(console, args);
};

export {};
