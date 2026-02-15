import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Navigation, Phone, Play, Pause, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface ActivityCardProps {
    assignment: any; // Type inference or explicit type
    onStart: (id: number) => void;
    onPause: (id: number) => void;
    onComplete: (id: number) => void;
    isWorkingAny: boolean; // To show confirmation if switching
}

export function ActivityCard({ assignment, onStart, onPause, onComplete, isWorkingAny }: ActivityCardProps) {
    const [, setLocation] = useLocation();
    const { installation, status, approvalStatus } = assignment;

    const isActive = status === 'working';
    const isPendingApproval = approvalStatus === 'pending';

    // Format Address for Maps
    const openMaps = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (installation.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(installation.address)}`, '_blank');
        }
    };

    const handleStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStart(assignment.id);
    };

    return (
        <Card
            className={`border-l-4 transition-all hover:shadow-md cursor-pointer ${isActive ? 'border-l-green-500 bg-green-50/10' :
                isPendingApproval ? 'border-l-yellow-500 bg-yellow-50/10' : 'border-l-slate-300'
                }`}
            onClick={() => setLocation(`/installations/${installation.id}`)}
        >
            <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-600 hover:bg-green-600 animate-pulse" : ""}>
                        {isActive ? "EN CURSO" : status === 'completed' ? "COMPLETADO" : isPendingApproval ? "PENDIENTE APROBACIÓN" : "PENDIENTE"}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {installation.workOrderType === 'breakdown' ? 'Avería' :
                            installation.workOrderType === 'maintenance' ? 'Mantenimiento' : 'Instalación'}
                    </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg mb-1 leading-tight">{installation.clientName}</h3>

                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3 gap-1">
                    <MapPin className="w-3 h-3 sm:w-3.5 h-3.5" />
                    <span className="truncate">{installation.address}</span>
                </div>

                {/* Actions Bar - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 flex-1">
                        <Button variant="outline" size="lg" className="flex-1 gap-2 h-12 sm:h-9" onClick={openMaps}>
                            <Navigation className="w-4 h-4" />
                            <span>Navegar</span>
                        </Button>

                        {installation.clientPhone && (
                            <Button variant="outline" size="lg" className="flex-1 gap-2 h-12 sm:h-9" asChild>
                                <a href={`tel:${installation.clientPhone}`}>
                                    <Phone className="w-4 h-4" />
                                    <span>Llamar</span>
                                </a>
                            </Button>
                        )}
                    </div>

                    <div className="w-full sm:w-auto">
                        {isActive ? (
                            <div className="flex gap-2 w-full">
                                {!installation.clientSignatureUrl ? (
                                    <>
                                        {/* State: Working but Missing Signature */}
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="flex-1 h-12 sm:h-9"
                                            onClick={(e) => { e.stopPropagation(); onPause(assignment.id); }}
                                        >
                                            <Pause className="w-5 h-5 text-yellow-600" />
                                            <span className="ml-2 hidden sm:inline">Pausar</span>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="flex-[2] bg-amber-50 border-amber-200 text-amber-700 h-12 sm:h-9 gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLocation(`/installations/${installation.id}?tab=signature`);
                                            }}
                                        >
                                            <Play className="w-4 h-4 fill-amber-700 rotate-90" />
                                            <span>Firmar cliente</span>
                                        </Button>
                                    </>
                                ) : (
                                    /* State: Working and Signature Present -> Only Complete */
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 h-12 sm:h-9 gap-2">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>Completar Instalación</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Completar trabajo?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Marcará la instalación como completada y notificará al cliente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={(e) => { onComplete(assignment.id); }} className="bg-green-600">Completar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        ) : status !== 'completed' && (
                            isWorkingAny ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="lg" className="w-full sm:w-auto bg-slate-900 text-white gap-2 h-12 sm:h-9">
                                            <Play className="w-5 h-5" /> Iniciar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cambiar de actividad</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Ya tienes una tarea en curso. Al iniciar esta, la anterior se pausará automáticamente.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleStart} className="bg-slate-900">Confirmar y Cambiar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <Button size="lg" className="w-full sm:w-auto bg-slate-900 text-white gap-2 h-12 sm:h-9" onClick={handleStart}>
                                    <Play className="w-5 h-5" /> Iniciar
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
