// Voice and render a batch: node tools/make.mjs scripts/batch1.json [id ...]
// Needs the edge-tts venv (SM_PY, default ~/tmp/sm-tts/bin/python) and ffmpeg.
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";

const [batchPath = "scripts/batch1.json", ...only] = process.argv.slice(2);
const py = process.env.SM_PY || `${homedir()}/tmp/sm-tts/bin/python`;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

run(py, ["tools/voice.py", batchPath, ...only]);
mkdirSync("out", { recursive: true });
for (const { id } of JSON.parse(readFileSync(batchPath, "utf8"))) {
  if (only.length && !only.includes(id)) continue;
  run("npx", ["remotion", "render", "src/index.ts", "Short", `out/${id}.mp4`, `--props=public/vo/${id}.json`, "--concurrency=4"]);
}
