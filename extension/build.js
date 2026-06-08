import fs from "fs-extra";
import { execSync } from "child_process";

const browser = process.argv[2];

if (!["chrome", "firefox"].includes(browser)) {
    process.exit(1);
}

execSync(`VITE_OUTDIR=${browser} vite build`, { stdio: "inherit" });

const targetDir = `./${browser}`;

fs.copySync(`./public/manifests/${browser}.json`, `${targetDir}/manifest.json`);
fs.removeSync(`${targetDir}/manifests`);

if (browser === "firefox") {
    fs.removeSync(`${targetDir}/background.js`);
}