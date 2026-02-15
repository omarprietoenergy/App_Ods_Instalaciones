import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function MetricsPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    // Redirect if not admin/manager
    if (user && !['admin', 'project_manager'].includes(user.role)) {
        setLocation("/");
        return null;
    }

    const techPerformance = trpc.metrics.getTechnicianPerformance.useQuery();
    const materialsAnalysis = trpc.metrics.getMaterialsAnalysis.useQuery();
    const workTrends = trpc.metrics.getWorkTrends.useQuery();

    const isLoading = techPerformance.isLoading || materialsAnalysis.isLoading || workTrends.isLoading;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // Calculate totals
    const totalHours = techPerformance.data?.reduce((sum, t) => sum + t.totalHoursWorked, 0) || 0;
    const totalCompleted = techPerformance.data?.reduce((sum, t) => sum + t.completedInstallations, 0) || 0;
    const avgTime = techPerformance.data?.length
        ? techPerformance.data.reduce((sum, t) => sum + t.avgCompletionTime, 0) / techPerformance.data.length
        : 0;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Métricas y Análisis</h1>
                    <p className="text-muted-foreground">Dashboard de rendimiento del equipo y operaciones</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Horas Trabajadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalHours}h</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Instalaciones Completadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCompleted}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tiempo Promedio (días)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgTime.toFixed(1)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Rendimiento por Técnico</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={techPerformance.data || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="totalHoursWorked" name="Horas" fill="#8884d8" />
                                        <Bar dataKey="completedInstallations" name="Instalaciones" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Materiales Más Utilizados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={materialsAnalysis.data || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="quantity"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {(materialsAnalysis.data || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencias de Trabajo</CardTitle>
                        <CardDescription>Evolución mensual de trabajos realizados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={workTrends.data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="installations" name="Instalaciones" stroke="#8884d8" />
                                    <Line type="monotone" dataKey="breakdowns" name="Averías" stroke="#82ca9d" />
                                    <Line type="monotone" dataKey="maintenance" name="Mantenimientos" stroke="#ffc658" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
