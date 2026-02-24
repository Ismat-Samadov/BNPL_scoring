'use client';

import { motion } from 'framer-motion';

interface Props {
  pd: number; // 0–1
}

const SIZE = 220;
const CX = SIZE / 2;
const R = 85;
const STROKE = 16;

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CX + r * Math.sin(rad),
  };
}

function arcPath(startDeg: number, endDeg: number, r: number) {
  const start = polarToXY(startDeg, r);
  const end = polarToXY(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

const CIRCUMFERENCE = Math.PI * R; // semicircle

function pdToColor(pd: number) {
  if (pd < 0.15) return '#10b981';
  if (pd < 0.35) return '#6366f1';
  if (pd < 0.50) return '#f59e0b';
  return '#f43f5e';
}

export default function RiskGauge({ pd }: Props) {
  const pct = Math.min(pd, 1);
  const strokeDash = CIRCUMFERENCE;
  const strokeOffset = CIRCUMFERENCE * (1 - pct);
  const color = pdToColor(pd);

  // Needle angle: -90 (far left=0) to +90 (far right=1)
  const needleAngle = -90 + pct * 180;

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE * 0.65} viewBox={`0 0 ${SIZE} ${SIZE * 0.65}`}>
        {/* Background arc */}
        <path
          d={arcPath(-90, 90, R)}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-border"
        />
        {/* Colored fill arc */}
        <motion.path
          d={arcPath(-90, 90, R)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={strokeDash}
          initial={{ strokeDashoffset: strokeDash }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Needle */}
        <motion.line
          x1={CX}
          y1={CX}
          x2={CX}
          y2={CX - R + STROKE}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ rotate: -90, originX: `${CX}px`, originY: `${CX}px` }}
          animate={{ rotate: needleAngle }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: `${CX}px ${CX}px` }}
        />
        <circle cx={CX} cy={CX} r={5} fill={color} />

        {/* PD label */}
        <text x={CX} y={CX * 0.78} textAnchor="middle" className="fill-foreground font-mono text-2xl font-bold" fontSize={22}>
          {(pd * 100).toFixed(1)}%
        </text>
        <text x={CX} y={CX * 0.98} textAnchor="middle" fill="#6b7280" fontSize={10}>
          Late Payment Probability
        </text>

        {/* Scale labels */}
        <text x={14} y={CX + 18} fill="#6b7280" fontSize={9}>0%</text>
        <text x={SIZE - 26} y={CX + 18} fill="#6b7280" fontSize={9}>100%</text>
      </svg>

      {/* Tier labels */}
      <div className="mt-2 flex gap-3 text-xs">
        {[
          { label: 'Low', color: '#10b981' },
          { label: 'Medium', color: '#6366f1' },
          { label: 'High', color: '#f59e0b' },
          { label: 'Decline', color: '#f43f5e' },
        ].map(t => (
          <span key={t.label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
