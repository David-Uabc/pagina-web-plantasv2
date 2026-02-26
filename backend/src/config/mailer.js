const Brevo = require("@getbrevo/brevo");

const sendResetEmail = async (to, resetUrl) => {
  const client = Brevo.ApiClient.instance;
  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const api = new Brevo.TransactionalEmailsApi();

  await api.sendTransacEmail({
    subject: "Recuperar contraseña — Riego IoT",
    to: [{ email: to }],
    sender: { name: "Sistema de Riego IoT", email: "sistemariego2026@gmail.com" },
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0d1117;color:#e2e8f0;border-radius:12px;">
        <h2 style="color:#34d399;margin-bottom:8px;">💧 Riego IoT</h2>
        <h3 style="margin-bottom:16px;">Recuperar contraseña</h3>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#34d399;color:#000;border-radius:8px;font-weight:700;text-decoration:none;">
          Restablecer contraseña
        </a>
        <p style="color:#94a3b8;font-size:13px;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>
        <hr style="border-color:#1e293b;margin:24px 0;" />
        <p style="color:#475569;font-size:12px;">Sistema de Riego IoT — No respondas a este correo.</p>
      </div>
    `,
  });
};

module.exports = { sendResetEmail };