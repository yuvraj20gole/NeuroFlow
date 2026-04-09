import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './routes';
import './suppress-warnings';
import { TrafficProvider } from '@/context/TrafficContext';

function App() {
  return (
    <ThemeProvider>
      <TrafficProvider>
        <RouterProvider router={router} />
      </TrafficProvider>
    </ThemeProvider>
  );
}

export default App;