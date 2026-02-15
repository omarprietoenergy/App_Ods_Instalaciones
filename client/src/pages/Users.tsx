import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users as UsersIcon, Shield, Wrench, Briefcase, UserCog, Plus, Trash2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Users() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<{ id: number; name: string; email: string; role: any } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "technician" as "admin" | "project_manager" | "technician" | "admin_manager",
    password: "",
  });

  // Reset form when dialogs close or open
  useEffect(() => {
    if (isCreateDialogOpen) {
      setFormData({ name: "", email: "", role: "technician", password: "" });
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (isEditDialogOpen && userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        password: "",
      });
    }
  }, [isEditDialogOpen, userToEdit]);

  const utils = trpc.useUtils();
  const usersQuery = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("Usuario creado exitosamente");
      setFormData({ name: "", email: "", role: "technician", password: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el usuario");
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setIsEditDialogOpen(false);
      setUserToEdit(null);
      toast.success("Usuario actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el usuario");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el usuario");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (userToEdit) {
      const updatePayload: any = {
        id: userToEdit.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password && formData.password.length >= 6) {
        updatePayload.password = formData.password;
      }

      updateMutation.mutate(updatePayload);
    }
  };

  const handleDeleteClick = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (u: any) => {
    setUserToEdit({ id: u.id, name: u.name || "", email: u.email || "", role: u.role });
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate({ userId: userToDelete.id });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      project_manager: "Jefe de Proyecto",
      technician: "Técnico",
      admin_manager: "Jefe de Administración",
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-600" />;
      case "project_manager":
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case "technician":
        return <Wrench className="w-4 h-4 text-green-600" />;
      case "admin_manager":
        return <UserCog className="w-4 h-4 text-purple-600" />;
      default:
        return <UsersIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "project_manager":
        return "bg-blue-100 text-blue-800";
      case "technician":
        return "bg-green-100 text-green-800";
      case "admin_manager":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canManageUsers = ["admin", "project_manager"].includes(user?.role || "");

  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos para ver esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de usuarios del sistema
            </p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Todos los usuarios registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Cargando usuarios...</p>
              </div>
            ) : usersQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Método de Login</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            {u.name || "Sin nombre"}
                          </div>
                        </TableCell>
                        <TableCell>{u.email || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.role)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                u.role
                              )}`}
                            >
                              {getRoleLabel(u.role)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {u.loginMethod || "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(u.lastSignedIn).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {['admin', 'project_manager'].includes(user?.role || '') && u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(u.id, u.name || u.email || "Usuario")}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {user?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(u)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Administrador</p>
                <p className="text-sm text-muted-foreground">
                  Acceso completo al sistema, puede crear, editar y eliminar instalaciones, usuarios y configuraciones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Jefe de Proyecto</p>
                <p className="text-sm text-muted-foreground">
                  Puede crear y gestionar instalaciones, asignar técnicos y ver reportes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Técnico</p>
                <p className="text-sm text-muted-foreground">
                  Acceso a sus instalaciones asignadas, puede crear partes diarios y subir documentación.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCog className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Jefe de Administración</p>
                <p className="text-sm text-muted-foreground">
                  Acceso a reportes, estadísticas y gestión administrativa del sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crear un nuevo usuario en el sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="usuario@odsenergy.es"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Técnico
                      </div>
                    </SelectItem>
                    <SelectItem value="project_manager">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Jefe de Proyecto
                      </div>
                    </SelectItem>
                    <SelectItem value="admin_manager">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Jefe de Administración
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">ℹ️ Nota importante</p>
                <p>
                  Define una contraseña segura para el usuario.
                  Una vez creada, el usuario podrá acceder directamente.
                </p>
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modificar los datos y rol del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@odsenergy.es"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Técnico
                      </div>
                    </SelectItem>
                    <SelectItem value="project_manager">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Jefe de Proyecto
                      </div>
                    </SelectItem>
                    <SelectItem value="admin_manager">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Jefe de Administración
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar al usuario <strong>{userToDelete?.name}</strong>.
              Esta acción no se puede deshacer y el usuario perderá acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
