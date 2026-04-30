

import { useLayoutEffect, useEffect, useCallback } from "react";
import TunerScene, { useTunerAgent } from "./tuner/TunerScene";

export default function LandingArena({
  height,
  hideControls = false,
  zoom = 25,
  paused = false,
  showPaths: showPathsProp,
}: {
  height: number;
  /** When true, suppress the built-in conference/round-table/emoji/ping-pong
   *  button strip so the caller can render its own controls elsewhere. */
  hideControls?: boolean;
  /** Camera zoom for the orthographic iso view. Lower = office renders
   *  smaller within the canvas (more margin at the edges). Defaults to
   *  25 (straw's value). */
  zoom?: number;
  /** When true, the R3F render loop runs on demand instead of every frame —
   *  used to pause off-viewport arenas so they don't burn CPU/GPU when the
   *  user can't see them. */
  paused?: boolean;
  /** Override the agent-path debug overlay. When undefined, falls back to
   *  whatever useTunerAgent has set internally (off by default). The
   *  landing page uses this to flip paths on while the user hovers a
   *  specific arena. */
  showPaths?: boolean;
}) {
  const {
    cohort,
    stationIdxByAgent,
    tuning,
    gymTuning,
    miscTuning,
    agentRef,
    navOverrides,
    wallBury,
    showPaths,
    showNav,
    triggerJoin,
    triggerStandup,
    triggerDevAction,
    sendToStation,
    stations,
  } = useTunerAgent({ initialCohort: "arena", initialAmbientAll: true });

  // Hide agents for a single layout pass so they don't render piled up
  // on the spawn grid before triggerJoin teleports them — but unlike the
  // original 14-second staggered entrance (400 + i * 900 ms each), we
  // immediately trigger every agent on the next animation frame so the
  // office is populated within ~one frame of mount.
  useLayoutEffect(() => {
    for (const a of agentRef.current) {
      if (a) a.hidden = true;
    }
  }, [agentRef]);

  useEffect(() => {
    const timers: number[] = [];
    // Single rAF, then fire all triggerJoin calls in one tight loop so all
    // agents teleport to the door + start walking on the same frame. They
    // briefly cluster at the door, then disperse as their ambient picks
    // assign them roam targets — natural-looking and ~1s vs the original
    // ~14s staggered entrance.
    const rafId = requestAnimationFrame(() => {
      for (let i = 0; i < agentRef.current.length; i++) {
        triggerJoin();
      }
    });
    return () => {
      cancelAnimationFrame(rafId);
      for (const t of timers) window.clearTimeout(t);
    };
  }, [agentRef, triggerJoin]);

  // Pick a random visible (non-hidden) agent, pop an emoji over their head.
  const onEmoji = useCallback(() => {
    const visibleIdx: number[] = [];
    for (let i = 0; i < agentRef.current.length; i++) {
      const a = agentRef.current[i];
      if (a && !a.hidden) visibleIdx.push(i);
    }
    if (visibleIdx.length === 0) return;
    const pick = visibleIdx[Math.floor(Math.random() * visibleIdx.length)];
    triggerDevAction(pick, "emoji");
  }, [agentRef, triggerDevAction]);

  // Find the two ping-pong slots in the arena station list, send the first
  // two eligible idle agents to them. When each arrives, the tick loop
  // pairs them (same table, opposite side) and starts the game.
  const onPingPong = useCallback(() => {
    const agents = agentRef.current;
    const now = Date.now();
    const ppStationIdxs: number[] = [];
    for (let i = 0; i < stations.length; i++) {
      if (stations[i]?.pingPongTableUid) ppStationIdxs.push(i);
    }
    if (ppStationIdxs.length < 2) return;
    const eligible: number[] = [];
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (!a || a.hidden) continue;
      if (a.state === "walking" || a.state === "working_out") continue;
      if ((a.pingPongUntil ?? 0) > now) continue;
      if (a.pingPongTableUid) continue;
      if ((a.standupUntil ?? 0) > now) continue;
      if ((a.couchUntil ?? 0) > now) continue;
      if ((a.danceUntil ?? 0) > now) continue;
      eligible.push(i);
      if (eligible.length === 2) break;
    }
    if (eligible.length < 2) return;
    sendToStation(eligible[0], ppStationIdxs[0]);
    sendToStation(eligible[1], ppStationIdxs[1]);
  }, [agentRef, stations, sendToStation]);

  // External wiring — let any caller in the page (e.g. the intro side-link
  // strip) trigger this arena's actions by dispatching a window event.
  // All four arenas listen to the same four events, so one click fires in
  // all of them simultaneously.
  useEffect(() => {
    const onConference = () => triggerStandup("conference");
    const onRoundTable = () => triggerStandup("round_table");
    window.addEventListener("arena:conference", onConference);
    window.addEventListener("arena:round_table", onRoundTable);
    window.addEventListener("arena:emoji", onEmoji);
    window.addEventListener("arena:ping_pong", onPingPong);
    return () => {
      window.removeEventListener("arena:conference", onConference);
      window.removeEventListener("arena:round_table", onRoundTable);
      window.removeEventListener("arena:emoji", onEmoji);
      window.removeEventListener("arena:ping_pong", onPingPong);
    };
  }, [triggerStandup, onEmoji, onPingPong]);

  // Button outline accents — mirrors the ProcessFlow / Differentiators
  // 4-color pastel palette. Border-radius 6 matches the "Task makers
  // define winning" / "Builders compete on the real problem" cards.
  const buttons: Array<{ label: string; accent: string; onClick: () => void; title: string }> = [
    {
      label: "conference",
      accent: "#cfd5e8",
      onClick: () => triggerStandup("conference"),
      title: "Top-3 ranked agents speak at the front, rest listen in the audience",
    },
    {
      label: "round table",
      accent: "#e0d6d0",
      onClick: () => triggerStandup("round_table"),
      title: "6 closest eligible agents gather around the round table",
    },
    {
      label: "emoji",
      accent: "#ecd0cc",
      onClick: onEmoji,
      title: "Random celebration emoji over a random agent",
    },
    {
      label: "ping pong",
      accent: "#d0d7d1",
      onClick: onPingPong,
      title: "Send two eligible agents to the ping-pong table",
    },
  ];

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <TunerScene
        cohort={cohort}
        stationIdxByAgent={stationIdxByAgent}
        tuning={tuning}
        gymTuning={gymTuning}
        miscTuning={miscTuning}
        agentRef={agentRef}
        showPaths={showPathsProp ?? showPaths}
        showNav={showNav}
        navOverrides={navOverrides}
        view="iso"
        wallBury={wallBury}
        zoom={zoom}
        paused={paused}
      />
      {!hideControls && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 5,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {buttons.map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              title={b.title}
              className="px-2 py-1 text-[11px] font-sans backdrop-blur-sm transition-colors"
              style={{
                borderRadius: 999,
                border: `1px solid ${b.accent}`,
                background: "rgba(255, 255, 255, 0.9)",
                color: "#111",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = b.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
