import { escapeHtml } from "./email-utils";

const URL_REGEX = /(https?:\/\/[^\s]+)/;

function buildHtmlBody(body: string): string {
  return body
    .split(URL_REGEX)
    .map((part, i) => {
      if (i % 2 === 1) {
        const safeUrl = part
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<a href="${safeUrl}" style="color: #1c7ed6; text-decoration: underline;">${safeUrl}</a>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

export interface GenericEmailParams {
  body: string;
}

export function getGenericEmailTemplate({ body }: GenericEmailParams): string {
  const htmlBody = buildHtmlBody(body);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #1c7ed6; padding: 28px 40px; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">HireFlow</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 40px 40px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">${htmlBody}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #868e96; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                This email was sent by HireFlow. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
