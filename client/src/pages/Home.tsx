import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Wrench, FileText, Users, TrendingUp, AlertTriangle, Package, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import TechnicianHome from "./TechnicianHome";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const installationsQuery = trpc.installations.list.useQuery(undefined, {
    enabled: !!user && user.role !== 'technician'
  });
  const pendingMaterialsQuery = trpc.materials.getPending.useQuery(undefined, {
    enabled: !!user && user.role !== 'technician'
  });

  // Expenses Queries (P1)
  const pendingInvoicingQuery = trpc.expenses.getPendingInvoicingCount.useQuery(undefined, {
    enabled: !!user && ['admin', 'project_manager', 'admin_manager'].includes(user.role)
  });
  const recentPendingExpensesQuery = trpc.expenses.getRecentPendingInvoicing.useQuery(undefined, {
    enabled: !!user && ['admin', 'project_manager', 'admin_manager'].includes(user.role)
  });

  if (user?.role === 'technician') {
    return <TechnicianHome />;
  }

  const installations = installationsQuery.data || [];
  const pendingCount = installations.filter(i => i.status === 'pending').length;
  const inProgressCount = installations.filter(i => i.status === 'in_progress').length;
  const completedCount = installations.filter(i => i.status === 'completed').length;
  const pendingMaterials = pendingMaterialsQuery.data || [];

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      project_manager: "Jefe de Proyecto",
      technician: "Técnico",
      admin_manager: "Jefe de Administración",
    };
    return labels[role] || role;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido, {user?.name || "Usuario"} - {getRoleLabel(user?.role || "")}
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instalaciones Totales</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{installations.length}</div>
              <p className="text-xs text-muted-foreground">Proyectos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Iniciadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">Obras activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Por iniciar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiales Pendientes</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMaterials.length}</div>
              <p className="text-xs text-muted-foreground">Solicitudes sin aprobar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Installations */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Instalaciones Recientes</CardTitle>
              <CardDescription>Últimos proyectos activos</CardDescription>
            </CardHeader>
            <CardContent>
              {installations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay instalaciones</div>
              ) : (
                <div className="space-y-4">
                  {installations.slice(0, 5).map((installation) => (
                    <div
                      key={installation.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/installations/${installation.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{installation.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{installation.address}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${installation.status === 'in_progress' ? 'bg-blue-500' :
                        installation.status === 'completed' ? 'bg-green-500' :
                          installation.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-xs" onClick={() => setLocation('/installations')}>
                    Ver todas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts Section (Materials) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas y Solicitudes
              </CardTitle>
              <CardDescription>Atención requerida</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                  <p>Todo al día. No hay solicitudes pendientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMaterials.slice(0, 5).map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-3 border border-l-4 border-l-yellow-500 rounded bg-background">
                      <div>
                        <p className="text-sm font-medium">Material Solicitado</p>
                        <p className="text-xs text-muted-foreground">{mat.materialName} (x{mat.quantity})</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/installations/${mat.installationId}`)}>
                        Ver
                      </Button>
                    </div>
                  ))}
                  {pendingMaterials.length > 5 && (
                    <p className="text-center text-xs text-muted-foreground">y {pendingMaterials.length - 5} más...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expenses Alert (P1) */}
        {['admin', 'project_manager', 'admin_manager'].includes(user?.role || '') && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Gastos Pendientes de Facturar: {pendingInvoicingQuery.data || 0}
                </CardTitle>
                <CardDescription>Facturas subidas por técnicos pendientes de revisión administrativa</CardDescription>
              </CardHeader>
              <CardContent>
                {(!recentPendingExpensesQuery.data || recentPendingExpensesQuery.data.length === 0) ? (
                  <p className="text-muted-foreground text-sm">No hay gastos pendientes.</p>
                ) : (
                  <div className="space-y-4">
                    {recentPendingExpensesQuery.data.map((exp: any) => (
                      <div key={exp.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium text-sm">{exp.installationName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.date).toLocaleDateString()} - {exp.vendor} ({exp.amount}€)
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setLocation(`/installations/${exp.installationId}`)}>
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout >
  );
}
