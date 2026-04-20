import { useGetEventStats, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Calendar, CheckCircle2, Clock } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Stats() {
  const { data: stats, isLoading } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-medium">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const pieData = stats.categoryBreakdown.map(c => ({ name: c.category, value: c.count }));
  const priorityData = stats.priorityBreakdown.map(p => ({ name: p.priority, value: p.count }));

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1">Analytics and overview of your schedule</p>
        </header>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.thisWeek}</div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 font-medium ml-auto">
                  <TrendingUp className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {stats.totalEvents > 0 ? Math.round((stats.completedCount / stats.totalEvents) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground ml-2">
                  {stats.completedCount} done
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Distribution of events by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No category data</div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="capitalize">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Levels</CardTitle>
              <CardDescription>Event distribution by priority</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} className="capitalize text-xs" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                      <RechartsTooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No priority data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Needed to use Badge inside Stats component
import { Badge } from "@/components/ui/badge";