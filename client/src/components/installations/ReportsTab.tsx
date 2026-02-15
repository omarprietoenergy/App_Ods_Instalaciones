import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function ReportsTab({ installationId }: { installationId: number }) {
    const reportsQuery = trpc.dailyReports.listByInstallation.useQuery({ installationId });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Partes Diarios</CardTitle>
                    <CardDescription>Registro de actividad diaria y horas trabajadas.</CardDescription>
                </div>
                <Link href={`/daily-reports/new?installationId=${installationId}`}>
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Parte
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {reportsQuery.isLoading ? (
                        <p className="text-muted-foreground">Cargando reportes...</p>
                    ) : reportsQuery.data?.length === 0 ? (
                        <p className="text-muted-foreground">No hay partes diarios registrados.</p>
                    ) : (
                        reportsQuery.data?.map(report => (
                            <div key={report.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium">{new Date(report.reportDate).toLocaleDateString()}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">{report.workDescription}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{report.hoursWorked} horas</span>
                                    {report.signatureUrl && <span className="text-green-600 font-medium">Firmado</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
