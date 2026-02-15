import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    History,
    FileText,
    Package,
    ClipboardList,
    Activity,
    Info,
    ArrowRight
} from "lucide-react";

interface HistoryTabProps {
    installationId: number;
}

export function HistoryTab({ installationId }: HistoryTabProps) {
    const statusHistoryQuery = trpc.installationStatusHistory.list.useQuery({ installationId });
    const auditLogsQuery = trpc.auditLogs.list.useQuery({ installationId });
    const usersQuery = trpc.users.list.useQuery();

    const getUserName = (userId: number) => {
        return usersQuery.data?.find(u => u.id === userId)?.name || "Usuario";
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            pending: "Pendiente",
            in_progress: "Iniciada",
            completed: "Completada",
            cancelled: "Cancelada"
        };
        return map[status] || status;
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            in_progress: "bg-blue-100 text-blue-800 border-blue-200",
            completed: "bg-green-100 text-green-800 border-green-200",
            cancelled: "bg-red-100 text-red-800 border-red-200"
        };
        return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getActionIcon = (action: string) => {
        if (action.includes('document')) return <FileText className="w-4 h-4 text-blue-500" />;
        if (action.includes('material')) return <Package className="w-4 h-4 text-orange-500" />;
        if (action.includes('report')) return <ClipboardList className="w-4 h-4 text-green-500" />;
        return <Info className="w-4 h-4 text-gray-500" />;
    };

    // Merge and sort
    const historyItems = [
        ...(statusHistoryQuery.data?.map(item => ({
            type: 'status',
            date: new Date(item.createdAt),
            userId: item.userId,
            data: item
        })) || []),
        ...(auditLogsQuery.data?.map(item => ({
            type: 'audit',
            date: new Date(item.createdAt),
            userId: item.userId,
            data: item
        })) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historial de Actividad
                </CardTitle>
                <CardDescription>Registro completo de eventos y cambios en la instalación</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                        {statusHistoryQuery.isLoading || auditLogsQuery.isLoading ? (
                            <p className="text-center text-muted-foreground">Cargando historial...</p>
                        ) : historyItems.length === 0 ? (
                            <p className="text-center text-muted-foreground">No hay actividad registrada.</p>
                        ) : (
                            historyItems.map((item, index) => (
                                <div key={index} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground font-mono">
                                                {format(item.date, "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Por: {getUserName(item.userId)}
                                            </span>
                                        </div>

                                        {item.type === 'status' ? (
                                            <div className="mt-1 bg-muted/20 p-3 rounded-lg border">
                                                <div className="flex items-center gap-2 font-medium mb-2">
                                                    <Activity className="w-4 h-4 text-primary" />
                                                    <span>Cambio de Estado</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className={getStatusColor((item.data as any).previousStatus || 'pending')}>
                                                        {getStatusLabel((item.data as any).previousStatus || 'pending')}
                                                    </Badge>
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                    <Badge variant="outline" className={getStatusColor((item.data as any).newStatus)}>
                                                        {getStatusLabel((item.data as any).newStatus)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-1 bg-muted/20 p-3 rounded-lg border">
                                                <div className="flex items-center gap-2 font-medium mb-1">
                                                    {getActionIcon((item.data as any).action)}
                                                    <span className="capitalize">{(item.data as any).action.replace(/_/g, ' ')}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {(item.data as any).details}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
