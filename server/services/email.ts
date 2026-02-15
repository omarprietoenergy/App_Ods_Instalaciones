import nodemailer from 'nodemailer';

// Configure transporter
const getTransporter = () => {
    // In production, use real SMTP from env
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback (for now just log or use ethereal if needed, but logging is safer for local dev without setup)
    // We'll return null to signal "mock mode" or return a stub.
    return null;
};

export async function sendEmail({ to, subject, text, html, attachments }: {
    to: string,
    subject: string,
    text?: string,
    html?: string,
    attachments?: { filename: string, path?: string, content?: string | Buffer }[]
}) {
    const transporter = getTransporter();

    if (!transporter) {
        console.log(`[Email Service - MOCK] Would send email to: ${to}`);
        console.log(`[Email Service - MOCK] Subject: ${subject}`);
        if (attachments) console.log(`[Email Service - MOCK] Attachments: ${attachments.length}`);
        return { success: true, mocked: true };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"ODS Energy" <no_reply@odsenergy.es>',
            to,
            subject,
            text,
            html,
            attachments
        });
        console.log(`[Email Service] Message sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("[Email Service] Error sending email:", error);
        // Don't throw to avoid breaking the main transaction flow, but return error status
        return { success: false, error };
    }
}
