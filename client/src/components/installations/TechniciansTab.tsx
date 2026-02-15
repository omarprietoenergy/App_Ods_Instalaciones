import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, User, Clock, Pause, Play, CheckCircle, Trash2, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TechniciansTabProps {
    installationId: number;
}

export default function TechniciansTab({ installationId }: TechniciansTabProps) {
    const [date, setDate] = useState<Date>(new Date());
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedTech, setSelectedTech] = useState<string>("");

    const dateStr = format(date, "yyyy-MM-dd");

    const utils = trpc.useUtils();
    const assignmentsQuery = trpc.dailyAssignments.list.useQuery({
        installationId,
        date: dateStr
    });
    const usersQuery = trpc.users.list.useQuery();

    const assignMutation = trpc.dailyAssignments.assign.useMutation({
        onSuccess: () => {
            utils.dailyAssignments.list.invalidate({ installationId, date: dateStr });
            setIsAssignDialogOpen(false);
            setSelectedTech("");
            toast.success("Técnico asignado");
        }
    });

    const updateStatusMutation = trpc.dailyAssignments.updateStatus.useMutation({
        onSuccess: () => {
            utils.dailyAssignments.list.invalidate({ installationId, date: dateStr });
            toast.success("Estado actualizado");
        }
    });

    const deleteMutation = trpc.dailyAssignments.delete.useMutation({
        onSuccess: () => {
            utils.dailyAssignments.list.invalidate({ installationId, date: dateStr });
            toast.success("Asignación eliminada");
        }
    });

    const technicians = usersQuery.data?.filter(u => u.role === 'technician') || [];

    // Filter out already assigned techs
    const availableTechs = technicians.filter(t =>
        !assignmentsQuery.data?.some(a => a.technicianId === t.id)
    );

    const handleAssign = () => {
        if (!selectedTech) return;
        assignMutation.mutate({
            installationId,
            technicianId: parseInt(selectedTech),
            date: dateStr
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned': return <Badge variant="outline" className="bg-gray-100">Asignado</Badge>;
            case 'working': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 animate-pulse">Trabajando</Badge>;
            case 'paused': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pausado</Badge>;
            case 'completed': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Completado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getUserName = (id: number) => technicians.find(t => t.id === id)?.name || technicians.find(t => t.id === id)?.email || "Desconocido";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Control de Técnicos Diario
                    </CardTitle>
                    <CardDescription>Gestiona la asistencia y trabajo diario en la instalación</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Asignar</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Asignar Técnico para hoy</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Select onValueChange={setSelectedTech} value={selectedTech}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar técnico..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTechs.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name || t.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAssign} disabled={!selectedTech || assignMutation.isPending}>Asignar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {assignmentsQuery.isLoading ? (
                        <p className="text-center text-muted-foreground py-8">Cargando...</p>
                    ) : assignmentsQuery.data?.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg border-dashed">
                            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-muted-foreground">No hay técnicos asignados para este día.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {assignmentsQuery.data?.map(assignment => (
                                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {getUserName(assignment.technicianId).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{getUserName(assignment.technicianId)}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{assignment.startTime || '--:--'} - {assignment.endTime || '--:--'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(assignment.status)}

                                        <div className="flex items-center border-l pl-3 gap-1">
                                            {assignment.status === 'assigned' && (
                                                <Button size="icon" variant="ghost" title="Iniciar Trabajo" onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'working' })}>
                                                    <Play className="w-4 h-4 text-green-600" />
                                                </Button>
                                            )}
                                            {assignment.status === 'working' && (
                                                <Button size="icon" variant="ghost" title="Pausar" onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'paused' })}>
                                                    <Pause className="w-4 h-4 text-orange-500" />
                                                </Button>
                                            )}
                                            {assignment.status === 'paused' && (
                                                <Button size="icon" variant="ghost" title="Reanudar" onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'working' })}>
                                                    <Play className="w-4 h-4 text-green-600" />
                                                </Button>
                                            )}
                                            {assignment.status !== 'completed' && (
                                                <Button size="icon" variant="ghost" title="Finalizar Jornada" onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'completed' })}>
                                                    <StopCircle className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            )}

                                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: assignment.id })}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
