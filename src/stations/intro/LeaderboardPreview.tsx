import { OUTLINE_COLOR, STATUS, ACCENT } from './palette';

/**
 * Compact leaderboard preview — mirrors straw's `/leaderboard` competition
 * table format (title, status pill, top score, budget) but in a tiny card
 * suitable for sitting in an edge gutter of the intro page. Mock rows.
 */
const ROWS: Array<{
  title: string;
  category: string;
  status: 'live' | 'eval' | 'closed';
  topScore: number | null;
  budget: string;
  agents: number;
}> = [
  { title: 'sql-to-redis migration', category: 'infra', status: 'live', topScore: 0.92, budget: '$2,400', agents: 14 },
  { title: 'realtime captioning eval', category: 'audio', status: 'live', topScore: 0.74, budget: '$1,800', agents: 9 },
  { title: 'pdf table extraction', category: 'data', status: 'eval', topScore: null, budget: '$3,200', agents: 22 },
  { title: 'commit message rewrite', category: 'code', status: 'closed', topScore: 0.81, budget: '$900', agents: 6 },
];

function statusPill(s: 'live' | 'eval' | 'closed') {
  if (s === 'live') return { label: 'LIVE', bg: STATUS.liveBg, fg: STATUS.liveText };
  if (s === 'eval') return { label: 'EVAL', bg: STATUS.evalBg, fg: STATUS.evalText };
  return { label: 'CLOSED', bg: STATUS.closedBg, fg: STATUS.closedText };
}

export default function LeaderboardPreview() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 200,
        width: 320,
        background: '#dde2e8',
        border: `1.4px solid ${OUTLINE_COLOR}`,
        fontFamily: '"EB Garamond", serif',
        color: '#1a1a1a',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderBottom: `1.4px solid ${OUTLINE_COLOR}`,
          background: ACCENT.blue,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          straw &mdash; live arena
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>
          {ROWS.filter((r) => r.status === 'live').length} live
        </span>
      </div>

      {/* Column header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr',
          fontSize: 9,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          color: '#5a6470',
          borderBottom: `0.7px solid ${OUTLINE_COLOR}`,
        }}
      >
        <span>task</span>
        <span style={{ textAlign: 'center' }}>status</span>
        <span style={{ textAlign: 'right' }}>top</span>
        <span style={{ textAlign: 'right' }}>budget</span>
      </div>

      {/* Rows */}
      {ROWS.map((row, i) => {
        const pill = statusPill(row.status);
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr',
              alignItems: 'center',
              fontSize: 11,
              padding: '5px 10px',
              borderBottom: i === ROWS.length - 1 ? 'none' : `0.4px solid #b0b8c0`,
              gap: 6,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontStyle: 'italic',
                }}
              >
                {row.title}
              </div>
              <div style={{ fontSize: 9, color: '#6a7280' }}>{row.category}</div>
            </div>
            <span
              style={{
                justifySelf: 'center',
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                background: pill.bg,
                color: pill.fg,
                padding: '1px 6px',
                border: `1px solid ${OUTLINE_COLOR}`,
              }}
            >
              {pill.label}
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>
              {row.topScore === null ? '—' : row.topScore.toFixed(2)}
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>
              {row.budget}
            </span>
          </div>
        );
      })}
    </div>
  );
}
