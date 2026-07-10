import { NextRequest, NextResponse } from "next/server";
import { sendAssignmentNotification, sendVerificationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({
      error: "Missing email parameter. Usage: /api/test-email?email=your@email.com"
    }, { status: 400 });
  }

  try {
    // 1. Test Assignment Email (Normal)
    await sendAssignmentNotification([email], {
      title: "แบบฝึกหัดทดสอบ: การอ่านค่าแถบสีตัวต้านทาน 4 แถบสี",
      description: "นี่คืออีเมลทดสอบสำหรับแบบฝึกหัด กรุณาฝึกฝนการอ่านค่าความต้านทานให้แม่นยำเพื่อเตรียมพร้อมสำหรับการสอบปลายภาค",
      isExam: false,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      classroomId: "test-classroom-123",
    });

    // 2. Test Assignment Email (Exam)
    await sendAssignmentNotification([email], {
      title: "การสอบย่อย: การวัดกระแสไฟฟ้าด้วยมัลติมิเตอร์",
      description: "นี่คืออีเมลทดสอบสำหรับการสอบ โปรดเตรียมตัวให้พร้อมสำหรับการสอบจับเวลา 30 นาที",
      isExam: true,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      classroomId: "test-classroom-456",
    });

    // 3. Test Verification Email
    await sendVerificationEmail(email, "test-token-1234567890");

    return NextResponse.json({
      success: true,
      message: `Successfully sent 3 test emails to ${email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error("Error sending test emails:", error);
    return NextResponse.json({
      error: "Failed to send test emails. Check server console for details."
    }, { status: 500 });
  }
}
