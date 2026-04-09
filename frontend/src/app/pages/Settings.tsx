import { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Sliders, Save } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [maxGreenTime, setMaxGreenTime] = useState(90);
  const [minGreenTime, setMinGreenTime] = useState(20);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [learningRate, setLearningRate] = useState(0.001);
  const [autoMode, setAutoMode] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [emergencyPriority, setEmergencyPriority] = useState(true);

  const handleSaveSettings = () => {
    console.log('Settings saved:', {
      maxGreenTime,
      minGreenTime,
      simulationSpeed,
      learningRate,
      autoMode,
      soundAlerts,
      emergencyPriority
    });
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setMaxGreenTime(90);
    setMinGreenTime(20);
    setSimulationSpeed(1);
    setLearningRate(0.001);
    setAutoMode(true);
    setSoundAlerts(false);
    setEmergencyPriority(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure system parameters and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            {theme === 'light' ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-blue-400" />
            )}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle theme</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preview</h4>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full shadow-lg"></div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full shadow-lg"></div>
                <div className="w-8 h-8 bg-green-500 rounded-full shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Parameters */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Signal Parameters</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Green Time
                </label>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{maxGreenTime}s</span>
              </div>
              <Slider
                value={[maxGreenTime]}
                onValueChange={(v) => setMaxGreenTime(v[0])}
                min={30}
                max={180}
                step={5}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Maximum duration for green signal</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Green Time
                </label>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{minGreenTime}s</span>
              </div>
              <Slider
                value={[minGreenTime]}
                onValueChange={(v) => setMinGreenTime(v[0])}
                min={10}
                max={60}
                step={5}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Minimum duration for green signal</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Simulation Speed
                </label>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{simulationSpeed}x</span>
              </div>
              <Slider
                value={[simulationSpeed]}
                onValueChange={(v) => setSimulationSpeed(v[0])}
                min={0.5}
                max={5}
                step={0.5}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Adjust simulation playback speed</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Neuro-Fuzzy Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Neural Network Learning Rate
            </label>
            <Input
              type="number"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              step={0.0001}
              className="bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Default: 0.001</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Fuzzy Rule Weight
            </label>
            <Input
              type="number"
              defaultValue={0.75}
              step={0.05}
              className="bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Balance between fuzzy and neural</p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Density</label>
              <Input
                type="number"
                defaultValue={30}
                className="mt-2 bg-white dark:bg-gray-700"
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium Density</label>
              <Input
                type="number"
                defaultValue={50}
                className="mt-2 bg-white dark:bg-gray-700"
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">High Density</label>
              <Input
                type="number"
                defaultValue={75}
                className="mt-2 bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Preferences</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Auto Mode</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-controlled signal timing</p>
            </div>
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Sound Alerts</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Audio notifications</p>
            </div>
            <Switch
              checked={soundAlerts}
              onCheckedChange={setSoundAlerts}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Emergency Priority</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Override for emergency vehicles</p>
            </div>
            <Switch
              checked={emergencyPriority}
              onCheckedChange={setEmergencyPriority}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Real-time Logging</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record all system events</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          onClick={handleReset}
          variant="outline"
          className="px-8"
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSaveSettings}
          className="px-8 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
            <p className="font-bold text-gray-900 dark:text-white">v2.3.1</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
            <p className="font-bold text-gray-900 dark:text-white">Apr 8, 2026</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI Model</p>
            <p className="font-bold text-gray-900 dark:text-white">NF-v3.2</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className="font-bold text-green-600 dark:text-green-400">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
