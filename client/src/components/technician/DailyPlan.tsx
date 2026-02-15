import { trpc } from "@/lib/trpc";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLocalDateStr } from "@/lib/utils"; // Make sure to expose this or use date string

interface DailyPlanProps {
    date: Date;
    isToday: boolean;
}

export function DailyPlan({ date, isToday }: DailyPlanProps) {
    const { user } = useAuth();
    const utils = trpc.useContext();
    const dateStr = date.toISOString().split('T')[0]; // Query param works safely with date object usually, but let's check router

    // Router expects date object (z.coerce.date())
    const { data: assignments, isLoading } = trpc.dailyAssignments.listForTechnician.useQuery({ date });

    const { data: shift } = trpc.shifts.getToday.useQuery();
    const shiftStatus = shift?.status;

    const resumeShiftMutation = trpc.shifts.resume.useMutation({
        onSuccess: () => utils.shifts.getToday.invalidate(),
        onError: (err) => toast.error("Error al reanudar jornada: " + err.message)
    });

    const startMutation = trpc.dailyAssignments.startWork.useMutation({
        onSuccess: () => {
            toast.success("Trabajo iniciado");
            utils.dailyAssignments.listForTechnician.invalidate();
            utils.shifts.getToday.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const pauseMutation = trpc.dailyAssignments.pauseWork.useMutation({
        onSuccess: () => { toast.success("Trabajo pausado"); utils.dailyAssignments.listForTechnician.invalidate(); },
        onError: (err) => toast.error(err.message)
    });

    const completeMutation = trpc.dailyAssignments.completeWork.useMutation({
        onSuccess: () => { toast.success("Trabajo completado"); utils.dailyAssignments.listForTechnician.invalidate(); },
        onError: (err) => {
            if (err.data?.httpStatus === 409) {
                toast.error(err.message, {
                    duration: 8000,
                    action: {
                        label: "Firmar ahora",
                        onClick: () => {
                            // We need the assignment ID here, but the mutation only has the input on mutate.
                            // Actually the err object doesn't have the original input directly in TRPC onError usually
                            // but let's assume we want to guide them to the first active installation if possible or just show the toast.
                            toast.info("Pulsa el botón 'Firmar cliente' en la tarjeta.");
                        }
                    }
                });
            } else {
                toast.error(err.message);
            }
        }
    });

    const resumeMutation = trpc.dailyAssignments.resumeWork.useMutation({
        onSuccess: () => { toast.success("Trabajo reanudado"); utils.dailyAssignments.listForTechnician.invalidate(); },
        onError: (err) => toast.error(err.message)
    });

    const handleStart = async (assignment: any) => {
        console.log(`[Frontend] handleStart - tech=${user?.id} assignmentId=${assignment.id} instId=${assignment.installationId}`);
        try {
            if (shiftStatus === 'paused') {
                toast.info("Reanudando jornada primero...");
                await resumeShiftMutation.mutateAsync();
            } else if (!shiftStatus || shiftStatus === 'ended') {
                toast.error(shiftStatus === 'ended' ? "Tu jornada ya ha finalizado." : "Debes iniciar tu jornada primero.");
                return;
            }

            if (assignment.status === 'paused') {
                await resumeMutation.mutateAsync({ assignmentId: assignment.id });
            } else {
                await startMutation.mutateAsync({ installationId: assignment.installationId });
            }
        } catch (err: any) {
            console.error(`[Frontend] handleStart ERROR:`, err);
            toast.error("Fallo al iniciar actividad: " + (err.message || "Error desconocido"));
        }
    };

    if (isLoading) return <div className="space-y-4 pt-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

    if (!assignments || assignments.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg mt-4 border border-dashed">
                <p>No hay tareas planificadas para este día.</p>
            </div>
        );
    }

    // Filter
    const activeAssignment = assignments.find((a: any) => a.assignment.status === 'working');
    const pendingAssignments = assignments.filter((a: any) => a.assignment.status !== 'working' && a.assignment.status !== 'completed');
    const completedAssignments = assignments.filter((a: any) => a.assignment.status === 'completed');

    return (
        <div className="space-y-6 mt-4">
            {/* Active Work - Only show if Today */}
            {isToday && activeAssignment && (
                <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">EN CURSO</h3>
                    <div className="transform scale-105 origin-top transition-transform">
                        <ActivityCard
                            assignment={{ ...activeAssignment.assignment, installation: activeAssignment.installation }}
                            isWorkingAny={!!activeAssignment}
                            onStart={() => { }} // Already started
                            onPause={(id) => pauseMutation.mutate({ assignmentId: id })}
                            onComplete={(id) => completeMutation.mutate({ assignmentId: id })}
                        />
                    </div>
                </section>
            )}

            {/* Pending List */}
            <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                    {pendingAssignments.length > 0 ? "PENDIENTES" : "SIN TAREAS PENDIENTES"}
                </h3>
                <div className="space-y-3">
                    {pendingAssignments.map((item: any) => (
                        <ActivityCard
                            key={item.assignment.id}
                            assignment={{ ...item.assignment, installation: item.installation }}
                            isWorkingAny={!!activeAssignment}
                            onStart={() => handleStart(item.assignment)} // Can be Resume or Start
                            onPause={() => { }}
                            onComplete={(id) => completeMutation.mutate({ assignmentId: id })}
                        />
                    ))}
                </div>
            </section>

            {/* Completed (Optional, maybe collapsible) */}
            {completedAssignments.length > 0 && (
                <section className="opacity-75">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">COMPLETADAS</h3>
                    <div className="space-y-3">
                        {completedAssignments.map((item: any) => (
                            <ActivityCard
                                key={item.assignment.id}
                                assignment={{ ...item.assignment, installation: item.installation }}
                                isWorkingAny={!!activeAssignment}
                                onStart={() => { }}
                                onPause={() => { }}
                                onComplete={() => { }}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
