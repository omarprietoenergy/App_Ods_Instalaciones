/**
 * Renders a template string by replacing {{variableName}} with values from the data object.
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
    if (!template) return "";

    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        const value = data[trimmedKey];

        // If value is a Date, format it nicely
        if (value instanceof Date) {
            return value.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        return value !== undefined ? String(value) : match;
    });
}

/**
 * Combines body and signature, and wraps in a basic HTML structure if needed.
 */
export function prepareEmailHtml(body: string, signature?: string | null): string {
    const combined = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="padding: 20px;">
                ${body}
            </div>
            ${signature ? `
            <div style="padding: 20px; border-top: 1px solid #eee; margin-top: 20px; font-size: 0.9em; color: #666;">
                ${signature}
            </div>
            ` : ''}
        </div>
    `;
    return combined;
}
