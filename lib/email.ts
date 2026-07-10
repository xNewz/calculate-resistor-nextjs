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
      from: `"${process.env.SMTP_FROM_NAME || "Calculate Resistor LMS"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
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

  const subject = `[แจ้งเตือน] มี${assignmentDetails.isExam ? "การสอบ" : "แบบฝึกหัด"}ใหม่: ${
    assignmentDetails.title
  }`;

  const dueDateText = assignmentDetails.dueDate
    ? new Date(assignmentDetails.dueDate).toLocaleString("th-TH") + " น."
    : "ไม่มีกำหนดส่ง";

  // Base URL for links (usually set in env, fallback to localhost for dev)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/classroom/${assignmentDetails.classroomId}`;

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #ffffff;">
      <h2 style="color: ${assignmentDetails.isExam ? '#ef4444' : '#4f46e5'}; margin-top: 0;">
        คุณมี${assignmentDetails.isExam ? "การสอบ" : "แบบฝึกหัด"}ใหม่!
      </h2>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">${assignmentDetails.title}</h3>
        ${
          assignmentDetails.description
            ? `<p style="color: #4b5563; font-size: 14px;">${assignmentDetails.description}</p>`
            : ""
        }
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 100px;">ประเภท:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">
              ${assignmentDetails.isExam ? "📝 การสอบ (จับเวลา)" : "📖 แบบฝึกหัดทั่วไป"}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">กำหนดส่ง:</td>
            <td style="padding: 8px 0; color: #111827; font-weight: bold;">${dueDateText}</td>
          </tr>
        </table>
      </div>

      <a href="${link}" style="display: inline-block; background-color: ${
    assignmentDetails.isExam ? '#ef4444' : '#4f46e5'
  }; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">
        เข้าสู่ห้องเรียนเพื่อทำแบบทดสอบ
      </a>
      
      <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
        อีเมลฉบับนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ
      </p>
    </div>
  `;

  // Sending email to all students using BCC to protect privacy
  return sendEmail({
    to: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER, // Send to self
    bcc: studentEmails,
    subject,
    html,
  });
}
