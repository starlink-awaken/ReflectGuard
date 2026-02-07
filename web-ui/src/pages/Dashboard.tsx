import { useEffect } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { StatCard } from '../components/Dashboard/StatCard';
import { TrendChart } from '../components/Dashboard/TrendChart';
import { EventStream } from '../components/Dashboard/EventStream';
import { Activity, AlertCircle, Clock, FileText } from 'lucide-react';

const PERIODS = [
  { value: 'today' as const, label: '今日' },
  { value: 'week' as const, label: '本周' },
  { value: 'month' as const, label: '本月' },
  { value: 'year' as const, label: '本年' },
];

export default function Dashboard() {
  const { dashboard, currentPeriod, loading, error, fetchDashboard, setPeriod } = useAnalyticsStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePeriodChange = (period: typeof currentPeriod) => {
    setPeriod(period);
    fetchDashboard(period);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">PRISM-Gateway 仪表板</h1>
              <p className="text-sm text-muted-foreground mt-1">
                实时监控 Gateway 检查和复盘数据
              </p>
            </div>
            <div className="flex gap-2">
              {PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => handlePeriodChange(period.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPeriod === period.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading && !dashboard ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : dashboard ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="总检查次数"
                value={dashboard.summary.totalChecks}
                trend={dashboard.trends.checkTrend}
                icon={<Activity className="w-4 h-4" />}
                description="Gateway 检查总数"
              />
              <StatCard
                title="违规次数"
                value={dashboard.summary.totalViolations}
                trend={dashboard.trends.violationTrend}
                icon={<AlertCircle className="w-4 h-4" />}
                description="被拦截的任务数"
              />
              <StatCard
                title="平均检查时间"
                value={`${dashboard.performance.avgCheckTime.toFixed(0)}ms`}
                trend={dashboard.trends.performanceTrend}
                icon={<Clock className="w-4 h-4" />}
                description="P50 响应时间"
              />
              <StatCard
                title="今日复盘"
                value={dashboard.summary.todayRetros}
                icon={<FileText className="w-4 h-4" />}
                description="今日完成的复盘数"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart
                title="违规趋势"
                data={dashboard.trends.violationData}
                color="rgb(239, 68, 68)"
              />
              <TrendChart
                title="性能趋势"
                data={dashboard.trends.performanceData}
                color="rgb(59, 130, 246)"
              />
            </div>

            {/* Alerts and Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              {dashboard.alerts.length > 0 && (
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4">⚠️ 告警</h3>
                  <div className="space-y-3">
                    {dashboard.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-md border-l-4 ${
                          alert.severity === 'critical'
                            ? 'bg-red-50 border-red-500 dark:bg-red-950/20'
                            : alert.severity === 'high'
                            ? 'bg-orange-50 border-orange-500 dark:bg-orange-950/20'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/20'
                            : 'bg-blue-50 border-blue-500 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{alert.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                          </div>
                          <span className="text-xs font-mono">
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Events */}
              <EventStream />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
