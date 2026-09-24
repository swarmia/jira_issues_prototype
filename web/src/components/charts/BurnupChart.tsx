import { useMemo, useState } from 'react';
import type { BurnupPoint } from '../../gql/types';
import { formatShortDate } from '../../lib/format';
import { styles } from './BurnupChart.styles';

const WIDTH = 720;
const HEIGHT = 180;
const LEFT = 40;
const RIGHT = 712;
const TOP = 10;
const BOTTOM = 150;
const GRID_LINES = 4;

interface BurnupChartProps {
  points: BurnupPoint[];
  from: string;
  to: string;
  startedAt: string | null;
}

export function BurnupChart({ points, from, to, startedAt }: BurnupChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const start = new Date(from).getTime();
    const end = Math.max(new Date(to).getTime(), start + 24 * 3600 * 1000);
    const maxScope = Math.max(1, ...points.map(point => point.scope));
    const step = Math.max(1, Math.ceil(maxScope / GRID_LINES));
    const yMax = step * GRID_LINES;

    const x = (value: string | number) =>
      LEFT + ((new Date(value).getTime() - start) / (end - start)) * (RIGHT - LEFT);
    const y = (value: number) => BOTTOM - (value / yMax) * (BOTTOM - TOP);

    const placed = points.map(point => ({ ...point, x: x(point.date) }));
    const ticks = Array.from({ length: 7 }, (_, index) => {
      const at = start + ((end - start) * index) / 6;
      return {
        x: x(at),
        label: formatShortDate(new Date(at)),
        anchor: (index === 0 ? 'start' : index === 6 ? 'end' : 'middle') as 'start' | 'end' | 'middle',
      };
    });

    return {
      placed,
      x,
      y,
      yTicks: Array.from({ length: GRID_LINES + 1 }, (_, index) => index * step),
      ticks,
      startedX: startedAt ? x(startedAt) : null,
    };
  }, [points, from, to, startedAt]);

  const area = (accessor: (point: BurnupPoint) => number) => {
    const { placed, y } = chart;
    if (placed.length === 0) return '';
    const commands = [`M ${placed[0]!.x} ${BOTTOM}`];
    placed.forEach((point, index) => {
      if (index > 0) commands.push(`L ${point.x} ${y(accessor(placed[index - 1]!))}`);
      commands.push(`L ${point.x} ${y(accessor(point))}`);
    });
    commands.push(`L ${RIGHT} ${y(accessor(placed[placed.length - 1]!))}`, `L ${RIGHT} ${BOTTOM}`, 'Z');
    return commands.join(' ');
  };

  const hovered = hover === null ? null : chart.placed[hover];

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    chart.placed.forEach((point, index) => {
      if (Math.abs(point.x - position) < Math.abs(chart.placed[nearest]!.x - position)) nearest = index;
    });
    setHover(chart.placed.length ? nearest : null);
  };

  return (
    <div style={styles.wrapper} data-ui="BurnupChart.wrapper">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={styles.svg} data-ui="BurnupChart.svg"
        role="img"
        aria-label="Burn-up of scope and completed work"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <g stroke="var(--strokeLight)" strokeWidth={1}>
          {chart.yTicks.map(value => (
            <line key={value} x1={LEFT} x2={RIGHT} y1={chart.y(value)} y2={chart.y(value)} />
          ))}
        </g>
        <g fill="var(--textChartAxis)" fontSize={12} textAnchor="end">
          {chart.yTicks.map(value => (
            <text key={value} x={LEFT - 10} y={chart.y(value) + 4}>
              {value}
            </text>
          ))}
        </g>

        <path d={area(point => point.scope)} fill="var(--blue50)" />
        <path d={area(point => point.completed)} fill="var(--dataGreen)" />

        {chart.startedX !== null && (
          <>
            <line
              x1={chart.startedX}
              x2={chart.startedX}
              y1={TOP - 4}
              y2={BOTTOM}
              stroke="var(--blue300)"
              strokeDasharray="3 3"
            />
            <text x={chart.startedX + 6} y={TOP + 10} fontSize={12} fill="var(--textSecondary)">
              Started
            </text>
          </>
        )}

        <g fill="var(--white)" stroke="var(--blue500)" strokeWidth={2.5}>
          {chart.placed.map(point => (
            <circle key={`scope-${point.date}`} cx={point.x} cy={chart.y(point.scope)} r={4} />
          ))}
        </g>
        <g fill="var(--white)" stroke="var(--green600)" strokeWidth={2.5}>
          {chart.placed.map(point => (
            <circle key={`done-${point.date}`} cx={point.x} cy={chart.y(point.completed)} r={4} />
          ))}
        </g>

        {hovered && (
          <line x1={hovered.x} x2={hovered.x} y1={TOP - 4} y2={BOTTOM} stroke="var(--black300)" />
        )}

        <g fill="var(--textChartAxis)" fontSize={12}>
          {chart.ticks.map((tick, index) => (
            <text key={index} x={tick.x} y={BOTTOM + 22} textAnchor={tick.anchor}>
              {tick.label}
            </text>
          ))}
        </g>
      </svg>

      {hovered && (
        <div
          style={{ ...styles.tooltip, left: `${Math.min(88, Math.max(8, (hovered.x / WIDTH) * 100))}%` }} data-ui="BurnupChart.tooltip"
        >
          <div style={styles.tooltipTitle} data-ui="BurnupChart.tooltipTitle">{formatShortDate(hovered.date)}</div>
          <div>
            {hovered.completed} of {hovered.scope} done
          </div>
        </div>
      )}
    </div>
  );
}
