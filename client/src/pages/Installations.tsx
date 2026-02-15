import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Plus, Search, FileDown, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Installations() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkOrderType, setFilterWorkOrderType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const installationsQuery = trpc.installations.list.useQuery();
  const techniciansQuery = trpc.users.listTechnicians.useQuery(undefined, {
    enabled: ['admin', 'project_manager', 'admin_manager'].includes(user?.role || ''),
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const createMutation = trpc.installations.create.useMutation({
    onSuccess: () => {
      utils.installations.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Instalación creada exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear la instalación");
    },
  });

  const updateMutation = trpc.installations.update.useMutation({
    onSuccess: () => {
      utils.installations.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Instalación actualizada exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar la instalación");
    }
  });

  const deleteMutation = trpc.installations.delete.useMutation({
    onSuccess: () => {
      utils.installations.list.invalidate();
      toast.success("Instalación eliminada exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la instalación");
    }
  });

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientId: "",
      clientDocument: "",
      clientPhone: "",
      clientEmail: "",
      address: "",
      installationType: "",
      workOrderType: "installation",
      workDescription: "",
      budget: "",
      startDate: "",
      endDate: "",
      assignedTechnicianIds: [],
      installationPrice: "",
      laborPrice: "",
    });
    setEditingId(null);
  };

  const handleEdit = (inst: any) => {
    setEditingId(inst.id);
    setFormData({
      clientName: inst.clientName,
      clientId: inst.clientId,
      clientDocument: inst.clientDocument || "",
      clientPhone: inst.clientPhone || "",
      clientEmail: inst.clientEmail || "",
      address: inst.address,
      installationType: inst.installationType || "",
      workOrderType: inst.workOrderType,
      workDescription: inst.workDescription || "",
      budget: inst.budget || "",
      startDate: inst.startDate ? new Date(inst.startDate).toISOString().split('T')[0] : "",
      endDate: inst.endDate ? new Date(inst.endDate).toISOString().split('T')[0] : "",
      assignedTechnicianIds: Array.isArray(inst.assignedTechnicianIds) ? inst.assignedTechnicianIds : [],
      installationPrice: inst.installationPrice ? String(inst.installationPrice) : "",
      laborPrice: inst.laborPrice ? String(inst.laborPrice) : "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta instalación? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate({ id });
    }
  };

  const [formData, setFormData] = useState<{
    clientName: string;
    clientId: string;
    clientDocument: string;
    clientPhone: string;
    clientEmail: string;
    address: string;
    installationType: string;
    workOrderType: string;
    workDescription: string;
    budget: string;
    startDate: string;
    endDate: string;
    assignedTechnicianIds: number[];
    installationPrice: string;
    laborPrice: string;
  }>({
    clientName: "",
    clientId: "",
    clientDocument: "",
    clientPhone: "",
    clientEmail: "",
    address: "",
    installationType: "",
    workOrderType: "installation",
    workDescription: "",
    budget: "",
    startDate: "",
    endDate: "",
    assignedTechnicianIds: [],
    installationPrice: "",
    laborPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      clientDocument: formData.clientDocument || undefined,
      clientPhone: formData.clientPhone || undefined,
      clientEmail: formData.clientEmail || undefined,
      budget: formData.budget || undefined,
      workDescription: formData.workDescription || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      workOrderType: formData.workOrderType as any,
      installationPrice: formData.installationPrice ? parseFloat(formData.installationPrice) : undefined,
      laborPrice: formData.laborPrice ? parseFloat(formData.laborPrice) : undefined,
      assignedTechnicianIds: formData.assignedTechnicianIds.length > 0 ? formData.assignedTechnicianIds : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const canCreateInstallations = ['admin', 'project_manager', 'admin_manager'].includes(user?.role || '');

  // Filter Logic
  const filteredInstallations = installationsQuery.data?.filter((installation) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      installation.clientName.toLowerCase().includes(searchLower) ||
      (installation as any).clientId?.toLowerCase().includes(searchLower) ||
      installation.address.toLowerCase().includes(searchLower);

    const matchesType = filterWorkOrderType === "all" || (installation as any).workOrderType === filterWorkOrderType;
    const matchesStatus = filterStatus === "all" || installation.status === filterStatus;

    // Date filter (Start Date)
    const matchesStartDate = !startDate || (installation.startDate && new Date(installation.startDate) >= new Date(startDate));
    const matchesEndDate = !endDate || (installation.startDate && new Date(installation.startDate) <= new Date(endDate));

    return matchesSearch && matchesType && matchesStatus && matchesStartDate && matchesEndDate;
  }) || [];

  // Export to Excel (CSV)
  const exportToExcel = () => {
    if (filteredInstallations.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = ["ID", "Cliente", "ID Cliente", "Dirección", "Tipo Orden", "Estado", "Fecha Inicio", "Fecha Fin", "M.O.", "Precio"];
    const rows = filteredInstallations.map(inst => [
      inst.id,
      inst.clientName,
      (inst as any).clientId || "",
      inst.address,
      (inst as any).workOrderType,
      inst.status,
      inst.startDate ? new Date(inst.startDate).toLocaleDateString() : "",
      inst.endDate ? new Date(inst.endDate).toLocaleDateString() : "",
      (inst as any).laborPrice || "",
      (inst as any).installationPrice || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "instalaciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for technician multi-select
  const [techComboOpen, setTechComboOpen] = useState(false);
  const toggleTechnician = (techId: number) => {
    const current = formData.assignedTechnicianIds;
    if (current.includes(techId)) {
      setFormData({ ...formData, assignedTechnicianIds: current.filter(id => id !== techId) });
    } else {
      setFormData({ ...formData, assignedTechnicianIds: [...current, techId] });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instalaciones</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de proyectos fotovoltaicos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
            {canCreateInstallations && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Instalación
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-end">
          <div className="grid gap-2 w-full md:w-auto flex-1">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre, ID Cliente, Dirección..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 w-full md:w-40">
            <Label>Tipo de Orden</Label>
            <Select value={filterWorkOrderType} onValueChange={setFilterWorkOrderType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="installation">Instalación</SelectItem>
                <SelectItem value="breakdown">Avería</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-full md:w-40">
            <Label>Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">Iniciada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-full md:w-auto">
            <Label>Desde</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2 w-full md:w-auto">
            <Label>Hasta</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {installationsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando instalaciones...</p>
          </div>
        ) : filteredInstallations.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">No se encontraron instalaciones con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Tipo Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallations.map((inst) => (
                  <TableRow key={inst.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/installations/${inst.id}`)}>
                    <TableCell>
                      <div className="font-medium">{inst.clientName}</div>
                      <div className="text-xs text-muted-foreground">ID: {(inst as any).clientId}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{inst.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(inst as any).workOrderType === 'installation' ? 'Instalación' : (inst as any).workOrderType === 'breakdown' ? 'Avería' : 'Mantenimiento'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        inst.status === 'completed' ? 'bg-green-500' :
                          inst.status === 'in_progress' ? 'bg-blue-500' :
                            inst.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                      )}>
                        {inst.status === 'pending' && 'Pendiente'}
                        {inst.status === 'in_progress' && 'Iniciada'}
                        {inst.status === 'completed' && 'Completada'}
                        {inst.status === 'cancelled' && 'Cancelada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inst.startDate ? new Date(inst.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setLocation(`/installations/${inst.id}`); }}>Ver</Button>
                      {canCreateInstallations && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={(e) => { e.stopPropagation(); handleEdit(inst); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(inst.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Installation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Instalación" : "Nueva Instalación"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modificar los detalles del proyecto" : "Crear un nuevo proyecto de instalación fotovoltaica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Sección Cliente */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-1">Datos del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">Nombre del Cliente *</Label>
                    <Input id="clientName" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">ID Cliente / Expediente *</Label>
                    <Input id="clientId" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientDocument">DNI/NIE/CIF</Label>
                    <Input id="clientDocument" value={formData.clientDocument} onChange={e => setFormData({ ...formData, clientDocument: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientPhone">Teléfono</Label>
                    <Input id="clientPhone" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input id="clientEmail" type="email" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Sección Instalación */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-1">Detalles de la Instalación</h3>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workOrderType">Tipo de Orden *</Label>
                    <Select value={formData.workOrderType} onValueChange={v => setFormData({ ...formData, workOrderType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="installation">Instalación</SelectItem>
                        <SelectItem value="breakdown">Avería</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="installationType">Tipo de Instalación</Label>
                    <Input id="installationType" value={formData.installationType} onChange={e => setFormData({ ...formData, installationType: e.target.value })} placeholder="Ej. Solar, Aerotermia..." />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workDescription">Descripción del Trabajo</Label>
                  <Textarea id="workDescription" value={formData.workDescription} onChange={e => setFormData({ ...formData, workDescription: e.target.value })} rows={3} />
                </div>
              </div>

              {/* Tiempos y Personal */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-1">Planificación y Técnicos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Fecha Fin Estimada</Label>
                    <Input id="endDate" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Asignar Técnicos</Label>
                    {techniciansQuery.data && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {techniciansQuery.data.length} técnicos disponibles
                      </span>
                    )}
                  </div>
                  <Popover open={techComboOpen} onOpenChange={setTechComboOpen} modal={false}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={techComboOpen} className="justify-between w-full h-auto min-h-[40px] py-2">
                        <div className="flex flex-wrap gap-1">
                          {formData.assignedTechnicianIds.length > 0 ? (
                            formData.assignedTechnicianIds.map(id => (
                              <Badge key={id} variant="secondary" className="mr-1">
                                {techniciansQuery.data?.find(t => t.id === id)?.name || id}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Seleccionar técnicos...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[400px] p-0 z-[99999] shadow-2xl border-2 pointer-events-auto"
                      align="start"
                      side="bottom"
                      sideOffset={8}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandInput placeholder="Buscar técnico..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron técnicos.</CommandEmpty>
                          <CommandGroup>
                            {techniciansQuery.data?.map((tech) => (
                              <CommandItem
                                key={tech.id}
                                value={tech.name || tech.email}
                                onSelect={() => toggleTechnician(tech.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.assignedTechnicianIds.includes(tech.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tech.name} ({tech.email})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Económico */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-1">Información Económica (Solo Admin/PM)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Presupuesto / Ref</Label>
                    <Input id="budget" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="installationPrice">Precio Venta (€)</Label>
                    <Input id="installationPrice" type="number" step="0.01" value={formData.installationPrice} onChange={e => setFormData({ ...formData, installationPrice: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="laborPrice">Coste M.O. (€)</Label>
                    <Input id="laborPrice" type="number" step="0.01" value={formData.laborPrice} onChange={e => setFormData({ ...formData, laborPrice: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Guardando..." : (editingId ? "Actualizar" : "Crear Instalación")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
