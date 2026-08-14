import { useMemo } from 'react';

export function StatsView({ progress, totalWords }) {
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: 0,
      });
    }

    Object.values(progress).forEach((p) => {
      if (!p.learnedAt) return;
      const learnedDate = new Date(p.learnedAt);
      const day = days.find((d) => d.date.toDateString() === learnedDate.toDateString());
      if (day) day.count += 1;
    });

    return days;
  }, [progress]);

  const distribution = useMemo(() => {
    const levels = { 未学习: 0, 初学: 0, 熟悉: 0, 掌握: 0, 熟练: 0 };
    Object.values(progress).forEach((p) => {
      if (!p.learnedAt) levels['未学习'] += 1;
      else if (p.level >= 4) levels['熟练'] += 1;
      else if (p.level >= 2) levels['掌握'] += 1;
      else if (p.level >= 1) levels['熟悉'] += 1;
      else levels['初学'] += 1;
    });
    levels['未学习'] = Math.max(0, totalWords - Object.values(progress).length);
    return levels;
  }, [progress, totalWords]);

  const heatmapData = useMemo(() => {
    const data = {};
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 119);

    for (let i = 0; i < 120; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      data[key] = 0;
    }

    Object.values(progress).forEach((p) => {
      if (!p.learnedAt) return;
      const key = new Date(p.learnedAt).toISOString().split('T')[0];
      if (key in data) data[key] += 1;
    });

    const weeks = [];
    const totalDays = 120;
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 0; i < totalDays; i += 7) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i + j);
        const key = d.toISOString().split('T')[0];
        week.push({
          date: d,
          key,
          count: data[key] || 0,
          dayName: dayNames[j],
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [progress]);

  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);
  const chartHeight = 120;
  const barWidth = 32;
  const gap = 16;
  const chartWidth = last7Days.length * (barWidth + gap) - gap;

  const colors = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];
  const distEntries = Object.entries(distribution);
  const totalDist = distEntries.reduce((sum, [, v]) => sum + v, 0);

  const getHeatColor = (count) => {
    if (count === 0) return 'var(--border)';
    if (count <= 2) return '#86efac';
    if (count <= 5) return '#22c55e';
    if (count <= 10) return '#16a34a';
    return '#15803d';
  };

  return (
    <div className="stats-view">
      <h2>学习统计</h2>

      <section className="chart-section">
        <h3>近 7 天学习量</h3>
        <svg viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 40}`} className="bar-chart">
          <g transform="translate(20, 10)">
            {last7Days.map((d, i) => {
              const x = i * (barWidth + gap);
              const barHeight = (d.count / maxCount) * chartHeight;
              const y = chartHeight - barHeight;
              return (
                <g key={d.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill="var(--primary)"
                    opacity={0.8}
                  />
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--text)">
                    {d.count}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--text-muted)"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </section>

      <section className="chart-section">
        <h3>学习日历</h3>
        <div className="heatmap">
          {heatmapData.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((day) => (
                <div
                  key={day.key}
                  className="heatmap-day"
                  title={`${day.key} 学习 ${day.count} 个单词`}
                  style={{ background: getHeatColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>少</span>
          <div className="heatmap-legend-cell" style={{ background: 'var(--border)' }} />
          <div className="heatmap-legend-cell" style={{ background: '#86efac' }} />
          <div className="heatmap-legend-cell" style={{ background: '#22c55e' }} />
          <div className="heatmap-legend-cell" style={{ background: '#16a34a' }} />
          <div className="heatmap-legend-cell" style={{ background: '#15803d' }} />
          <span>多</span>
        </div>
      </section>

      <section className="chart-section">
        <h3>掌握度分布</h3>
        <div className="dist-grid">
          {distEntries.map(([label, value], i) => {
            const percent = totalDist ? Math.round((value / totalDist) * 100) : 0;
            return (
              <div key={label} className="dist-item">
                <span className="dist-color" style={{ background: colors[i % colors.length] }} />
                <span className="dist-label">{label}</span>
                <span className="dist-value">
                  {value} ({percent}%)
                </span>
                <div className="dist-bar">
                  <div className="dist-fill" style={{ width: `${percent}%`, background: colors[i % colors.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
