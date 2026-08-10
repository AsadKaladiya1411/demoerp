import { useMemo } from 'react';
import { FlaskConical, PackageOpen, FileText, CheckCircle, Clock3, Boxes, Archive, PlayCircle, PieChart as PieIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getFormulaStatusChartData, getRndMetrics, getSampleStatusChartData, getTrialStatusChartData } from './rndReportsData';
import { useErpData } from '@/context/ErpContext';

const COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#16a34a', '#dc2626'];

export function RndDashboard() {
  const { rndBaseFormulas, rndFormulaVersions, rndTrials, rndSampleInventory } = useErpData();
  const metrics = getRndMetrics(rndBaseFormulas, rndFormulaVersions, rndTrials, rndSampleInventory);
  const formulaStatus = useMemo(() => getFormulaStatusChartData(rndFormulaVersions), [rndFormulaVersions]);
  const trialStatus = useMemo(() => getTrialStatusChartData(rndTrials), [rndTrials]);
  const sampleStatus = useMemo(() => getSampleStatusChartData(rndSampleInventory), [rndSampleInventory]);

  const summaryCards = [
    { title: 'Total Products', value: metrics.totalProducts, icon: Boxes },
    { title: 'Total Base Formulas', value: metrics.totalBaseFormulas, icon: FileText },
    { title: 'Total Trials', value: metrics.totalTrials, icon: FlaskConical },
    { title: 'Approved Formulas', value: metrics.approvedFormulas, icon: CheckCircle },
    { title: 'Active Formulas', value: metrics.activeFormulas, icon: PlayCircle },
    { title: 'Archived Formulas', value: metrics.archivedFormulas, icon: Archive },
    { title: 'Sample Inventory Items', value: metrics.sampleInventoryItems, icon: PackageOpen },
    { title: 'Pending Assessments', value: metrics.pendingAssessments, icon: Clock3 },
  ];

  const chartBlocks = [
    { title: 'Formula Status', data: formulaStatus },
    { title: 'Trial Status', data: trialStatus },
    { title: 'Sample Inventory Status', data: sampleStatus },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <FlaskConical className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">R&D Dashboard</h2>
          <p className="text-sm text-muted-foreground">Live R&D summary across formulas, trials, assessments, and sample inventory.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {chartBlocks.map(block => (
          <Card key={block.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieIcon className="h-4 w-4" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={block.data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={4}>
                    {block.data.map((entry, index) => (
                      <Cell key={`${block.title}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
