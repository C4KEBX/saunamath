import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

const fontFamily = "Inter";
for (const weight of ["600", "800", "900"]) {
  loadFont({ family: fontFamily, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
}

export const C = {
  bg: "#16120f",
  bg2: "#2a1d14",
  cedar: "#e08a45",
  sand: "#f6efe6",
  muted: "#bfae9b",
  ok: "#7fc49b",
};

export type Show =
  | { type: "hook"; lines: string[]; accent?: string }
  | { type: "big"; value: number; prefix?: string; suffix?: string; decimals?: number; label: string }
  | { type: "compare"; title?: string; items: { label: string; value: number; display: string }[] }
  | { type: "list"; title: string; items: string[] }
  | { type: "cta"; keyword: string; site: string };

export type Word = { text: string; startMs: number; endMs: number };
export type Beat = { show: Show; startMs: number; endMs: number };
export type Timeline = { id: string; audio?: string; durationMs: number; beats: Beat[]; words: Word[] };

const norm = (t: string) => t.replace(/[^\w$.¢%]/g, "").toLowerCase();
const ms2f = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

/** Warm wood-slat backdrop that drifts slowly so no frame is ever static. */
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 120;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, ${C.bg2} 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{ opacity: 0.18, transform: `translateY(${-shift}px)` }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 120 - 120, height: 104, background: i % 2 ? "#5a3a22" : "#4a2f1c", borderRadius: 6 }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(22,18,15,.55) 0%, rgba(22,18,15,.2) 40%, rgba(22,18,15,.85) 100%)" }} />
    </AbsoluteFill>
  );
};

const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 180 } });
};

const Hook: React.FC<{ s: Extract<Show, { type: "hook" }> }> = ({ s }) => (
  <div style={{ padding: "0 70px", textAlign: "center" }}>
    {s.lines.map((line, i) => {
      const p = usePop(i * 6);
      return (
        <div key={i} style={{ fontSize: line.length <= 6 ? 220 : 112, fontWeight: 900, lineHeight: 1.04, color: C.sand, transform: `scale(${0.7 + 0.3 * p})`, opacity: p, marginBottom: 14 }}>
          {line.split(" ").map((w, j) => (
            <span key={j} style={{ color: s.accent && norm(w) === norm(s.accent) ? C.cedar : C.sand }}>{w} </span>
          ))}
        </div>
      );
    })}
  </div>
);

const Big: React.FC<{ s: Extract<Show, { type: "big" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const p = usePop();
  const v = interpolate(frame, [0, 18], [0, s.value], { extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const shown = v.toLocaleString("en-US", { minimumFractionDigits: s.decimals ?? 0, maximumFractionDigits: s.decimals ?? 0 });
  return (
    <div style={{ textAlign: "center", transform: `scale(${0.8 + 0.2 * p})` }}>
      <div style={{ fontSize: 250, fontWeight: 900, color: C.cedar, letterSpacing: -6, lineHeight: 1 }}>{s.prefix}{shown}{s.suffix}</div>
      <div style={{ fontSize: 64, fontWeight: 800, color: C.sand, marginTop: 24, padding: "0 80px" }}>{s.label}</div>
    </div>
  );
};

const Compare: React.FC<{ s: Extract<Show, { type: "compare" }> }> = ({ s }) => {
  const max = Math.max(...s.items.map((i) => i.value));
  return (
    <div style={{ width: 900 }}>
      {s.title && <div style={{ fontSize: 60, fontWeight: 800, color: C.muted, textAlign: "center", marginBottom: 40 }}>{s.title}</div>}
      {s.items.map((it, i) => {
        const p = usePop(i * 10);
        return (
          <div key={i} style={{ marginBottom: 46, opacity: p }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 58, fontWeight: 800, color: C.sand, marginBottom: 12 }}>
              <span>{it.label}</span><span style={{ color: i === 0 ? C.cedar : C.sand }}>{it.display}</span>
            </div>
            <div style={{ height: 54, background: "rgba(255,255,255,.08)", borderRadius: 14 }}>
              <div style={{ height: "100%", width: `${(it.value / max) * 100 * p}%`, background: i === 0 ? C.cedar : C.muted, borderRadius: 14 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const List: React.FC<{ s: Extract<Show, { type: "list" }> }> = ({ s }) => (
  <div style={{ width: 920 }}>
    <div style={{ fontSize: 68, fontWeight: 900, color: C.cedar, marginBottom: 40, textAlign: "center" }}>{s.title}</div>
    {s.items.map((it, i) => {
      const p = usePop(8 + i * 12);
      return (
        <div key={i} style={{ display: "flex", gap: 28, alignItems: "center", fontSize: 58, fontWeight: 800, color: C.sand, marginBottom: 34, opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>
          <div style={{ minWidth: 84, height: 84, borderRadius: 42, background: C.cedar, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>{i + 1}</div>
          <div>{it}</div>
        </div>
      );
    })}
  </div>
);

const Cta: React.FC<{ s: Extract<Show, { type: "cta" }> }> = ({ s }) => {
  const p = usePop();
  const frame = useCurrentFrame();
  const pulse = 1 + 0.04 * Math.sin(frame / 4);
  return (
    <div style={{ textAlign: "center", opacity: p }}>
      <div style={{ fontSize: 66, fontWeight: 800, color: C.sand }}>Comment</div>
      <div style={{ display: "inline-block", margin: "24px 0", padding: "18px 56px", borderRadius: 24, background: C.cedar, color: C.bg, fontSize: 150, fontWeight: 900, transform: `scale(${pulse})` }}>{s.keyword}</div>
      <div style={{ fontSize: 56, fontWeight: 800, color: C.sand, padding: "0 90px" }}>and I'll send you the free sauna cost calculator</div>
      <div style={{ fontSize: 44, fontWeight: 600, color: C.muted, marginTop: 40 }}>{s.site}</div>
    </div>
  );
};

const Visual: React.FC<{ show: Show }> = ({ show }) => {
  switch (show.type) {
    case "hook": return <Hook s={show} />;
    case "big": return <Big s={show} />;
    case "compare": return <Compare s={show} />;
    case "list": return <List s={show} />;
    case "cta": return <Cta s={show} />;
  }
};

/** One to three words at a time, centred in the lower third. */
const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const chunks: Word[][] = [];
  for (const w of words) {
    const last = chunks[chunks.length - 1];
    if (last && last.length < 3 && w.startMs - last[last.length - 1].endMs < 250 && !/[.,!?]$/.test(last[last.length - 1].text)) last.push(w);
    else chunks.push([w]);
  }
  const cur = chunks.find((c) => t >= c[0].startMs && t < c[c.length - 1].endMs + 120);
  if (!cur) return null;
  return (
    <div style={{ position: "absolute", top: 1430, left: 60, right: 60, textAlign: "center", fontSize: 84, fontWeight: 900, color: "#fff", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,.6)", textTransform: "uppercase" }}>
      {cur.map((w, i) => (
        <span key={i} style={{ color: t >= w.startMs ? "#fff" : "rgba(255,255,255,.55)" }}>{w.text.replace(/[,.]$/, "")} </span>
      ))}
    </div>
  );
};

export const Short: React.FC<Timeline> = ({ audio, beats, words }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontSize: 40, fontWeight: 900, letterSpacing: 6, color: C.sand, opacity: 0.85 }}>
        SAUNA<span style={{ color: C.cedar }}>MATH</span>
      </div>
      {beats.map((b, i) => {
        const from = i === 0 ? 0 : ms2f(b.startMs, fps);
        const to = i === beats.length - 1 ? ms2f(b.endMs, fps) + 30 : ms2f(beats[i + 1].startMs, fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 380 }}>
              <Visual show={b.show} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Captions words={words} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
