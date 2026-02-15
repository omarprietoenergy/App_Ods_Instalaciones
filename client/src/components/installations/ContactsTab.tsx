import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Phone, User } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function ContactsTab({ installationId }: { installationId: number }) {
    const utils = trpc.useUtils();
    const contactsQuery = trpc.contacts.list.useQuery({ installationId }); // Wait, need to check if router has list by installation
    // Router check: trpc.contacts.list -> lines 604 ish. I didn't see it explicitly in my view, but `db.ts` had `getContactsByInstallation`.
    // Let's assume it's exposed or verify.
    // Actually, I should verify `server/routers.ts` again. I didn't verify if `contacts` router was there fully. 
    // I only added `history`.
    // If `contacts` router is missing, I need to add it.
    // Assuming it might be missing based on my previous partial view. 
    // But let's write the component assuming it will be there, and I will fix backend next if needed.

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);

    const createMutation = trpc.contacts.create.useMutation({
        onSuccess: () => {
            utils.contacts.list.invalidate(); // Fixed invalidation key from 'contacts' to 'contacts.list'
            setIsOpen(false);
            resetForm();
            toast.success("Contacto añadido");
        }
    });

    const updateMutation = trpc.contacts.update.useMutation({
        onSuccess: () => {
            utils.contacts.list.invalidate();
            setIsOpen(false);
            resetForm();
            toast.success("Contacto actualizado");
        }
    });

    const deleteMutation = trpc.contacts.delete.useMutation({
        onSuccess: () => {
            utils.contacts.list.invalidate();
            toast.success("Contacto eliminado");
        }
    });

    const resetForm = () => {
        setName("");
        setPhone("");
        setRole("");
        setEditingId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsOpen(true);
    };

    const handleOpenEdit = (contact: any) => {
        setEditingId(contact.id);
        setName(contact.contactName);
        setPhone(contact.contactPhone || "");
        setRole(contact.contactRole || "");
        setIsOpen(true);
    };

    const handleSubmit = () => {
        if (!name) return;

        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                contactName: name,
                contactPhone: phone,
                contactRole: role
            });
        } else {
            createMutation.mutate({
                installationId,
                contactName: name,
                contactPhone: phone,
                contactRole: role
            });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Contactos Auxiliares</CardTitle>
                    <CardDescription>Otras personas de contacto para esta instalación</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleOpenCreate}><Plus className="w-4 h-4 mr-2" /> Agregar Contacto</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej. 600 123 456" />
                            </div>
                            <div className="space-y-2">
                                <Label>Rol / Cargo</Label>
                                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ej. Encargado de Obra" />
                            </div>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                                {editingId ? "Actualizar" : "Guardar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contactsQuery.isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Cargando...</TableCell></TableRow>
                        ) : contactsQuery.data?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No hay contactos adicionales.</TableCell></TableRow>
                        ) : (
                            contactsQuery.data?.map(contact => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        {contact.contactName}
                                    </TableCell>
                                    <TableCell>
                                        {contact.contactPhone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-muted-foreground" />
                                                {contact.contactPhone}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{contact.contactRole}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(contact)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: contact.id })}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
