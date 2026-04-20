import { useGetEventStats, getGetEventStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Calendar, CheckCircle2, Clock, BarChart4, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  'hsl(255, 85%, 65%)', // Primary
  'hsl(190, 90%, 50%)', // Secondary
  'hsl(340, 80%, 65%)', // Pink
  'hsl(45, 90%, 60%)',  // Amber
  'hsl(280, 70%, 70%)', // Purple
];

export default function Stats() {
  const { data: stats, isLoading } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-mono text-sm tracking-widest uppercase font-bold animate-pulse">Compiling telemetry...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const pieData = stats.categoryBreakdown.map(c => ({ name: c.category, value: c.count }));
  const priorityData = stats.priorityBreakdown.map(p => ({ name: p.priority, value: p.count }));
  const completionRate = stats.totalEvents > 0 ? Math.round((stats.completedCount / stats.totalEvents) * 100) : 0;

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 bg-transparent">
      <div className="max-w-6xl mx-auto space-y-10">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <BarChart4 className="w-6 h-6 text-secondary" />
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Telemetry Data</h1>
          </div>
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">System analytics & operational overview</p>
        </header>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between space-y-0 pb-4 border-b border-white/5 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Gross Volume</p>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold text-white leading-none tracking-tighter">{stats.totalEvents}</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mb-1">Items</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between space-y-0 pb-4 border-b border-white/5 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">Current Cycle</p>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-end gap-3 justify-between">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-white leading-none tracking-tighter">{stats.thisWeek}</div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 font-bold uppercase tracking-wider text-[9px] mb-1">
                  <Activity className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group hover:border-secondary/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-50" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between space-y-0 pb-4 border-b border-white/5 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary font-mono">Macro Phase</p>
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold text-white leading-none tracking-tighter">{stats.thisMonth}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 h-1 bg-green-500" style={{ width: `${completionRate}%` }} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between space-y-0 pb-4 border-b border-white/5 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 font-mono">Efficiency</p>
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <div className="flex items-end gap-3 justify-between">
                <div className="flex items-end gap-1">
                  <div className="text-4xl font-bold text-white leading-none tracking-tighter">{completionRate}</div>
                  <div className="text-xl text-muted-foreground font-medium pb-1">%</div>
                </div>
                <div className="text-xs text-white/50 font-mono uppercase mb-1 bg-white/5 px-2 py-1 rounded">
                  {stats.completedCount} executed
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-lg font-bold tracking-wide">Categorical Distribution</CardTitle>
              <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-1">Sector volume analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.5))' }} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          color: '#fff',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-white/5 border-dashed rounded-xl">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <span className="font-mono text-xs uppercase tracking-widest">Insufficient Data</span>
                  </div>
                )}
                
                {/* Center text overlay */}
                {pieData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{stats.totalEvents}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8 pt-4 border-t border-white/5">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}` }} />
                    <span className="uppercase text-[10px] font-bold tracking-widest text-white/80">{entry.name}</span>
                    <span className="font-mono text-xs text-muted-foreground ml-1">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-lg font-bold tracking-wide">Criticality Matrix</CardTitle>
              <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-1">Event distribution by priority tier</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="h-[300px] w-full">
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        className="uppercase font-bold text-[10px] tracking-widest font-mono" 
                        tick={{fill: 'rgba(255,255,255,0.5)', dy: 10}} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace'}} 
                      />
                      <RechartsTooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          color: '#fff',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {priorityData.map((entry, index) => {
                          // Match colors to priority logic in EventCard
                          let color = 'hsl(190, 90%, 50%)'; // low/secondary
                          if (entry.name.toLowerCase() === 'medium') color = 'hsl(45, 90%, 60%)'; // amber
                          if (entry.name.toLowerCase() === 'high') color = 'hsl(0, 62.8%, 40.6%)'; // red/destructive
                          
                          return <Cell key={`cell-${index}`} fill={color} style={{ filter: `drop-shadow(0px -4px 12px ${color}40)` }} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-white/5 border-dashed rounded-xl">
                    <BarChart4 className="w-8 h-8 mb-2 opacity-50" />
                    <span className="font-mono text-xs uppercase tracking-widest">Insufficient Data</span>
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
