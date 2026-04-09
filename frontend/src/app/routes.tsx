import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Simulation } from './pages/Simulation';
import { Analysis } from './pages/Analysis';
import { Emergency } from './pages/Emergency';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'simulation', Component: Simulation },
      { path: 'analysis', Component: Analysis },
      { path: 'emergency', Component: Emergency },
      { path: 'analytics', Component: Analytics },
      { path: 'settings', Component: Settings },
    ],
  },
]);
