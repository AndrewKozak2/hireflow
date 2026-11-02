function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

export interface RejectionEmailParams {
  candidateName: string;
  jobTitle: string;
}

export function getRejectionEmailTemplate({
  candidateName,
  jobTitle,
}: RejectionEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #5b5454; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #1c7ed6; padding: 28px 40px; border-radius: 8px 8px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">HireFlow</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 0 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; font-family: Arial, Helvetica, sans-serif;">Dear ${escapeHtml(candidateName)},</p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                Thank you for taking the time to apply for the <strong>${escapeHtml(jobTitle)}</strong> position.
                We genuinely appreciate your interest and the effort you put into your application.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                After careful review, we regret to inform you that we will not be moving forward with your
                application at this time.
              </p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                We encourage you to continue exploring other opportunities that may be a great fit for your skills and experience.
                We wish you all the best in your job search.
              </p>
              <p style="margin: 0; font-size: 15px; color: #333333; font-family: Arial, Helvetica, sans-serif;">
                Best regards,<br>
                <strong>The HireFlow Team</strong>
              </p>
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
