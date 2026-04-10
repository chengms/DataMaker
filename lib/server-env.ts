import fs from "node:fs";
import path from "node:path";

const ENV_FILES = [".env.local", ".env"];

function parseEnvFile(filename: string) {
  const filepath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filepath)) {
    return {};
  }

  const content = fs.readFileSync(filepath, "utf8");

  return content.split("\n").reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    acc[key] = value;
    return acc;
  }, {});
}

export function getServerEnvValue(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  for (const file of ENV_FILES) {
    const parsed = parseEnvFile(file);
    if (parsed[name]) {
      return parsed[name];
    }
  }

  return undefined;
}
