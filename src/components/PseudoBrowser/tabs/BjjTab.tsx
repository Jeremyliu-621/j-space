import { useState, useRef, useCallback, useEffect } from "react";

interface Annotation {
  id: number;
  timestamp: number; // seconds
  move: string;
  note: string;
}

const TOTAL_DURATION = 312; // 5:12

const ANNOTATIONS: Annotation[] = [
  { id: 1, timestamp: 12, move: "Collar drag to single leg", note: "Good level change — chin stayed tucked. Finish faster next time, opponent almost sprawled." },
  { id: 2, timestamp: 38, move: "Guard pull to closed guard", note: "Pulled guard after failed takedown. Not ideal — work the wrestling longer before conceding top." },
  { id: 3, timestamp: 67, move: "Hip bump sweep", note: "Timed perfectly off opponent's posture break. This is the A-game sweep — drill this side more." },
  { id: 4, timestamp: 95, move: "Mount → S-mount transition", note: "Hips stayed heavy through the transition. Opponent's frames were late. Keep this sequence." },
  { id: 5, timestamp: 142, move: "Armbar attempt from S-mount", note: "Lost the arm because hips came up too early. Pin the wrist, THEN swing the leg." },
  { id: 6, timestamp: 178, move: "Back take from scramble", note: "Good instinct on the scramble. Seatbelt grip was solid. Hooks need to come in faster." },
  { id: 7, timestamp: 223, move: "Rear naked choke attempt", note: "Got the chin strap but couldn't clear the jaw. Consider switching to short choke or arm triangle." },
  { id: 8, timestamp: 268, move: "Opponent escapes → reset to half guard", note: "Lost back control — hips disconnected. When they start turning, follow the hip line, don't reach." },
  { id: 9, timestamp: 295, move: "Underhook battle in half guard", note: "Won the underhook fight. Good shoulder pressure. Could have gone to dog fight earlier." },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function BjjTab() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<number | null>(null);

  const progress = currentTime / TOTAL_DURATION;

  // Find active annotation
  const activeIdx = (() => {
    for (let i = ANNOTATIONS.length - 1; i >= 0; i--) {
      if (currentTime >= ANNOTATIONS[i].timestamp) return i;
    }
    return -1;
  })();

  // Auto-scroll active card into view during playback
  const feedScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeIdx < 0 || !feedScrollRef.current) return;
    const card = feedScrollRef.current.children[activeIdx] as HTMLElement;
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  // Scrubber drag
  const handleScrubberDown = useCallback(
    (e: React.PointerEvent) => {
      const bar = scrubberRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const update = (clientX: number) => {
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        setCurrentTime(pct * TOTAL_DURATION);
      };
      update(e.clientX);

      const onMove = (ev: PointerEvent) => update(ev.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    []
  );

  // Play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = window.setInterval(() => {
        setCurrentTime((t) => {
          if (t >= TOTAL_DURATION) {
            clearInterval(playIntervalRef.current!);
            setIsPlaying(false);
            return 0;
          }
          return t + 0.1;
        });
      }, 100);
    }
  }, [isPlaying]);

  const jumpTo = useCallback((ts: number) => {
    setCurrentTime(ts);
  }, []);

  return (
    <div className="bjj-container">
      {/* Left: Video player */}
      <div className="bjj-player">
        <div className="bjj-video-area">
          <div className="bjj-video-placeholder">
            <span className="bjj-video-label">VIDEO: competition footage — IBJJF No-Gi Open 2024</span>
            <div className="bjj-video-scanlines" />
          </div>
        </div>
        <div className="bjj-controls">
          <button className="bjj-play-btn" onClick={togglePlay}>
            {isPlaying ? "▮▮" : "▶"}
          </button>
          <span className="bjj-timestamp">
            {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
          </span>
          <div
            className="bjj-scrubber"
            ref={scrubberRef}
            onPointerDown={handleScrubberDown}
          >
            <div className="bjj-scrubber-fill" style={{ width: `${progress * 100}%` }} />
            <div className="bjj-scrubber-head" style={{ left: `${progress * 100}%` }} />
            {/* Annotation markers */}
            {ANNOTATIONS.map((a) => (
              <div
                key={a.id}
                className="bjj-scrubber-marker"
                style={{ left: `${(a.timestamp / TOTAL_DURATION) * 100}%` }}
              />
            ))}
          </div>
          <button className="bjj-fullscreen-btn">⛶</button>
        </div>
      </div>

      {/* Right: Annotation feed */}
      <div className="bjj-feed">
        <div className="bjj-feed-header">TAPE NOTES</div>
        <div className="bjj-feed-scroll" ref={feedScrollRef}>
          {ANNOTATIONS.map((a, idx) => (
            <div
              key={a.id}
              className={`bjj-card${idx === activeIdx ? " bjj-card-active" : ""}`}
              onClick={() => jumpTo(a.timestamp)}
            >
              <div className="bjj-card-ts">{formatTime(a.timestamp)}</div>
              <div className="bjj-card-body">
                <div className="bjj-card-move">{a.move}</div>
                <div className="bjj-card-note">{a.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
