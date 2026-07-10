import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  bcc,
  subject,
  html,
}: {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP_USER or SMTP_PASS is not set. Email not sent.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Practice-Lab"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        }>`,
      to,
      bcc,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendAssignmentNotification(
  studentEmails: string[],
  assignmentDetails: {
    title: string;
    description: string | null;
    isExam: boolean;
    dueDate: Date | null;
    classroomId: string;
  }
) {
  if (studentEmails.length === 0) return false;

  const subject = `[แจ้งเตือน] มี${assignmentDetails.isExam ? "การสอบ" : "แบบฝึกหัด"}ใหม่: ${assignmentDetails.title
    }`;

  const dueDateText = assignmentDetails.dueDate
    ? new Date(assignmentDetails.dueDate).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " น."
    : "ไม่มีกำหนดส่ง";

  // Base URL for links (usually set in env, fallback to localhost for dev)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/classroom/${assignmentDetails.classroomId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-w: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: ${assignmentDetails.isExam ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}; padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
            ${assignmentDetails.isExam ? "📝 การสอบใหม่ (Exam)" : "📖 แบบฝึกหัดใหม่ (Assignment)"}
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">
            สวัสดีครับ, <br><br>มีรายการที่ได้รับมอบหมายใหม่ในห้องเรียนของคุณ:
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 20px;">${assignmentDetails.title}</h2>
            ${assignmentDetails.description
      ? `<p style="margin: 0 0 20px 0; color: #64748b; font-size: 15px; line-height: 1.6;">${assignmentDetails.description}</p>`
      : ""
    }
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 120px;">📅 กำหนดส่ง:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${dueDateText}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center;">
            <a href="${link}" style="display: inline-block; background-color: ${assignmentDetails.isExam ? '#ef4444' : '#4f46e5'}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              คลิกที่นี่เพื่อเข้าสู่ห้องเรียน
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            อีเมลฉบับนี้ส่งจากระบบอัตโนมัติ Practice Lab<br>
            กรุณาอย่าตอบกลับอีเมลนี้
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Sending email to all students using BCC to protect privacy
  return sendEmail({
    to: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER, // Send to self
    bcc: studentEmails,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyLink = `${baseUrl}/auth/verify?token=${token}`;

  const subject = "ยืนยันการสมัครสมาชิก Practice Lab";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-w: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
            ยินดีต้อนรับสู่ระบบเรียนรู้!
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px; text-align: center;">
          <div style="margin-bottom: 24px;">
            <svg style="width: 64px; height: 64px; color: #10b981; margin: 0 auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          
          <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">ยืนยันที่อยู่อีเมลของคุณ</h2>
          
          <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
            ขอบคุณสำหรับการสมัครสมาชิกบัญชี Practice Lab <br>กรุณาคลิกที่ปุ่มด้านล่างเพื่อยืนยันบัญชีของคุณและเริ่มต้นใช้งาน
          </p>

          <!-- Action Button -->
          <a href="${verifyLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 32px;">
            ยืนยันอีเมล
          </a>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: left;">
            <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
              หากปุ่มใช้งานไม่ได้ คุณสามารถคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
              <a href="${verifyLink}" style="color: #10b981; word-break: break-all;">${verifyLink}</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
            หากคุณไม่ได้ดำเนินการสมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลฉบับนี้
          </p>
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            © ${new Date().getFullYear()} Practice Lab. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
