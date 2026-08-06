import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log(`[ETHEREAL MAIL INITIALIZED] Test User: ${testAccount.user}`);
  return cachedTransporter;
}

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusDesk</title>
</head>
<body style="margin:0;padding:0;background-color:#F0EFEA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0EFEA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:20px;border-bottom:1px solid #D6D3CA;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1C1917;letter-spacing:-0.2px;">Campus<em style="font-style:italic;color:#D97706;">Desk</em></span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px 0 0 0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;">
              <div style="border-top:1px solid #D6D3CA;padding-top:16px;">
                <p style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:11px;color:#A8A29E;margin:0;">
                  CampusDesk &middot; LNMIIT
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(toEmail: string, otp: string) {
  try {
    const transporter = await getTransporter();
    const fromAddress = `"CampusDesk LNMIIT" <no-reply@campusdesk.lnmiit.ac.in>`;

    const content = `
      <p style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:14px;color:#1C1917;margin:0 0 20px 0;line-height:1.5;">
        Your sign-in code:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="background-color:#FAFAF8;border:1px solid #D6D3CA;border-left:3px solid #D97706;padding:18px 24px;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:#1C1917;letter-spacing:10px;display:block;">${otp}</span>
          </td>
        </tr>
      </table>

      <p style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:13px;color:#78716C;margin:0;line-height:1.5;">
        Expires in 5 minutes.
      </p>
    `;

    const html = emailShell(content);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `${otp} is your CampusDesk code`,
      text: `Your CampusDesk sign-in code is: ${otp}\nValid for 5 minutes.`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL OTP SENT] To: ${toEmail} | Message ID: ${info.messageId}`);
    if (previewUrl) console.log(`[ETHEREAL PREVIEW URL] ${previewUrl}`);

    return { messageId: info.messageId, previewUrl: previewUrl || false };
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send OTP email:", error);
    return { error: "Failed to send email" };
  }
}

export async function sendReminderEmail(
  toEmail: string,
  userName: string,
  resourceName: string,
  startTime: Date,
  endTime: Date
) {
  try {
    const transporter = await getTransporter();
    const fromAddress = `"CampusDesk LNMIIT" <reminders@campusdesk.lnmiit.ac.in>`;

    const firstName = userName.split(" ")[0];

    const dateStr = startTime.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const startStr = startTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endStr = endTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const content = `
      <p style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:14px;color:#1C1917;margin:0 0 20px 0;line-height:1.5;">
        Hi ${firstName}, your booking starts in an hour:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="background-color:#FAFAF8;border:1px solid #D6D3CA;border-left:3px solid #4D7C5E;padding:20px 24px;">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1C1917;margin:0 0 12px 0;font-weight:400;">${resourceName}</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:12px;color:#78716C;padding-right:16px;padding-bottom:4px;">Date</td>
                <td style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:13px;color:#1C1917;font-weight:500;padding-bottom:4px;">${dateStr}</td>
              </tr>
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:12px;color:#78716C;padding-right:16px;">Time</td>
                <td style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:13px;color:#1C1917;font-weight:500;">${startStr} &ndash; ${endStr}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const html = emailShell(content);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Reminder: ${resourceName} at ${startStr}`,
      text: `Hi ${firstName},\n\nYour booking for ${resourceName} starts at ${startStr} today (${dateStr}).`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[REMINDER EMAIL SENT] To: ${toEmail} | Resource: ${resourceName}`);
    if (previewUrl) console.log(`[ETHEREAL REMINDER PREVIEW] ${previewUrl}`);

    return { messageId: info.messageId, previewUrl: previewUrl || false };
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send reminder email:", error);
    return { error: "Failed to send email" };
  }
}
