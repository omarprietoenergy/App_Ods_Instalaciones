import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus, FileText, Calendar, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function DailyReports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const installationsQuery = trpc.installations.list.useQuery();

  // Get all daily reports from all installations
  const allReports = installationsQuery.data?.flatMap((installation) => {
    return [];
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Partes Diarios</h1>
            <p className="text-muted-foreground mt-2">
              Registro de trabajo diario en las instalaciones
            </p>
          </div>
          <Button onClick={() => setLocation("/daily-reports/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Parte Diario
          </Button>
        </div>

        {installationsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando partes diarios...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {installationsQuery.data?.map((installation) => (
              <InstallationReportsSection
                key={installation.id}
                installation={installation}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InstallationReportsSection({ installation }: { installation: any }) {
  const [, setLocation] = useLocation();
  const reportsQuery = trpc.dailyReports.listByInstallation.useQuery({
    installationId: installation.id,
  });

  if (reportsQuery.isLoading) {
    return null;
  }

  if (!reportsQuery.data || reportsQuery.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{installation.clientName}</CardTitle>
        <CardDescription>{installation.address}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reportsQuery.data.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setLocation(`/daily-reports/${report.id}`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {new Date(report.reportDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {report.workDescription}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{report.hoursWorked}h</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
