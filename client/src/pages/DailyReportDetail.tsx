import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, FileSignature, Image as ImageIcon, Download, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function DailyReportDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/daily-reports/:id");
  const reportId = params?.id ? parseInt(params.id) : 0;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const reportQuery = trpc.dailyReports.getById.useQuery({ id: reportId });
  const installationQuery = trpc.installations.getById.useQuery(
    { id: reportQuery.data?.installationId || 0 },
    { enabled: !!reportQuery.data?.installationId }
  );

  const generatePDFMutation = trpc.dailyReports.generatePDF.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success('PDF generado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al generar el PDF');
    },
  });

  if (reportQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando parte diario...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error al cargar el parte diario</h2>
          <p className="text-destructive mb-4">{reportQuery.error?.message || "Parte diario no encontrado"}</p>
          <Button onClick={() => setLocation("/daily-reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Partes Diarios
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const report = reportQuery.data;
  const installation = installationQuery.data;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/daily-reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Parte Diario</h1>
          <p className="text-muted-foreground mt-2">
            {new Date(report.reportDate).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Instalación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {installation ? (
              <>
                <div>
                  <span className="font-medium text-foreground">Cliente: </span>
                  <span className="text-muted-foreground">{installation.clientName}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Dirección: </span>
                  <span className="text-muted-foreground">{installation.address}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Tipo: </span>
                  <span className="text-muted-foreground">{installation.installationType}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Cargando información...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Fecha</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(report.reportDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Horas Trabajadas</p>
                <p className="text-sm text-muted-foreground">{report.hoursWorked} horas</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Descripción del Trabajo</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {report.workDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        {report.photos && report.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos de Avance</CardTitle>
              <CardDescription>
                {report.photos.length} {report.photos.length === 1 ? 'foto' : 'fotos'} adjuntas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {report.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.fileUrl)}
                  >
                    <div className="aspect-video overflow-hidden rounded-lg border border-border">
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || "Foto de avance"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    {photo.caption && (
                      <p className="mt-2 text-sm text-muted-foreground">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {report.signatureUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Firma Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg p-4 bg-background inline-block">
                <img
                  src={report.signatureUrl}
                  alt="Firma"
                  className="max-w-md w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={() => generatePDFMutation.mutate({ id: reportId })}
            disabled={generatePDFMutation.isPending}
          >
            <FileDown className="w-4 h-4 mr-2" />
            {generatePDFMutation.isPending ? 'Generando PDF...' : 'Generar PDF'}
          </Button>
        </div>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
