import * as db from "../db";
import { sendEmail } from "./email";
import { renderTemplate, prepareEmailHtml } from "../email-template-renderer";

export type NotificationType = "installation_started" | "installation_completed" | "client_conformity";

export async function sendInstallationNotification(
    installationId: number,
    type: NotificationType,
    clientEmailOveride?: string
) {
    try {
        const installation = await db.getInstallationById(installationId);
        if (!installation) {
            console.warn(`[NotificationService] Installation ${installationId} not found.`);
            return;
        }

        const template = await db.getEmailTemplateByType(type);
        if (!template || !template.isActive) {
            console.log(`[NotificationService] Template ${type} is not active or not found. Skipping email.`);
            return;
        }

        const to = clientEmailOveride || installation.clientEmail;
        if (!to) {
            console.warn(`[NotificationService] No email found for client in installation ${installationId}.`);
            return;
        }

        // Prepare data for rendering
        const data = {
            clientId: installation.clientId,
            clientName: installation.clientName,
            address: installation.address,
            workOrderType: installation.workOrderType === 'installation' ? 'Instalación' :
                installation.workOrderType === 'breakdown' ? 'Avería' : 'Mantenimiento',
            startDate: installation.startDate,
            endDate: installation.endDate,
            signatureDate: installation.clientSignatureDate,
            installationId: installation.id,
            logoUrl: template.logoUrl || "https://app.odsenergy.net/logo.png"
        };

        const subject = renderTemplate(template.subject, data);
        const body = renderTemplate(template.body, data);
        const signature = template.signature ? renderTemplate(template.signature, data) : "";

        const html = prepareEmailHtml(body, signature);

        const attachments: any[] = [];
        if (type === "client_conformity" && installation.conformityPdfUrl) {
            attachments.push({
                filename: `conformidad-${installation.clientId}.pdf`,
                path: installation.conformityPdfUrl
            });
        }

        console.log(`[NotificationService] Sending ${type} email to ${to}...`);

        await sendEmail({
            to,
            subject,
            html,
            attachments
        });

        // Also send copy to info@odsenergy.es for conformity if it's the case
        if (type === "client_conformity") {
            await sendEmail({
                to: "info@odsenergy.es",
                subject: `[COPIA] ${subject}`,
                html: `<p>Este es una copia automática del documento de conformidad enviado al cliente.</p><hr>${html}`,
                attachments
            });
        }

    } catch (error) {
        console.error(`[NotificationService] Error sending ${type} notification:`, error);
    }
}
