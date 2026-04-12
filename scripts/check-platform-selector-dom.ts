import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const platformSelectorSource = readFileSync("components/create-task/PlatformSelector.tsx", "utf8");
const checkboxSource = readFileSync("components/ui/checkbox.tsx", "utf8");

const platformUsesOuterButton = platformSelectorSource.includes("<button");
const platformUsesAccessibleCard = platformSelectorSource.includes('role="checkbox"');
const platformUsesPassiveCheckbox = platformSelectorSource.includes("<Checkbox checked={checked} />");
const checkboxSupportsPassiveMarkup =
  checkboxSource.includes("if (!onCheckedChange)") && checkboxSource.includes("<span");

assert.equal(
  platformUsesOuterButton,
  false,
  "PlatformSelector outer card should not render as a button.",
);

assert.equal(
  platformUsesAccessibleCard,
  true,
  "PlatformSelector should expose checkbox semantics for keyboard and screen-reader access.",
);

assert.equal(
  platformUsesPassiveCheckbox && !checkboxSupportsPassiveMarkup,
  false,
  "PlatformSelector currently nests a button-based Checkbox inside a button card.",
);

console.log("PlatformSelector no longer nests button elements.");
