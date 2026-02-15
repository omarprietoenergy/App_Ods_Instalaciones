import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Upload, Download, Loader2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function DocumentsTab({ installationId }: { installationId: number }) {
    const { user } = useAuth();
    const utils = trpc.useUtils();
    const documentsQuery = trpc.documents.listByInstallation.useQuery({ installationId });
    const isManager = ['admin', 'project_manager', 'admin_manager'].includes(user?.role || '');

    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>("");
    const [description, setDescription] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadMutation = trpc.documents.upload.useMutation({
        onSuccess: () => {
            utils.documents.listByInstallation.invalidate({ installationId });
            setIsUploadDialogOpen(false);
            setUploadFile(null);
            setDocumentType("");
            setDescription("");
            toast.success("Documento subido exitosamente");
        },
        onError: (error) => toast.error(error.message)
    });

    const deleteDocumentMutation = trpc.documents.delete.useMutation({
        onSuccess: () => {
            utils.documents.listByInstallation.invalidate({ installationId });
            toast.success("Documento eliminado");
        }
    });

    const handleUpload = async () => {
        if (!uploadFile || !documentType) {
            toast.error("Selecciona un archivo y tipo de documento");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            const base64Data = base64.split(',')[1];
            uploadMutation.mutate({
                installationId,
                name: uploadFile.name,
                documentType: documentType as any,
                fileData: base64Data,
                mimeType: uploadFile.type,
                description: description || undefined,
            });
        };
        reader.readAsDataURL(uploadFile);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div></div> {/* Spacer */}
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentsQuery.isLoading ? (
                    <p className="text-muted-foreground col-span-full text-center py-8">Cargando documentos...</p>
                ) : documentsQuery.data?.length === 0 ? (
                    <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No hay documentos subidos.</p>
                    </div>
                ) : (
                    documentsQuery.data?.map(doc => (
                        <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 bg-muted/40 pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="bg-white">{doc.documentType}</Badge>
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="font-medium truncate mb-1" title={doc.name}>{doc.name}</p>
                                {(doc as any).description && (
                                    <p className="text-xs text-muted-foreground mb-2 italic">{(doc as any).description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mb-4">
                                    {new Date(doc.createdAt).toLocaleDateString()} • {(doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : '0')} MB
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Eye className="w-3 h-3 mr-1" /> Ver
                                        </a>
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                                        <a href={doc.fileUrl} download>
                                            <Download className="w-3 h-3 mr-1" /> Descargar
                                        </a>
                                    </Button>
                                    {isManager && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                                            onClick={() => {
                                                if (confirm("¿Seguro que deseas eliminar este documento?")) {
                                                    deleteDocumentMutation.mutate({ id: doc.id });
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Subir Documento</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Select onValueChange={setDocumentType}>
                                <SelectTrigger><SelectValue placeholder="Seleccione Tipo de Documento" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="plan">Plano</SelectItem>
                                    <SelectItem value="project">Proyecto</SelectItem>
                                    <SelectItem value="safety_plan">Plan Seguridad</SelectItem>
                                    <SelectItem value="contract">Contrato</SelectItem>
                                    <SelectItem value="permit">Permiso / Licencia</SelectItem>
                                    <SelectItem value="specification">Memoria Técnica</SelectItem>
                                    <SelectItem value="conformity">Conformidad</SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(documentType === 'other' || documentType) && (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Descripción (opcional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                            {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Subir Archivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
