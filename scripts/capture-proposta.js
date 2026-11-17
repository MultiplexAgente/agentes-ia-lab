import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.resolve("C:\\Users\\antho\\.gemini\\antigravity\\brain\\099b8213-bdd3-494a-b7d0-e1a02663d756");

const targets = [
  { name: "proposta_hero_1920x1080.png", w: 1920, h: 1080, url: "http://localhost:8080/proposta" },
  { name: "proposta_full_1920x3600.png", w: 1920, h: 3600, url: "http://localhost:8080/proposta" },
];

for (const t of targets) {
  const tempPath = path.join(process.env.TEMP || "C:\\temp", t.name);
  const destPath = path.join(outDir, t.name);

  const cmd = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --window-size=${t.w},${t.h} --virtual-time-budget=6000 "--screenshot=${tempPath}" "${t.url}"`;
  console.log(`Capturing ${t.name}...`);
  try {
    execSync(cmd, { stdio: "inherit" });
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, destPath);
      console.log(`Saved to ${destPath}`);
    } else {
      console.error(`File not generated: ${tempPath}`);
    }
  } catch (err) {
    console.error(`Failed to capture ${t.name}:`, err);
  }
}
