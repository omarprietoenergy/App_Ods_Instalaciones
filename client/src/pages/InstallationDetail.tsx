import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  MapPin,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sub-components
import { OverviewTab } from "@/components/installations/OverviewTab";
import { MaterialsTab } from "@/components/installations/MaterialsTab";
import { ReportsTab } from "@/components/installations/ReportsTab";
import { DocumentsTab } from "@/components/installations/DocumentsTab";
import { SignatureTab } from "@/components/installations/SignatureTab";
import { NotesTab } from "@/components/installations/NotesTab";
import { ContactsTab } from "@/components/installations/ContactsTab";
import { HistoryTab } from "@/components/installations/HistoryTab";
import TechniciansTab from "@/components/installations/TechniciansTab";

export default function InstallationDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/installations/:id");
  const installationId = params?.id ? parseInt(params.id) : 0;

  // State
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = queryParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const utils = trpc.useUtils();

  // Queries
  const installationQuery = trpc.installations.getById.useQuery({ id: installationId });

  // Mutations
  const updateMutation = trpc.installations.update.useMutation({
    onSuccess: () => {
      utils.installations.getById.invalidate({ id: installationId });
      utils.installationStatusHistory.list.invalidate({ installationId });
      toast.success("Estado actualizado");
    },
    onError: (err) => toast.error(err.message)
  });

  if (installationQuery.isLoading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>;
  if (!installationQuery.data) return <div className="p-8 text-center">Instalación no encontrada</div>;

  const inst = installationQuery.data;
  const isManager = ['admin', 'project_manager', 'admin_manager'].includes(user?.role || '');

  // Status Badge Logic
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500"
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "Iniciada",
    completed: "Completada",
    cancelled: "Cancelada"
  };

  const badgeColor = statusColor[inst.status] || "bg-gray-500";
  const badgeLabel = statusLabel[inst.status] || inst.status;

  return (
    <DashboardLayout>
      <div className="space-y-6 container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/installations")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{inst.clientName}</h1>
                <Badge className={cn("ml-2 hover:bg-opacity-80", badgeColor)}>{badgeLabel}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" /> {inst.address}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Change - Only for Managers */}
            {isManager ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Estado:</span>
                <Select
                  disabled={updateMutation.isPending}
                  value={inst.status}
                  onValueChange={(val) => updateMutation.mutate({ id: inst.id, status: val as any })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">Iniciada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Rol Técnico: Solo Lectura
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-lg mb-4">
            <TabsTrigger className="py-2" value="overview">Resumen</TabsTrigger>
            <TabsTrigger className="py-2" value="documents">Documentos</TabsTrigger>
            <TabsTrigger className="py-2" value="reports">Partes Diarios</TabsTrigger>
            <TabsTrigger className="py-2" value="materials">Materiales</TabsTrigger>
            <TabsTrigger className="py-2" value="notes">Notas</TabsTrigger>
            <TabsTrigger className="py-2" value="contacts">Contactos</TabsTrigger>
            <TabsTrigger className="py-2" value="signature">Firma Cliente</TabsTrigger>
            <TabsTrigger className="py-2" value="technicians">Técnicos</TabsTrigger>
            <TabsTrigger className="py-2" value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab installation={inst} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <DocumentsTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="materials" className="mt-0">
            <MaterialsTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-0">
            <ContactsTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="signature" className="mt-0">
            <SignatureTab installation={inst} refetch={installationQuery.refetch} />
          </TabsContent>

          <TabsContent value="technicians" className="mt-0">
            <TechniciansTab installationId={inst.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryTab installationId={inst.id} />
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
