export const getResetPasswordEmailTemplate = (resetUrl: string): string => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h1>Reset your HireFlow password</h1>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    </body>
  </html>
`;
