import { compressImage } from "@/lib/image-compression";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Package, Plus, Upload, X, Receipt, Download, FileText } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

export default function InstallationMaterials() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/installations/:id/materials");
    const installationId = params?.id ? parseInt(params.id) : 0;
    const utils = trpc.useUtils();

    const [activeTab, setActiveTab] = useState("received");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
    const [showInvoiced, setShowInvoiced] = useState(false); // P0: Toggle visibility
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<{
        type: "received" | "requested" | "expense";
        // Material fields
        materialName: string;
        quantity: string;
        description: string;
        photo: File | null;
        supplierName: string; // New for B-01
        deliveryNoteNumber: string; // New for B-01
        // Expense fields
        date: string;
        category: string;
        vendor: string;
        documentNumber: string;
        amount: string;
        // Batch list (only for requested)
        batchItems: Array<{ materialName: string, quantity: number, description: string, photo: File | null }>;
    }>({
        type: "received",
        materialName: "",
        quantity: "",
        description: "",
        photo: null,
        supplierName: "",
        deliveryNoteNumber: "",
        date: new Date().toISOString().split('T')[0],
        category: "fuel",
        vendor: "",
        documentNumber: "",
        amount: "",
        batchItems: [],
    });

    // Queries
    const installationQuery = trpc.installations.getById.useQuery({ id: installationId });
    const materialsQuery = trpc.materials.listByInstallation.useQuery({ installationId });
    const expensesQuery = trpc.expenses.listByInstallation.useQuery({ installationId });

    // Mutations
    const createMaterialMutation = trpc.materials.create.useMutation({
        onSuccess: () => {
            utils.materials.listByInstallation.invalidate({ installationId });
            setIsDialogOpen(false);
            resetForm();
            toast.success("Material registrado");
        },
        onError: (err) => toast.error(err.message),
    });

    const createBatchMutation = trpc.materials.createBatch.useMutation({
        onSuccess: () => {
            utils.materials.listByInstallation.invalidate({ installationId });
            setIsDialogOpen(false);
            resetForm();
            toast.success("Solicitud enviada");
        },
        onError: (err) => toast.error(err.message),
    });

    const updateStatusMutation = trpc.materials.updateStatus.useMutation({
        onSuccess: () => {
            utils.materials.listByInstallation.invalidate({ installationId });
            toast.success("Estado actualizado");
        },
        onError: (err) => toast.error(err.message),
    });

    const createExpenseMutation = trpc.expenses.create.useMutation({
        onSuccess: () => {
            utils.expenses.listByInstallation.invalidate({ installationId });
            setIsDialogOpen(false);
            resetForm();
            toast.success("Gasto registrado");
        },
        onError: (err) => toast.error(err.message),
    });

    const updateExpenseStatusMutation = trpc.expenses.updateStatus.useMutation({
        onSuccess: () => {
            utils.expenses.listByInstallation.invalidate({ installationId });
            toast.success("Estado actualizado");
        },
        onError: (err) => toast.error(err.message),
    });

    const downloadZipMutation = trpc.expenses.downloadZip.useMutation({
        onSuccess: (data) => {
            window.open(data.url, '_blank');
            toast.success("Descarga iniciada");
        },
        onError: (err) => toast.error(err.message),
    });

    // Derived Data
    const receivedMaterials = materialsQuery.data?.filter(m => m.type === "received" || m.status === "received") || [];
    const requestedMaterials = materialsQuery.data?.filter(m => m.type === "requested" && m.status !== "received") || [];
    const expenses = expensesQuery.data || [];
    const isManager = ['admin', 'project_manager'].includes(user?.role || '');

    // Handlers
    const resetForm = () => {
        setFormData({
            type: "received",
            materialName: "",
            quantity: "",
            description: "",
            photo: null,
            supplierName: "",
            deliveryNoteNumber: "",
            date: new Date().toISOString().split('T')[0],
            category: "fuel",
            vendor: "",
            documentNumber: "",
            amount: "",
            batchItems: [],
        });
    };

    const handleOpenDialog = (initialType?: "received" | "requested" | "expense") => {
        setFormData(prev => ({
            ...prev,
            type: initialType || "received",
            // Reset fields on open 
            materialName: "",
            quantity: "",
            description: "",
            photo: null,
            supplierName: "",
            deliveryNoteNumber: "",
            date: new Date().toISOString().split('T')[0],
            category: "fuel",
            vendor: "",
            documentNumber: "",
            amount: "",
            batchItems: []
        }));
        setIsDialogOpen(true);
    };

    const handleAddToBatch = () => {
        if (!formData.materialName || !formData.quantity) {
            toast.error("Nombre y cantidad obligatorios");
            return;
        }
        const numericQty = parseInt(formData.quantity);
        if (isNaN(numericQty) || numericQty <= 0) {
            toast.error("Cantidad inválida");
            return;
        }

        setFormData(prev => ({
            ...prev,
            batchItems: [...prev.batchItems, {
                materialName: prev.materialName,
                quantity: numericQty,
                description: prev.description,
                photo: prev.photo
            }],
            // Clear inputs
            materialName: "",
            quantity: "",
            description: "",
            photo: null
        }));
    };

    const handleRemoveFromBatch = (index: number) => {
        setFormData(prev => ({
            ...prev,
            batchItems: prev.batchItems.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. EXPENSES
        if (formData.type === 'expense') {
            if (!formData.photo) {
                toast.error("La foto es obligatoria");
                return;
            }
            if (!formData.amount || !formData.vendor) {
                toast.error("Importe y proveedor son obligatorios");
                return;
            }

            let photoData;
            try {
                photoData = await compressImage(formData.photo, 1200, 0.8);
            } catch (e) {
                toast.error("Error procesando foto");
                return;
            }

            createExpenseMutation.mutate({
                installationId,
                date: formData.date,
                category: formData.category as any,
                vendor: formData.vendor,
                documentNumber: formData.documentNumber || "S/N",
                amount: parseFloat(formData.amount),
                receiptPhotoData: photoData,
                notes: formData.description
            });
            return;
        }

        // 2. REQUESTS (BATCH)
        if (formData.type === 'requested') {
            // If user typed something but didn't click add, add it automatically
            let itemsState = [...formData.batchItems];
            if (formData.materialName && formData.quantity) {
                const numericQty = parseInt(formData.quantity);
                if (!isNaN(numericQty) && numericQty > 0) {
                    itemsState.push({
                        materialName: formData.materialName,
                        quantity: numericQty,
                        description: formData.description,
                        photo: formData.photo
                    });
                }
            }

            if (itemsState.length === 0) {
                toast.error("Añade al menos un material");
                return;
            }

            // Process photos for batch items
            try {
                const itemsToSubmit = await Promise.all(itemsState.map(async (item) => {
                    let photoData;
                    if (item.photo) {
                        photoData = await compressImage(item.photo, 1200, 0.8);
                    }
                    return {
                        materialName: item.materialName,
                        quantity: item.quantity,
                        description: item.description,
                        deliveryNotePhotoData: photoData
                    };
                }));

                createBatchMutation.mutate({
                    installationId,
                    items: itemsToSubmit
                });
            } catch (e) {
                toast.error("Error procesando imágenes");
                return;
            }

            return; // Exit
        }

        // 3. RECEIVED (SINGLE)
        if (!formData.materialName || !formData.quantity) {
            toast.error("Nombre y cantidad obligatorios");
            return;
        }

        // Validate B-01 requirements for Received
        if (!formData.supplierName || !formData.deliveryNoteNumber || !formData.photo) {
            toast.error("Para recibir material, proveedor, albarán y foto son obligatorios");
            return;
        }

        let photoData = undefined;
        if (formData.photo) {
            try {
                photoData = await compressImage(formData.photo, 1200, 0.8);
            } catch (e) {
                toast.error("Error procesando la imagen");
                return;
            }
        }

        createMaterialMutation.mutate({
            installationId,
            type: "received", // Explicitly received
            materialName: formData.materialName,
            quantity: parseInt(formData.quantity),
            description: formData.description,
            deliveryNotePhotoData: photoData,
            supplierName: formData.supplierName,
            deliveryNoteNumber: formData.deliveryNoteNumber
        });
    };

    if (installationQuery.isLoading) return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        </DashboardLayout>
    );

    if (!installationQuery.data) return <div className="p-8 text-center text-muted-foreground">Instalación no encontrada</div>;

    const inst = installationQuery.data;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setLocation(`/installations/${installationId}`)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Gestión de Materiales</h1>
                            <p className="text-muted-foreground">{inst.clientName}</p>
                        </div>
                    </div>
                    <Button onClick={() => {
                        // Map tab value to form type
                        const typeMap: Record<string, "received" | "requested" | "expense"> = {
                            "received": "received",
                            "requested": "requested",
                            "expenses": "expense"
                        };
                        handleOpenDialog(typeMap[activeTab]);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {activeTab === 'expenses' ? 'Registrar Gasto' : 'Nuevo Registro'}
                    </Button>
                </div>

                {/* Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                        <TabsTrigger value="received">Materiales Llegados</TabsTrigger>
                        <TabsTrigger value="requested">Solicitudes</TabsTrigger>
                        <TabsTrigger value="expenses">Dietas y Gastos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received" className="space-y-4 pt-4">
                        <div className="grid gap-4">
                            {receivedMaterials.map((mat) => (
                                <Card key={mat.id}>
                                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                                                <Package className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-lg">{mat.materialName}</p>
                                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold text-foreground">Cant: {mat.quantity}</span>
                                                    <span>•</span>
                                                    <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                                                    {(mat.supplierName) && (
                                                        <span className="text-foreground">| Prov: {mat.supplierName}</span>
                                                    )}
                                                    {mat.deliveryNotePhotoUrl && (
                                                        <>
                                                            <span>•</span>
                                                            <a href={mat.deliveryNotePhotoUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> Albarán: {mat.deliveryNoteNumber || 'Ver'}
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                                {mat.description && <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded">{mat.description}</p>}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
                                            En Obra
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                            {receivedMaterials.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed bg-muted/10 text-muted-foreground">
                                    <Package className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="font-medium">No hay materiales registrados</p>
                                    <p className="text-sm">Registra la llegada de material usando el botón "Nuevo Registro"</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="requested" className="space-y-4 pt-4">
                        <div className="grid gap-4">
                            {requestedMaterials.map((mat) => (
                                <Card key={mat.id}>
                                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-orange-100 p-2 rounded-full mt-1">
                                                <Package className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-lg">{mat.materialName}</p>
                                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold text-foreground">Cant: {mat.quantity}</span>
                                                    <span>•</span>
                                                    <span>Solicitado: {new Date(mat.createdAt).toLocaleDateString()}</span>
                                                    {mat.deliveryNotePhotoUrl && (
                                                        <>
                                                            <span>•</span>
                                                            <a href={mat.deliveryNotePhotoUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                                                                <Upload className="w-3 h-3" /> Ver Foto
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                                {mat.description && <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded">{mat.description}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 self-end md:self-auto">
                                            {mat.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>}
                                            {mat.status === 'approved' && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Aprobado</Badge>}
                                            {mat.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>}

                                            {isManager && mat.status === 'pending' && (
                                                <div className="flex gap-1 ml-2">
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => updateStatusMutation.mutate({ id: mat.id, status: 'approved' })}>
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateStatusMutation.mutate({ id: mat.id, status: 'rejected' })}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {requestedMaterials.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed bg-muted/10 text-muted-foreground">
                                    <Package className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="font-medium">No hay solicitudes pendientes</p>
                                    <p className="text-sm">Crea una nueva solicitud de material desde "Nuevo Registro"</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="expenses" className="space-y-4 pt-4">
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Gastos Registrados</h3>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center space-x-2 mr-4">
                                        <Checkbox
                                            id="show-invoiced"
                                            checked={showInvoiced}
                                            onCheckedChange={(c) => setShowInvoiced(!!c)}
                                        />
                                        <Label htmlFor="show-invoiced" className="cursor-pointer">Ver Facturados/Anulados</Label>
                                    </div>
                                </div>
                            </div>

                            {/* P0: Download Actions */}
                            {['admin', 'admin_manager'].includes(user?.role || '') && expenses.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end bg-muted/20 p-2 rounded-lg">
                                    <Button variant="outline" size="sm" onClick={() => downloadZipMutation.mutate({ installationId: parseInt(params?.id!), mode: 'pending' })} disabled={downloadZipMutation.isPending}>
                                        <Download className="w-3 h-3 mr-2" />
                                        Pendientes
                                    </Button>

                                    {selectedExpenses.length > 0 && (
                                        <Button variant="default" size="sm" onClick={() => downloadZipMutation.mutate({ installationId: parseInt(params?.id!), mode: 'selected', expenseIds: selectedExpenses })} disabled={downloadZipMutation.isPending}>
                                            <Download className="w-3 h-3 mr-2" />
                                            Seleccionados ({selectedExpenses.length})
                                        </Button>
                                    )}

                                    <Button variant="ghost" size="sm" onClick={() => downloadZipMutation.mutate({ installationId: parseInt(params?.id!), mode: 'all' })} disabled={downloadZipMutation.isPending}>
                                        Todo (ZIP)
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-4">
                            {expenses
                                .filter((exp: any) => showInvoiced ? true : ['pending', 'pending_invoicing'].includes(exp.status))
                                .map((exp: any) => (
                                    <Card key={exp.id} className={selectedExpenses.includes(exp.id) ? "border-primary ring-1 ring-primary" : ""}>
                                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* P1: Selection Checkbox */}
                                                {['admin', 'admin_manager'].includes(user?.role || '') && (
                                                    <Checkbox
                                                        className="mt-2"
                                                        checked={selectedExpenses.includes(exp.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedExpenses(prev => [...prev, exp.id]);
                                                            else setSelectedExpenses(prev => prev.filter(id => id !== exp.id));
                                                        }}
                                                    />
                                                )}

                                                <div className="bg-purple-100 p-2 rounded-full mt-1">
                                                    <Receipt className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-lg">{exp.category.toUpperCase()} - {exp.amount}€</p>
                                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="font-semibold text-foreground">{exp.vendor}</span>
                                                        {exp.receiptPhotoUrl && (
                                                            <>
                                                                <span>•</span>
                                                                <a href={exp.receiptPhotoUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" /> Ver Ticket
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                    {exp.notes && <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded">{exp.notes}</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 self-end md:self-auto">
                                                {(exp.status === 'pending' || exp.status === 'pending_invoicing') && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente Facturar</Badge>}
                                                {(exp.status === 'approved' || exp.status === 'invoiced') && <Badge className="bg-green-100 text-green-800 border-green-200">Facturado</Badge>}
                                                {(exp.status === 'rejected' || exp.status === 'void') && <Badge className="bg-gray-100 text-gray-800 border-gray-200">Anulado</Badge>}

                                                {/* P0: Facturar/Anular only for admin_manager (and admin backup) */}
                                                {['admin', 'admin_manager'].includes(user?.role || '') && (exp.status === 'pending' || exp.status === 'pending_invoicing') && (
                                                    <div className="flex gap-1 ml-2">
                                                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => {
                                                            updateExpenseStatusMutation.mutate({ id: exp.id, status: 'invoiced' }, {
                                                                onSuccess: () => {
                                                                    toast.success("Marcado como FACTURADO");
                                                                    utils.expenses.listByInstallation.invalidate({ installationId });
                                                                }
                                                            });
                                                        }}>
                                                            Facturar
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="outline" className="h-8 w-8 text-gray-500 hover:bg-gray-50 hover:text-gray-700" title="Anular gasto">
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Anular este gasto?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        El gasto pasará a estado "Anulado" y no se contabilizará. Esta acción no se puede deshacer fácilmente.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
                                                                        updateExpenseStatusMutation.mutate({ id: exp.id, status: 'void' }, {
                                                                            onSuccess: () => {
                                                                                toast.success("Gasto ANULADO");
                                                                                utils.expenses.listByInstallation.invalidate({ installationId });
                                                                            }
                                                                        });
                                                                    }}>
                                                                        Anular Gasto
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            {expenses.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed bg-muted/10 text-muted-foreground">
                                    <Receipt className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="font-medium">No hay gastos registrados</p>
                                    <p className="text-sm">Registra tickets y gastos usando el botón "Nuevo Registro"</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* New Material Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>
                                {formData.type === 'expense' ? 'Registrar Factura' : 'Registrar Item'}
                            </DialogTitle>
                            <DialogDescription>
                                {formData.type === 'received' && 'Registra material que ha llegado a la obra'}
                                {formData.type === 'requested' && 'Prepare su lista de solicitud de materiales'}
                                {formData.type === 'expense' && 'Registra un gasto o factura asociado a la obra'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 py-4">

                            {/* Type Selector - Hidden if entering from Expenses tab context */
                                formData.type !== 'expense' && (
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val: any) => setFormData(prev => ({
                                                ...prev,
                                                type: val,
                                                batchItems: val === 'received' ? [] : prev.batchItems
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="received">Material Llegado</SelectItem>
                                                <SelectItem value="requested">Solicitud de Material</SelectItem>
                                                {/* Expense option removed from here to separate flows, or kept but hidden if pre-selected */}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                            <div className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">Materiales</h4>
                                    {formData.type === 'requested' && (
                                        <span className="text-xs text-muted-foreground">Añada items a la lista o rellene el actual</span>
                                    )}
                                </div>

                                {/* Batch List Display (only for requested) */}
                                {formData.type === 'requested' && formData.batchItems.length > 0 && (
                                    <div className="bg-muted/30 rounded p-3 space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground">Lista de solicitud ({formData.batchItems.length}):</p>
                                        {formData.batchItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm bg-background p-2 rounded shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <span>{item.quantity}x {item.materialName}</span>
                                                    {item.photo && <Upload className="w-3 h-3 text-muted-foreground" />}
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" type="button" onClick={() => handleRemoveFromBatch(idx)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}


                                {formData.type === 'expense' ? (
                                    /* EXPENSE FORM FIELDS */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="expDate">Fecha</Label>
                                                <Input id="expDate" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="expAmount">Importe (€)</Label>
                                                <Input id="expAmount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expVendor">Proveedor / Establecimiento</Label>
                                            <Input id="expVendor" placeholder="Ej: Repsol, Leroy Merlin..." value={formData.vendor} onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expCat">Categoría</Label>
                                            <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fuel">Combustible</SelectItem>
                                                    <SelectItem value="toll">Peaje</SelectItem>
                                                    <SelectItem value="parking">Parking</SelectItem>
                                                    <SelectItem value="hotel">Hotel</SelectItem>
                                                    <SelectItem value="meal">Comida/Dieta</SelectItem>
                                                    <SelectItem value="vehicle_cleaning">Limpieza Vehículo</SelectItem>
                                                    <SelectItem value="store_purchase">Compra Material</SelectItem>
                                                    <SelectItem value="other">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expDoc">Nº Documento / Factura (Opcional)</Label>
                                            <Input id="expDoc" value={formData.documentNumber} onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expDesc">Notas</Label>
                                            <Textarea id="expDesc" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                                        </div>
                                    </div>
                                ) : (
                                    /* MATERIAL FORM FIELDS */
                                    <div className="space-y-4">
                                        {formData.type === 'received' && (
                                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="supp">Proveedor *</Label>
                                                    <Input id="supp" placeholder="Ej: Saltoki" value={formData.supplierName} onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="delNote">Nº Albarán *</Label>
                                                    <Input id="delNote" placeholder="Ej: A-12345" value={formData.deliveryNoteNumber} onChange={(e) => setFormData(prev => ({ ...prev, deliveryNoteNumber: e.target.value }))} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid gap-2">
                                            <Label htmlFor="matName">Nombre del Material</Label>
                                            <Input
                                                id="matName"
                                                placeholder="Ej: Panel Solar 450W"
                                                value={formData.materialName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, materialName: e.target.value }))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="matQty">Cantidad</Label>
                                                <Input
                                                    id="matQty"
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData.quantity}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="matDesc">Descripción (opcional)</Label>
                                                <Input
                                                    id="matDesc"
                                                    placeholder="Detalles adicionales"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {/* Add to Batch Button (Only for Requests) */}
                                        {formData.type === 'requested' && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={handleAddToBatch}
                                                disabled={!formData.materialName || !formData.quantity}
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Añadir a la lista
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Photo Upload: Available for both Received and Requested */}
                            <div className="space-y-2">
                                <Label>
                                    {formData.type === 'expense' ? 'Foto (obligatoria)' : 'Foto (opcional)'}
                                </Label>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {formData.photo ? "Cambiar Foto" : "Subir Foto"}
                                    </Button>
                                    {formData.photo && <span className="text-sm text-green-600 flex items-center"><Check className="w-3 h-3 mr-1" /> {formData.photo.name}</span>}
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={createMaterialMutation.isPending || createBatchMutation.isPending}>
                                    {(createMaterialMutation.isPending || createBatchMutation.isPending) ? "Guardando..." :
                                        (formData.type === 'requested' ? "Enviar Solicitud" : "Guardar")
                                    }
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
