'use client';

interface Props {
  title: string;
  data: Record<string, number>;
  total: number;
}

export default function SegmentTable({ title, data, total }: Props) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Segment</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Count</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, count]) => (
            <tr key={name} className="border-b border-border/20 last:border-0">
              <td className="py-2 capitalize">{name}</td>
              <td className="py-2 text-right tabular-nums">{count}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {((count / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
