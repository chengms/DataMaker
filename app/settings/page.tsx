import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { getOrCreateSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getOrCreateSettings();
  return <SettingsPageShell initialSettings={settings} />;
}
