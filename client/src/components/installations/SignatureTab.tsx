import { useState, useRef } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eraser, Save, CheckCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SignatureTabProps {
    installation: any;
    refetch: () => void;
}

export function SignatureTab({ installation, refetch }: SignatureTabProps) {
    const [clientEmail, setClientEmail] = useState(installation.clientEmail || "");
    const [observations, setObservations] = useState(installation.technicianObservations || "");
    const sigCanvas = useRef<ReactSignatureCanvas>(null);

    const mutation = trpc.installations.addClientSignature.useMutation({
        onSuccess: () => {
            toast.success("Firma guardada y conformidad generada correctamente");
            refetch();
        },
        onError: (err) => toast.error(err.message)
    });

    const handleClear = () => {
        sigCanvas.current?.clear();
    };

    const handleSave = () => {
        if (sigCanvas.current?.isEmpty()) {
            toast.error("Por favor, capture la firma del cliente");
            return;
        }
        if (!clientEmail) {
            toast.error("El email del cliente es obligatorio para enviar la conformidad");
            return;
        }

        const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png").split(',')[1];

        if (!signatureData) return;

        mutation.mutate({
            installationId: installation.id,
            signatureData,
            clientEmail,
            technicianObservations: observations
        });
    };

    const isSigned = !!installation.clientSignatureUrl;

    return (
        <div className="space-y-6">
            {isSigned ? (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <CardTitle className="text-green-700">Instalación Conformada</CardTitle>
                        </div>
                        <CardDescription className="text-green-600">
                            El cliente firmó la conformidad el {new Date(installation.clientSignatureDate).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {installation.conformityPdfUrl && (
                                <Button variant="outline" className="gap-2 bg-white" onClick={() => window.open(installation.conformityPdfUrl, '_blank')}>
                                    <FileText className="w-4 h-4" />
                                    Ver Documento de Conformidad
                                </Button>
                            )}
                        </div>
                        <div>
                            <Label className="text-green-700">Observaciones registradas:</Label>
                            <p className="text-sm mt-1">{installation.technicianObservations || "Sin observaciones"}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Firma de Conformidad</CardTitle>
                        <CardDescription>
                            Capture la firma del cliente para generar el documento de conformidad y finalizar la instalación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Email del Cliente (para envío de copia)</Label>
                                <Input
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    placeholder="cliente@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Observaciones del Técnico</Label>
                            <Textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Notas finales sobre el trabajo realizado..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Firma Digital</Label>
                            <div className="border rounded-md bg-white touch-none h-[200px] w-full relative">
                                <ReactSignatureCanvas
                                    ref={sigCanvas}
                                    canvasProps={{
                                        className: "w-full h-full cursor-crosshair"
                                    }}
                                    backgroundColor="rgb(255, 255, 255)"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                    onClick={handleClear}
                                >
                                    <Eraser className="w-4 h-4 mr-1" />
                                    Limpiar
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Firme dentro del recuadro anterior.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleSave} disabled={mutation.isPending} size="lg">
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generando Documento...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Firma y Finalizar
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
