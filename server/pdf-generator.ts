import { jsPDF } from "jspdf";
import * as db from "./db";

interface DailyReportData {
  id: number;
  installationId: number;
  userId: number;
  reportDate: Date;
  workDescription: string;
  hoursWorked: number;
  signatureUrl: string | null;
  signatureKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos?: Array<{
    id: number;
    dailyReportId: number;
    fileKey: string;
    fileUrl: string;
    caption: string | null;
    createdAt: Date;
  }>;
}

export async function generateDailyReportPDF(reportId: number): Promise<Buffer> {
  // Get report data
  const report = await db.getDailyReportById(reportId);
  if (!report) {
    throw new Error("Parte diario no encontrado");
  }

  const photos = await db.getPhotosByDailyReport(reportId);
  const installation = await db.getInstallationById(report.installationId);
  const user = await db.getUserById(report.userId);

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ODS Energy", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(16);
  doc.text("PARTE DIARIO DE TRABAJO", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Installation Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información de la Instalación", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (installation) {
    doc.text(`Cliente: ${installation.clientName}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Dirección: ${installation.address}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Tipo: ${installation.installationType}`, 20, yPosition);
    yPosition += 10;
  }

  // Report Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Parte", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Fecha: ${new Date(report.reportDate).toLocaleDateString("es-ES")}`,
    20,
    yPosition
  );
  yPosition += 6;
  doc.text(`Técnico: ${user?.name || "N/A"}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Horas trabajadas: ${report.hoursWorked}`, 20, yPosition);
  yPosition += 10;

  // Work Description
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Descripción del Trabajo", 20, yPosition);
  yPosition += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(
    report.workDescription,
    pageWidth - 40
  );
  doc.text(descriptionLines, 20, yPosition);
  yPosition += descriptionLines.length * 6 + 10;

  // Photos section
  if (photos.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fotos de Avance", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total de fotos adjuntas: ${photos.length}`, 20, yPosition);
    yPosition += 8;

    // List photo captions
    photos.forEach((photo, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const caption = photo.caption || `Foto ${index + 1}`;
      doc.text(`• ${caption}`, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
  }

  // Signature
  if (report.signatureUrl) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Firma del Técnico", 20, yPosition);
    yPosition += 8;

    // Note: In a real implementation, you would fetch and embed the signature image
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("(Firma digital registrada)", 20, yPosition);
    yPosition += 15;
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

export async function generateConformityPDF(installationId: number, signatureUrl: string, technicianObservations?: string): Promise<Buffer> {
  const installation = await db.getInstallationById(installationId);
  if (!installation) throw new Error("Instalación no encontrada");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONFORMIDAD DEL CLIENTE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(14);
  doc.text("ODS Energy", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 20;

  // Body
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const text = `Por medio del presente documento, el cliente ${installation.clientName}, con DNI/CIF ${installation.clientDocument || "N/A"}, manifiesta su conformidad con los trabajos realizados en la dirección ${installation.address}.`;

  const lines = doc.splitTextToSize(text, pageWidth - 40);
  doc.text(lines, 20, yPosition);
  yPosition += lines.length * 7 + 10;

  // Work Details
  doc.setFont("helvetica", "bold");
  doc.text("Detalles del Trabajo:", 20, yPosition);
  yPosition += 8;
  doc.setFont("helvetica", "normal");

  doc.text(`Tipo de Orden: ${installation.workOrderType}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Descripción: ${installation.workDescription || "N/A"}`, 20, yPosition);
  yPosition += 15;

  if (technicianObservations) {
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones del Técnico:", 20, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    const obsLines = doc.splitTextToSize(technicianObservations, pageWidth - 40);
    doc.text(obsLines, 20, yPosition);
    yPosition += obsLines.length * 7 + 15;
  }

  // Signature
  if (signatureUrl && yPosition < pageHeight - 60) {
    doc.setFont("helvetica", "bold");
    doc.text("Firma del Cliente:", 20, yPosition);
    yPosition += 10;

    // In a real app we'd fetch the image, but for now we put a placeholder or just text if we can't fetch deeply inside this func context easily without more deps.
    // However, `addClientSignature` mutation has the base64 data available when it calls this functions? 
    // If we pass base64 directly it's better. But the signature matches `signatureUrl`.
    // Let's rely on text marker for now to avoid complexity of fetching URL inside PDF gen which might fail or need network access.
    // Or even better: pass base64 to this function if available.
    doc.text("(Firma Digital Registrada)", 20, yPosition);
  }

  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.text(`Fecha de conformidad: ${new Date().toLocaleDateString("es-ES")}`, 20, footerY);

  return Buffer.from(doc.output("arraybuffer"));
}
