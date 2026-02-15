import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Clock, Pause, Play, Square, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ShiftControl() {
    const utils = trpc.useUtils();
    const { data: shift, isLoading } = trpc.shifts.getToday.useQuery();
    const [, setLocation] = useLocation();

    // State for compliance validation
    const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
    const [showComplianceModal, setShowComplianceModal] = useState(false);
    const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
    const [complianceData, setComplianceData] = useState<{ totalMinutes: number } | null>(null);

    const canEndQuery = trpc.shifts.canEnd.useQuery(undefined, { enabled: false });

    const handleEndClick = async () => {
        setIsCheckingCompliance(true);
        try {
            const result = await canEndQuery.refetch();
            if (result.data) {
                setComplianceData({ totalMinutes: result.data.totalMinutes });
                if (result.data.allowed) {
                    setShowConfirmEndModal(true);
                } else {
                    setShowComplianceModal(true);
                }
            }
        } catch (err) {
            toast.error("Error al validar requisitos de cierre");
        } finally {
            setIsCheckingCompliance(false);
        }
    };

    const startMutation = trpc.shifts.start.useMutation({
        onSuccess: () => {
            toast.success("Jornada iniciada");
            utils.shifts.getToday.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const pauseMutation = trpc.shifts.pause.useMutation({
        onSuccess: () => {
            toast.success("Jornada pausada");
            utils.shifts.getToday.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const resumeMutation = trpc.shifts.resume.useMutation({
        onSuccess: () => {
            toast.success("Jornada reanudada");
            utils.shifts.getToday.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const endMutation = trpc.shifts.end.useMutation({
        onSuccess: () => {
            toast.success("Jornada finalizada");
            setShowConfirmEndModal(false);
            utils.shifts.getToday.invalidate();
            utils.dailyAssignments.listForTechnician.invalidate();
        },
        onError: (err) => {
            if (err.data?.httpStatus === 409) {
                setShowComplianceModal(true);
            } else {
                toast.error(err.message);
            }
        }
    });

    if (isLoading) return <div className="h-20 animate-pulse bg-muted rounded-lg" />;

    const status = shift?.status;
    const totalMinutes = shift?.totalMinutes ?? 0;

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${status === 'active' ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">
                            {!shift ? "Sin jornada" :
                                status === 'active' ? "Jornada Activa" :
                                    status === 'paused' ? "En Pausa" : "Finalizada"}
                        </h3>
                        {shift?.activeStartAt && status === 'active' && (
                            <p className="text-xs text-muted-foreground">Inició a las {new Date(shift.activeStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {totalMinutes > 0 && (
                            <p className="text-xs text-muted-foreground">Total hoy: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!shift && (
                        <Button onClick={() => startMutation.mutate()} size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            <Play className="w-4 h-4" /> Iniciar
                        </Button>
                    )}

                    {status === 'active' && (
                        <>
                            <Button onClick={() => pauseMutation.mutate()} variant="outline" size="icon" title="Pausar">
                                <Pause className="w-5 h-5 text-yellow-600" />
                            </Button>

                            <Button
                                onClick={handleEndClick}
                                disabled={isCheckingCompliance}
                                variant="destructive"
                                size="icon"
                                title="Finalizar Jornada"
                            >
                                {isCheckingCompliance ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Square className="w-5 h-5 fill-current" />
                                )}
                            </Button>
                        </>
                    )}

                    {status === 'paused' && (
                        <Button onClick={() => resumeMutation.mutate()} size="lg" className="gap-2">
                            <Play className="w-4 h-4" /> Reanudar
                        </Button>
                    )}

                    {status === 'ended' && (
                        <Button disabled variant="outline">Finalizada</Button>
                    )}
                </div>
            </CardContent>

            {/* Modal: Confirm End Shift (Pro-checked) */}
            <AlertDialog open={showConfirmEndModal} onOpenChange={setShowConfirmEndModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Finalizar Jornada?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto finalizará tu registro de hoy y pausará cualquier actividad activa.
                            Hoy has trabajado un total de {Math.floor((complianceData?.totalMinutes || 0) / 60)}h {(complianceData?.totalMinutes || 0) % 60}m.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={endMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                endMutation.mutate();
                            }}
                            disabled={endMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {endMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Finalizar Ahora
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Compliance Modal: Missing Daily Report (Blocked) */}
            <AlertDialog open={showComplianceModal} onOpenChange={setShowComplianceModal}>
                <AlertDialogContent className="border-amber-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
                            <FileText className="w-5 h-5" />
                            Parte Diario Requerido
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground/80">
                            No hay parte diario registrado hoy. Debes registrar al menos un parte antes de finalizar la jornada (Requisito para jornadas ≥ 30 min).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="sm:flex-1">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowComplianceModal(false);
                                const todayStr = format(new Date(), "yyyy-MM-dd");
                                setLocation(`/daily-reports/new?date=${todayStr}&from=shift_end`);
                            }}
                            className="bg-primary sm:flex-[2] gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Registrar Parte Diario
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
