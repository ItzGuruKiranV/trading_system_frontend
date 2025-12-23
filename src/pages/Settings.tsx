import React, { useState } from 'react';
import { userSettings, tradingPairs, timeframes } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Save, Bell, Volume2, Moon, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState(userSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">Customize your trading experience</p>
        </div>
        <Button variant="trading" onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Trading Defaults */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Trading Defaults</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Default Pair</p>
                <p className="text-sm text-muted-foreground">Primary pair to display on charts</p>
              </div>
              <Select 
                value={settings.defaultPair} 
                onValueChange={(value) => setSettings({ ...settings, defaultPair: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.map((pair) => (
                    <SelectItem key={pair.symbol} value={pair.symbol}>
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Default Timeframe</p>
                <p className="text-sm text-muted-foreground">Primary timeframe for analysis</p>
              </div>
              <Select 
                value={settings.defaultTimeframe} 
                onValueChange={(value) => setSettings({ ...settings, defaultTimeframe: value })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Trading Systems</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">System 1</p>
                <p className="text-sm text-muted-foreground">Market Structure Strategy</p>
              </div>
              <Switch 
                checked={settings.enabledSystems.includes('system1')}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSettings({ ...settings, enabledSystems: [...settings.enabledSystems, 'system1'] });
                  } else {
                    setSettings({ ...settings, enabledSystems: settings.enabledSystems.filter(s => s !== 'system1') });
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg opacity-50">
              <div>
                <p className="font-medium text-foreground">System 2</p>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts for trade opportunities</p>
              </div>
              <Switch 
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Sound Alerts</p>
                  <p className="text-sm text-muted-foreground">Play sound for important events</p>
                </div>
              </div>
              <Switch 
                checked={settings.soundAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, soundAlerts: checked })}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Moon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
            </div>
            <Switch 
              checked={settings.darkMode}
              onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 border-destructive/30">
          <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Reset All Settings</p>
              <p className="text-sm text-muted-foreground">Restore all settings to their defaults</p>
            </div>
            <Button variant="destructive" size="sm">
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
