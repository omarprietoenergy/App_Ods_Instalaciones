import { compressImage } from "@/lib/image-compression";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Camera, X, FileSignature, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

interface PhotoWithPreview {
  file: File;
  preview: string;
  caption: string;
}

export default function NewDailyReport() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/installations/:id/daily-reports/new");
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedInstallationId = params?.id || searchParams.get('installationId');

  const { user } = useAuth();
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    installationId: preselectedInstallationId || "",
    reportDate: new Date().toISOString().split('T')[0],
    workDescription: "",
    hoursWorked: "",
  });

  const [photos, setPhotos] = useState<PhotoWithPreview[]>([]);
  const [hasSignature, setHasSignature] = useState(false);

  const installationsQuery = trpc.installations.listToday.useQuery();

  const createMutation = trpc.dailyReports.create.useMutation({
    onSuccess: (data) => {
      toast.success("Parte diario creado exitosamente");
      setLocation(`/daily-reports/${data.reportId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el parte diario");
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos((prev) => [
            ...prev,
            {
              file,
              preview: e.target?.result as string,
              caption: "",
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) => (i === index ? { ...photo, caption } : photo))
    );
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.installationId) {
      toast.error("Selecciona una instalación");
      return;
    }

    if (!hasSignature) {
      toast.error("Debes firmar el parte diario");
      return;
    }

    // Get signature as base64
    const signatureData = signatureRef.current?.toDataURL('image/png').split(',')[1];

    // Convert photos to base64 using compression
    const photosData = await Promise.all(
      photos.map(async (photo) => {
        try {
          // Compress to max 1200px, 0.8 quality
          const compressedBase64 = await compressImage(photo.file, 1200, 0.8);
          return {
            data: compressedBase64,
            caption: photo.caption || undefined,
          };
        } catch (e) {
          console.error("Compression failed", e);
          toast.error(`Error procesando imagen: ${photo.file.name}`);
          throw e;
        }
      })
    );

    createMutation.mutate({
      installationId: parseInt(formData.installationId),
      reportDate: new Date(formData.reportDate),
      workDescription: formData.workDescription,
      hoursWorked: parseInt(formData.hoursWorked),
      signatureData,
      photos: photosData,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/daily-reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Parte Diario</h1>
          <p className="text-muted-foreground mt-2">
            Registra el trabajo realizado en la instalación
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {installationsQuery.isSuccess && (!installationsQuery.data || installationsQuery.data.length === 0) && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="font-bold">Sin Asignación Diaria</AlertTitle>
                  <AlertDescription>
                    No tienes ninguna instalación asignada para hoy en el Control Diario.
                    Por favor, contacta con tu responsable para recibir una asignación antes de crear el parte.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="installationId">Instalación *</Label>
                <Select
                  value={formData.installationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, installationId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar instalación" />
                  </SelectTrigger>
                  <SelectContent>
                    {installationsQuery.data?.map((installation) => (
                      <SelectItem key={installation.id} value={installation.id.toString()}>
                        {installation.clientName} - {installation.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reportDate">Fecha *</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) =>
                      setFormData({ ...formData, reportDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hoursWorked">Horas Trabajadas *</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hoursWorked}
                    onChange={(e) =>
                      setFormData({ ...formData, hoursWorked: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workDescription">Descripción del Trabajo *</Label>
                <Textarea
                  id="workDescription"
                  value={formData.workDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, workDescription: e.target.value })
                  }
                  rows={6}
                  placeholder="Describe el trabajo realizado durante el día..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fotos de Avance</CardTitle>
              <CardDescription>
                Sube fotos del progreso de la obra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <label htmlFor="photo-upload" className="cursor-pointer flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Agregar Fotos
                  </label>
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative border border-border rounded-lg p-4 space-y-2">
                      <div className="relative">
                        <img
                          src={photo.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Descripción de la foto (opcional)"
                        value={photo.caption}
                        onChange={(e) => updatePhotoCaption(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firma Digital</CardTitle>
              <CardDescription>
                Firma el parte diario para confirmar el trabajo realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-48 border border-border rounded-md bg-background",
                  }}
                  onEnd={() => setHasSignature(true)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={clearSignature}>
                  <X className="w-4 h-4 mr-2" />
                  Limpiar Firma
                </Button>
                {hasSignature && (
                  <div className="flex items-center text-sm text-green-600">
                    <FileSignature className="w-4 h-4 mr-2" />
                    Firma registrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/daily-reports")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando..." : "Guardar Parte Diario"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
