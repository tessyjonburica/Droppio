'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { overlayService } from '@/services/overlay.service';
import { useToast } from '@/hooks/use-toast';

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
    if (!user?.id) return;

    setIsLoading(true);

    try {
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
      toast({
        title: 'Failed to save',
        description: error.message || 'Failed to update overlay settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-header text-4xl text-primary mb-8">Overlay Settings</h1>

            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize your overlay appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="primaryColor" className="text-sm font-medium">
                    Primary Color
                  </label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="fontSize" className="text-sm font-medium">
                    Font Size
                  </label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={theme.fontSize}
                    onChange={(e) => setTheme({ ...theme, fontSize: parseInt(e.target.value) })}
                    min="12"
                    max="48"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure tip alert behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={alertSettings.enabled}
                    onChange={(e) => setAlertSettings({ ...alertSettings, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium">
                    Enable alerts
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="soundEnabled"
                    checked={alertSettings.soundEnabled}
                    onChange={(e) => setAlertSettings({ ...alertSettings, soundEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="soundEnabled" className="text-sm font-medium">
                    Enable sound
                  </label>
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
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="showDuration" className="text-sm font-medium">
                    Show Duration (seconds)
                  </label>
                  <Input
                    id="showDuration"
                    type="number"
                    value={alertSettings.showDuration}
                    onChange={(e) => setAlertSettings({ ...alertSettings, showDuration: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

