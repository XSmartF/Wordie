import { useState, useEffect } from "react";
import { PageHeader, PageSection, PageShell } from "@/shared/components/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check current theme
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        titleClassName="text-lg font-semibold"
        description="Manage your application preferences"
      />

      <PageSection>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>
                Application information and version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Wordie</strong> - Master your vocabulary faster with smart study sets
                </p>
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </PageShell>
  );
}