"""Voice every script in a batch with Edge TTS and write a timeline per video.

Usage: python tools/voice.py scripts/batch1.json [id ...]
Writes public/vo/<id>.mp3 and public/vo/<id>.json (the Short composition's props).
Runs on the Mac (Edge TTS is blocked in the cloud container).
"""
import asyncio, json, subprocess, sys, tempfile
from pathlib import Path

import edge_tts

VOICE = "en-US-AndrewNeural"
RATE = "+8%"
GAP_MS = 220  # pause between beats
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"


def duration_ms(path: Path) -> int:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return round(float(out) * 1000)


async def speak(text: str, path: Path) -> list[dict]:
    words = []
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000
                words.append({"text": chunk["text"], "startMs": start, "endMs": start + chunk["duration"] / 10_000})
    return words


async def voice(video: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        silence = tmp / "gap.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(GAP_MS / 1000), str(silence)], check=True)
        parts, beats, words, t = [], [], [], 0.0
        for i, beat in enumerate(video["beats"]):
            clip = tmp / f"b{i}.mp3"
            ws = await speak(beat["say"], clip)
            length = duration_ms(clip)
            words += [{**w, "startMs": round(w["startMs"] + t), "endMs": round(w["endMs"] + t)} for w in ws]
            beats.append({"show": beat["show"], "startMs": round(t), "endMs": round(t + length + GAP_MS)})
            parts += [clip, silence]
            t += length + GAP_MS
        listfile = tmp / "list.txt"
        listfile.write_text("".join(f"file '{p}'\n" for p in parts))
        mp3 = OUT / f"{video['id']}.mp3"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listfile), "-ar", "44100", "-ac", "1", "-b:a", "160k", str(mp3)], check=True)
    timeline = {"id": video["id"], "audio": f"vo/{video['id']}.mp3", "durationMs": duration_ms(mp3), "beats": beats, "words": words}
    (OUT / f"{video['id']}.json").write_text(json.dumps(timeline, ensure_ascii=False))
    print(f"voiced {video['id']}: {timeline['durationMs'] / 1000:.1f}s")


async def main() -> None:
    batch = json.loads(Path(sys.argv[1]).read_text())
    only = set(sys.argv[2:])
    for video in batch:
        if not only or video["id"] in only:
            await voice(video)


asyncio.run(main())
