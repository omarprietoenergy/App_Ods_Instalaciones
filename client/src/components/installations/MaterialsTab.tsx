import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export function MaterialsTab({ installationId }: { installationId: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Materiales</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    La gestión de materiales se realiza en una página dedicada para permitir el control de stock, recepciones y solicitudes.
                </p>
                <Link href={`/installations/${installationId}/materials`}>
                    <Button variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Abrir Gestión de Materiales
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
