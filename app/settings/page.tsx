import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { getDefaultSettings, getOrCreateSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getOrCreateSettings();
  const defaultSettings = getDefaultSettings();
  return <SettingsPageShell initialSettings={settings} defaultSettings={defaultSettings} />;
}
