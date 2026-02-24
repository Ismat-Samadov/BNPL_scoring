import { getDashboardStats } from '@/lib/synthetic-data';
import KpiGrid from '@/components/dashboard/kpi-grid';
import RiskHistogram from '@/components/dashboard/risk-histogram';
import FarmScatter from '@/components/dashboard/farm-scatter';
import ProductBar from '@/components/dashboard/product-bar';
import SegmentTable from '@/components/dashboard/segment-table';

export const metadata = { title: 'Analytics Dashboard — BNPLScore' };

export default function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Analytics <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Insights from {stats.total.toLocaleString()} pre-scored synthetic farmer profiles.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6">
        <KpiGrid stats={stats} />
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <RiskHistogram data={stats.pdHistogram} />
        <ProductBar data={stats.productCounts} />
      </div>

      <div className="mb-6">
        <FarmScatter data={stats.scatterData} />
      </div>

      {/* Segment tables */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SegmentTable title="By Farm Type" data={stats.farmTypeCounts} total={stats.total} />
        <SegmentTable title="By Region" data={stats.regionCounts} total={stats.total} />
        <SegmentTable title="By Risk Tier" data={stats.tierCounts} total={stats.total} />
      </div>
    </div>
  );
}
