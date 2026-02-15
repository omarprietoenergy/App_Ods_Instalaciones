import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { FileDown, Loader2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BulkExportPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    // Redirect if not admin/project_manager
    if (user && !['admin', 'project_manager'].includes(user.role)) {
        setLocation("/");
        return null;
    }

    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
    const [clientId, setClientId] = useState("");
    const [includeConformity, setIncludeConformity] = useState(true);
    const [includeDailyReports, setIncludeDailyReports] = useState(true);

    const exportMutation = trpc.dailyReports.exportBulkPDFs.useMutation({
        onSuccess: (data) => {
            toast.success("Exportación completada");
            // Trigger download
            window.open(data.url, '_blank');
        },
        onError: (error) => {
            toast.error(error.message || "Error al exportar");
        }
    });

    const handleExport = () => {
        exportMutation.mutate({
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined,
            clientId: clientId || undefined,
            includeConformity,
            includeDailyReports
        });
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exportación Masiva</h1>
                    <p className="text-muted-foreground">
                        Descarga documentación de múltiples instalaciones en un solo archivo ZIP
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros de Exportación
                        </CardTitle>
                        <CardDescription>
                            Selecciona los criterios para incluir instalaciones en el reporte
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Rango de Fechas (Inicio de Obra)</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative w-full">
                                        <Input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        />
                                    </div>
                                    <span>a</span>
                                    <div className="relative w-full">
                                        <Input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clientId">ID Cliente / Nombre (Opcional)</Label>
                                <div className="relative">
                                    <Input
                                        id="clientId"
                                        placeholder="Buscar por ID o nombre..."
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <Label>Documentos a Incluir</Label>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="conformity"
                                        checked={includeConformity}
                                        onCheckedChange={(c) => setIncludeConformity(Boolean(c))}
                                    />
                                    <label
                                        htmlFor="conformity"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Certificados de Conformidad
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reports"
                                        checked={includeDailyReports}
                                        onCheckedChange={(c) => setIncludeDailyReports(Boolean(c))}
                                    />
                                    <label
                                        htmlFor="reports"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Partes Diarios de Trabajo
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleExport}
                                disabled={exportMutation.isPending || (!includeConformity && !includeDailyReports)}
                            >
                                {exportMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generando ZIP...
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Exportar Documentación
                                    </>
                                )}
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
