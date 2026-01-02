import { readFileSync } from "fs";
import path from "path";

export const coreVibecodePrompt = readFileSync(
  path.join(__dirname, "raw/core-vibecode-prompt.txt"),
  "utf8"
);

export const libRuntimePrompt = readFileSync(
  path.join(__dirname, "raw/lib-runtime-prompt.txt"),
  "utf8"
);

export const vibecodeFullPrompt = coreVibecodePrompt + "\n\n" + libRuntimePrompt;