export const getInviteEmailTemplate = (inviteUrl: string): string => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h1>Welcome to HireFlow!</h1>
      <p>You've been invited to join our team.</p>
      <p><a href="${inviteUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      <p>This link expires in 48 hours.</p>
    </body>
  </html>
`;
