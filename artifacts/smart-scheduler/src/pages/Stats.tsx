import { useGetEventStats, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Calendar, CheckCircle2, Clock, BarChart4, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(291, 64%, 42%)',
  'hsl(41, 96%, 40%)',
  'hsl(355, 90%, 60%)',
];

export default function Stats() {
  const { data: stats, isLoading } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const pieData = stats.categoryBreakdown.map(c => ({ name: c.category, value: c.count }));
  const priorityData = stats.priorityBreakdown.map(p => ({ name: p.priority, value: p.count }));
  const completionRate = stats.totalEvents > 0 ? Math.round((stats.completedCount / stats.totalEvents) * 100) : 0;

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-1">
            <BarChart4 className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground">Overview of your scheduling activity</p>
        </header>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Events</p>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-bold text-foreground leading-none">{stats.totalEvents}</div>
                <div className="text-xs text-muted-foreground mb-1">items</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">This Week</p>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-end gap-2 justify-between">
                <div className="text-4xl font-bold text-foreground leading-none">{stats.thisWeek}</div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold text-[9px] uppercase tracking-wider mb-1">
                  <Activity className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">This Month</p>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="text-4xl font-bold text-foreground leading-none">{stats.thisMonth}</div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-primary rounded-b-xl" style={{ width: `${completionRate}%` }} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Completion</p>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-end gap-2 justify-between">
                <div className="flex items-end gap-1">
                  <div className="text-4xl font-bold text-foreground leading-none">{completionRate}</div>
                  <div className="text-xl text-muted-foreground pb-0.5">%</div>
                </div>
                <div className="text-xs text-muted-foreground mb-1 bg-muted px-2 py-1 rounded font-mono">
                  {stats.completedCount} done
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-base font-bold">By Category</CardTitle>
              <CardDescription className="text-xs mt-0.5">Distribution across event types</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[280px] w-full relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid hsl(220, 13%, 90%)',
                          backgroundColor: '#fff',
                          color: 'hsl(224, 71%, 4%)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                        }}
                        itemStyle={{ color: 'hsl(224, 71%, 4%)', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
                    <Activity className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-xs uppercase tracking-widest">No data yet</span>
                  </div>
                )}

                {pieData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-foreground">{stats.totalEvents}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-6 pt-4 border-t border-border">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-lg border border-border">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="uppercase text-[10px] font-semibold tracking-widest text-foreground">{entry.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-base font-bold">By Priority</CardTitle>
              <CardDescription className="text-xs mt-0.5">Event distribution by priority level</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="h-[280px] w-full">
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 13%, 92%)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        className="uppercase font-bold text-[10px] tracking-widest"
                        tick={{ fill: 'hsl(220, 9%, 46%)', dy: 10, fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(220, 9%, 60%)', fontSize: 11 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'hsl(220, 14%, 95%)' }}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid hsl(220, 13%, 90%)',
                          backgroundColor: '#fff',
                          color: 'hsl(224, 71%, 4%)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {priorityData.map((entry, index) => {
                          let color = 'hsl(142, 71%, 45%)';
                          if (entry.name.toLowerCase() === 'medium') color = 'hsl(41, 96%, 40%)';
                          if (entry.name.toLowerCase() === 'high') color = 'hsl(0, 72%, 51%)';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
                    <BarChart4 className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-xs uppercase tracking-widest">No data yet</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
