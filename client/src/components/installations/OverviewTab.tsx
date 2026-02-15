import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Building,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Euro,
    Wrench,
    User
} from "lucide-react";

export function OverviewTab({ installation }: { installation: any }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Client Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <User className="w-5 h-5" />
                        Información del Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Cliente:</span>
                        <span className="font-medium">{installation.clientName}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Dirección:</span>
                        <span className="font-medium">{installation.address}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4" /> Teléfono:</span>
                        <span className="font-medium">{installation.clientPhone || "N/A"}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email:</span>
                        <span className="font-medium">{installation.clientEmail || "N/A"}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> DNI/CIF:</span>
                        <span className="font-medium">{installation.clientDocument || "N/A"}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Wrench className="w-5 h-5" />
                        Detalles del Proyecto
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><Wrench className="w-4 h-4" /> Tipo Orden:</span>
                        <Badge variant="secondary">{installation.workOrderType}</Badge>

                        <span className="text-muted-foreground flex items-center gap-2"><Building className="w-4 h-4" /> Tipo Inst.:</span>
                        <span className="font-medium capitalize">{installation.installationType}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Inicio:</span>
                        <span className="font-medium">{installation.startDate ? new Date(installation.startDate).toLocaleDateString() : "Pendiente"}</span>

                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Fin:</span>
                        <span className="font-medium">{installation.endDate ? new Date(installation.endDate).toLocaleDateString() : "En curso"}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Economic Info (Restricted?) */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <Euro className="w-5 h-5" />
                        Datos Económicos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Presupuesto</p>
                            <p className="text-xl font-bold">{installation.budget || "N/A"}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Precio Instalación</p>
                            <p className="text-xl font-bold">{installation.installationPrice ? `${installation.installationPrice} €` : "N/A"}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Mano de Obra</p>
                            <p className="text-xl font-bold">{installation.laborPrice ? `${installation.laborPrice} €` : "N/A"}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Descripción del Trabajo:</p>
                        <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                            {installation.workDescription || "Sin descripción detallada."}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
