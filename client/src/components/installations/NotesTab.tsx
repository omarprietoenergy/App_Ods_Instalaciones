import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Reply, MessageSquare } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
    id: number;
    noteText: string;
    createdAt: string | Date;
    userId: number;
    parentNoteId: number | null;
    replies?: Note[];
}

export function NotesTab({ installationId }: { installationId: number }) {
    const { user } = useAuth();
    const utils = trpc.useUtils();
    const notesQuery = trpc.notes.list.useQuery({ installationId });
    const usersQuery = trpc.users.list.useQuery();

    const [newNoteText, setNewNoteText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const createMutation = trpc.notes.create.useMutation({
        onSuccess: () => {
            utils.notes.list.invalidate({ installationId });
            setNewNoteText("");
            setReplyText("");
            setReplyingTo(null);
            toast.success("Nota añadida");
        },
        onError: (err) => toast.error(err.message)
    });

    // Organize notes into threads
    const organizeNotes = (notes: any[]): Note[] => {
        if (!notes) return [];
        const parentNotes = notes.filter(n => !n.parentNoteId).map(n => ({ ...n, replies: [] }));
        const childNotes = notes.filter(n => n.parentNoteId);

        parentNotes.forEach(parent => {
            parent.replies = childNotes
                .filter(child => child.parentNoteId === parent.id)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        return parentNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const getUserName = (userId: number) => usersQuery.data?.find(u => u.id === userId)?.name || "Usuario";

    const handleCreate = (parentNoteId?: number) => {
        const text = parentNoteId ? replyText : newNoteText;
        if (!text.trim()) return;
        createMutation.mutate({
            installationId,
            noteText: text,
            parentNoteId
        });
    };

    const threadedNotes = organizeNotes(notesQuery.data || []);

    const NoteItem = ({ note, isReply = false }: { note: Note, isReply?: boolean }) => (
        <div className={cn("p-4 rounded-lg border bg-card", isReply ? "ml-8 mt-2 bg-muted/40 border-l-4 border-l-primary/20" : "mb-4")}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                        <MessageSquare className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{getUserName(note.userId)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap pl-9">{note.noteText}</p>

            {!isReply && (
                <div className="mt-3 flex gap-2 pl-9">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setReplyingTo(replyingTo === note.id ? null : note.id)}
                    >
                        <Reply className="w-3 h-3 mr-1" />
                        Responder
                    </Button>
                </div>
            )}

            {/* Reply Input */}
            {replyingTo === note.id && (
                <div className="mt-3 ml-9 flex gap-2">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe una respuesta..."
                        className="min-h-[60px]"
                    />
                    <Button size="sm" onClick={() => handleCreate(note.id)} disabled={createMutation.isPending}>
                        Enviar
                    </Button>
                </div>
            )}

            {/* Render Replies */}
            {note.replies && note.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                    {note.replies.map(reply => (
                        <NoteItem key={reply.id} note={reply} isReply={true} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-4">
                <CardTitle className="text-lg">Notas de la Instalación</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                {/* New Note Input */}
                <div className="flex gap-2 mb-2">
                    <Textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Escribe una nueva nota o comentario..."
                        className="min-h-[80px]"
                    />
                </div>
                <div className="flex justify-end mb-4">
                    <Button onClick={() => handleCreate()} disabled={createMutation.isPending || !newNoteText.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Nota
                    </Button>
                </div>

                <div className="space-y-1">
                    {notesQuery.isLoading ? (
                        <p className="text-center text-muted-foreground py-8">Cargando notas...</p>
                    ) : threadedNotes.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg border-dashed">
                            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-muted-foreground">No hay notas registradas.</p>
                        </div>
                    ) : (
                        threadedNotes.map(note => <NoteItem key={note.id} note={note} />)
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
