import { defineConfig } from "tsup";
import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("tsup-config.json", "utf-8"));

export default defineConfig(config);
