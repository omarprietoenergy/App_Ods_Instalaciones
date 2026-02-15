import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Info, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const TEMPLATE_INFO = {
    installation_started: {
        title: "Instalación Iniciada",
        description: "Email enviado cuando una instalación cambia a estado 'Iniciada'",
        variables: [
            "{{clientId}} - ID del cliente",
            "{{clientName}} - Nombre del cliente",
            "{{address}} - Dirección de la instalación",
            "{{workOrderType}} - Tipo de trabajo (Instalación/Avería/Mantenimiento)",
            "{{startDate}} - Fecha de inicio",
            "{{installationId}} - ID de la instalación",
            "{{workDescription}} - Descripción del trabajo",
            "{{logoUrl}} - URL del logo de la empresa"
        ]
    },
    installation_completed: {
        title: "Instalación Completada",
        description: "Email enviado cuando una instalación se marca como completada",
        variables: [
            "{{clientId}} - ID del cliente",
            "{{clientName}} - Nombre del cliente",
            "{{address}} - Dirección de la instalación",
            "{{endDate}} - Fecha de finalización",
            "{{installationId}} - ID de la instalación",
            "{{logoUrl}} - URL del logo de la empresa"
        ]
    },
    client_conformity: {
        title: "Conformidad del Cliente",
        description: "Email enviado con el PDF de conformidad firmado por el cliente",
        variables: [
            "{{clientId}} - ID del cliente",
            "{{clientName}} - Nombre del cliente",
            "{{signatureDate}} - Fecha de la firma",
            "{{installationId}} - ID de la instalación",
            "{{logoUrl}} - URL del logo de la empresa"
        ]
    }
};

export default function EmailTemplates() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const utils = trpc.useUtils();

    // Redirect if not admin
    if (user && user.role !== "admin") {
        setLocation("/");
        return null;
    }

    const { data: templates, isLoading, refetch } = trpc.emailTemplates.list.useQuery();

    const updateMutation = trpc.emailTemplates.update.useMutation({
        onSuccess: () => {
            toast.success("Plantilla actualizada correctamente");
            setEditingTemplate(null);
            utils.emailTemplates.list.invalidate();
        },
        onError: (error) => {
            toast.error("Error al actualizar la plantilla: " + error.message);
        }
    });

    const createMutation = trpc.emailTemplates.create.useMutation({
        onSuccess: () => {
            toast.success("Plantilla creada correctamente");
            setEditingTemplate(null);
            utils.emailTemplates.list.invalidate();
        },
        onError: (error) => {
            toast.error("Error al crear la plantilla: " + error.message);
        }
    });

    const handleEdit = (type: string) => {
        const existing = templates?.find(t => t.templateType === type);
        if (existing) {
            setEditingTemplate({ ...existing });
        } else {
            setEditingTemplate({
                templateType: type,
                subject: "",
                body: "",
                signature: "",
                logoUrl: "https://app.odsenergy.net/logo.png", // Default logo URL
                isActive: 1
            });
        }
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

        if (editingTemplate.id) {
            updateMutation.mutate({
                id: editingTemplate.id,
                subject: editingTemplate.subject,
                body: editingTemplate.body,
                signature: editingTemplate.signature,
                logoUrl: editingTemplate.logoUrl,
                isActive: editingTemplate.isActive
            });
        } else {
            createMutation.mutate({
                templateType: editingTemplate.templateType,
                subject: editingTemplate.subject,
                body: editingTemplate.body,
                signature: editingTemplate.signature,
                logoUrl: editingTemplate.logoUrl,
                isActive: editingTemplate.isActive
            });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Plantillas de Email</h1>
                    <p className="text-muted-foreground mt-2">
                        Personaliza los mensajes automáticos del sistema
                    </p>
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Las plantillas utilizan variables dinámicas en formato <code>{'{{nombreVariable}}'}</code>.
                        Estas variables se reemplazan automáticamente con los datos reales al enviar el email.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="installation_started" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="installation_started">Instalación Iniciada</TabsTrigger>
                        <TabsTrigger value="installation_completed">Instalación Completada</TabsTrigger>
                        <TabsTrigger value="client_conformity">Conformidad del Cliente</TabsTrigger>
                    </TabsList>

                    {Object.entries(TEMPLATE_INFO).map(([key, info]) => {
                        const template = templates?.find(t => t.templateType === key);
                        const isEditing = editingTemplate?.templateType === key;

                        return (
                            <TabsContent key={key} value={key} className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{info.title}</CardTitle>
                                        <CardDescription>{info.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {!isEditing ? (
                                            <>
                                                <div className="grid gap-4">
                                                    <div>
                                                        <Label className="text-sm font-semibold">Asunto</Label>
                                                        <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                                                            {template?.subject || "No configurado"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <Label className="text-sm font-semibold">Cuerpo del mensaje (Vista previa)</Label>
                                                        <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-60 overflow-y-auto border border-dashed font-mono">
                                                            {template?.body ? (
                                                                <div dangerouslySetInnerHTML={{ __html: template.body.length > 500 ? template.body.substring(0, 500) + '...' : template.body }} />
                                                            ) : (
                                                                <span className="text-muted-foreground italic">No hay contenido configurado. Haz clic en editar para añadir HTML.</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {template?.signature && (
                                                        <div>
                                                            <Label className="text-sm font-semibold">Firma</Label>
                                                            <div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono" dangerouslySetInnerHTML={{ __html: template.signature }} />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <Label className="text-sm font-semibold">Variables disponibles</Label>
                                                        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {info.variables.map((variable, idx) => (
                                                                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                                                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20">
                                                                        {variable.split(" - ")[0]}
                                                                    </code>
                                                                    <span>{variable.split(" - ")[1]}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex items-center justify-between border-t mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${template?.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        <span className="text-sm font-medium">{template?.isActive ? 'Plantilla Activa' : 'Plantilla Inactiva'}</span>
                                                    </div>
                                                    <Button onClick={() => handleEdit(key)}>
                                                        Editar Plantilla
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="subject">Asunto</Label>
                                                    <Input
                                                        id="subject"
                                                        value={editingTemplate.subject}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                        placeholder="Ej: Instalación Iniciada - {{clientName}}"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="body">Cuerpo del mensaje (HTML)</Label>
                                                    <Textarea
                                                        id="body"
                                                        value={editingTemplate.body}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                                        placeholder="Contenido HTML del email..."
                                                        rows={12}
                                                        className="font-mono text-sm leading-relaxed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="signature">Firma (HTML)</Label>
                                                    <Textarea
                                                        id="signature"
                                                        value={editingTemplate.signature || ""}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, signature: e.target.value })}
                                                        placeholder="Firma HTML (opcional)..."
                                                        rows={3}
                                                        className="font-mono text-sm"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="logoUrl">URL del Logo</Label>
                                                        <Input
                                                            id="logoUrl"
                                                            value={editingTemplate.logoUrl || ""}
                                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, logoUrl: e.target.value })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2 pt-8">
                                                        <Switch
                                                            id="active-switch"
                                                            checked={editingTemplate.isActive === 1 || editingTemplate.isActive === true}
                                                            onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked ? 1 : 0 })}
                                                        />
                                                        <Label htmlFor="active-switch">Activar Plantilla</Label>
                                                    </div>
                                                </div>

                                                {editingTemplate.logoUrl && (
                                                    <div className="mt-2 p-2 border rounded bg-slate-50">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Vista previa del logo:</Label>
                                                        <img src={editingTemplate.logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t flex gap-2">
                                                    <Button
                                                        onClick={handleSave}
                                                        disabled={updateMutation.isPending || createMutation.isPending}
                                                        className="w-full md:w-auto"
                                                    >
                                                        {(updateMutation.isPending || createMutation.isPending) && (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        )}
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Guardar Cambios
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setEditingTemplate(null)}
                                                        className="w-full md:w-auto"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
