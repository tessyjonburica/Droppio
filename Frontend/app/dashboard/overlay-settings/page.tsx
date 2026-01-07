'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { overlayService } from '@/services/overlay.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Palette, Bell } from 'lucide-react';

export default function OverlaySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState({
    primaryColor: '#0F9E99',
    secondaryColor: '#EFFBFB',
    fontFamily: 'Inter',
    fontSize: 16,
    animationStyle: 'fade',
  });
  const [alertSettings, setAlertSettings] = useState({
    enabled: true,
    soundEnabled: true,
    minAmount: '1.00',
    showDuration: 5,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadOverlayConfig();
    }
  }, [user]);

  const loadOverlayConfig = async () => {
    if (!user?.id) return;
    try {
      const overlay = await overlayService.getConfig(user.id);
      if (overlay.theme) setTheme({ ...theme, ...overlay.theme });
      if (overlay.alert_settings) setAlertSettings({ ...alertSettings, ...overlay.alert_settings });
    } catch (error) {
      console.error('Failed to load overlay config:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please try logging in again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Overlay Settings] Saving config for user ID:', user.id);
      console.log('[Overlay Settings] User role:', user.role);
      console.log('[Overlay Settings] Data being sent:', { theme, alertSettings });
      
      await overlayService.updateConfig(user.id, {
        theme,
        alertSettings,
      });

      toast({
        title: 'Settings saved',
        description: 'Your overlay settings have been updated',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Overlay Settings] Save error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update overlay settings';
      const errorDetails = error.response?.data?.details || '';
      
      toast({
        title: 'Failed to save',
        description: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Overlay Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Theme
            </CardTitle>
            <CardDescription>Customize your overlay appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="primaryColor" className="text-sm font-medium">
                Primary Color
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <span className="text-sm font-mono">{theme.primaryColor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fontSize" className="text-sm font-medium">
                Font Size ({theme.fontSize}px)
              </label>
              <Input
                id="fontSize"
                type="range"
                value={theme.fontSize}
                onChange={(e) => setTheme({ ...theme, fontSize: parseInt(e.target.value) })}
                min="12"
                max="48"
                step="1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alert Settings
            </CardTitle>
            <CardDescription>Configure tip alert behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="enabled" className="text-sm font-medium">Enable alerts</label>
                <p className="text-xs text-muted-foreground">Show popup when a tip is received</p>
              </div>
              <input
                type="checkbox"
                id="enabled"
                checked={alertSettings.enabled}
                onChange={(e) => setAlertSettings({ ...alertSettings, enabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="soundEnabled" className="text-sm font-medium">Enable sound</label>
                <p className="text-xs text-muted-foreground">Play a notification sound</p>
              </div>
              <input
                type="checkbox"
                id="soundEnabled"
                checked={alertSettings.soundEnabled}
                onChange={(e) => setAlertSettings({ ...alertSettings, soundEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="minAmount" className="text-sm font-medium">
                Minimum Amount (USDC)
              </label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                value={alertSettings.minAmount}
                onChange={(e) => setAlertSettings({ ...alertSettings, minAmount: e.target.value })}
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Only tips above this amount will trigger an alert</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="showDuration" className="text-sm font-medium">
                Show Duration ({alertSettings.showDuration}s)
              </label>
              <Input
                id="showDuration"
                type="range"
                value={alertSettings.showDuration}
                onChange={(e) => setAlertSettings({ ...alertSettings, showDuration: parseInt(e.target.value) })}
                min="1"
                max="30"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

