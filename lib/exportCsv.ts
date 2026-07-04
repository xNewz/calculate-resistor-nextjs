export function calculateGrade(percentage: number): string {
  if (percentage >= 80) return "4.0";
  if (percentage >= 75) return "3.5";
  if (percentage >= 70) return "3.0";
  if (percentage >= 65) return "2.5";
  if (percentage >= 60) return "2.0";
  if (percentage >= 55) return "1.5";
  if (percentage >= 50) return "1.0";
  return "0.0";
}

export function downloadGradebookCsv(
  classroomName: string,
  enrollments: any[],
  assignments: any[],
  submissions: any[]
) {
  // 1. Create headers
  const headers = ["ชื่อผู้เรียน", "อีเมล"];
  assignments.forEach((asg) => {
    headers.push(`"${asg.title.replace(/"/g, '""')} (เต็ม ${asg.questionCount})"`);
  });
  
  // Add summary headers
  headers.push("คะแนนรวมทั้งหมด");
  headers.push("คะแนนเต็มรวม");
  headers.push("เปอร์เซ็นต์รวม (%)");
  headers.push("เกรดสะสม");

  const csvRows = [];
  csvRows.push(headers.join(","));

  // 2. Create rows
  enrollments.forEach((enr) => {
    const row = [
      `"${enr.user.name.replace(/"/g, '""')}"`, // Quote strings in case they have commas
      `"${enr.user.email.replace(/"/g, '""')}"`,
    ];

    let studentTotalScore = 0;
    let studentTotalMax = 0;

    assignments.forEach((asg) => {
      studentTotalMax += asg.questionCount;
      const sub = submissions.find(
        (s) => s.assignmentId === asg.id && s.studentId === enr.userId
      );
      if (sub) {
        row.push(sub.score.toString());
        studentTotalScore += sub.score;
      } else {
        row.push("0"); // Using 0 for grade calculations
      }
    });

    const studentPct = studentTotalMax > 0 ? Math.round((studentTotalScore / studentTotalMax) * 100) : 0;
    const studentGrade = calculateGrade(studentPct);

    // Push summaries
    row.push(studentTotalScore.toString());
    row.push(studentTotalMax.toString());
    row.push(`${studentPct}%`);
    row.push(studentGrade);

    csvRows.push(row.join(","));
  });

  // 3. Create blob and download
  const csvString = csvRows.join("\n");
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Gradebook_${classroomName.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function downloadStudentGradebookCsv(
  studentName: string,
  classroomName: string,
  assignments: any[],
  submissions: any[]
) {
  // Sort assignments by creation date (same as chart)
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const csvRows = [];
  
  // Title / Metadata rows
  csvRows.push(`"รายงานผลคะแนนรายบุคคล","${studentName.replace(/"/g, '""')}"`);
  csvRows.push(`"ห้องเรียน","${classroomName.replace(/"/g, '""')}"`);
  csvRows.push(`"วันที่ส่งออก","${new Date().toLocaleDateString("th-TH")} ${new Date().toLocaleTimeString("th-TH")}"`);
  csvRows.push(""); // empty spacing row
  
  // Headers
  csvRows.push("ลำดับ,แบบฝึกหัด/ข้อสอบ,ประเภท,คะแนนที่ได้,คะแนนเต็ม,เปอร์เซ็นต์ (%),สถานะ,วันที่ส่ง");

  let totalScore = 0;
  let totalMax = 0;
  let submittedCount = 0;

  sortedAssignments.forEach((asg, index) => {
    const sub = submissions.find((s) => s.assignmentId === asg.id);
    const hasSubmitted = !!sub;
    const typeLabel = asg.isExam ? "ข้อสอบ" : "แบบฝึกหัด";
    
    let scoreStr = "-";
    let pctStr = "-";
    let statusStr = "ยังไม่ส่ง";
    let dateStr = "-";

    if (hasSubmitted) {
      scoreStr = sub.score.toString();
      totalScore += sub.score;
      submittedCount++;
      const pct = Math.round((sub.score / asg.questionCount) * 100);
      pctStr = `${pct}%`;
      
      const isSubLate = asg.dueDate && new Date(sub.createdAt) > new Date(asg.dueDate);
      statusStr = isSubLate ? "ส่งเกินเวลา" : "ส่งแล้ว";
      dateStr = new Date(sub.createdAt).toLocaleDateString("th-TH") + " " + new Date(sub.createdAt).toLocaleTimeString("th-TH");
    }
    
    totalMax += asg.questionCount;

    const row = [
      (index + 1).toString(),
      `"${asg.title.replace(/"/g, '""')}"`,
      `"${typeLabel}"`,
      scoreStr,
      asg.questionCount.toString(),
      pctStr,
      `"${statusStr}"`,
      `"${dateStr}"`
    ];
    csvRows.push(row.join(","));
  });

  csvRows.push(""); // spacing

  // Summary rows
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const simulatedGrade = calculateGrade(overallPct);

  csvRows.push(`"จำนวนที่ส่งแล้ว","${submittedCount} / ${assignments.length} ชิ้น"`);
  csvRows.push(`"คะแนนรวมทั้งหมด","${totalScore} / ${totalMax} คะแนน"`);
  csvRows.push(`"เปอร์เซ็นต์เฉลี่ยรวม","${overallPct}%"`);
  csvRows.push(`"เกรดเฉลี่ยสะสม (เกรดเริ่มต้น)","${simulatedGrade}"`);

  // Create blob and download
  const csvString = csvRows.join("\n");
  // Add BOM for Excel UTF-8 support
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${studentName.replace(/\s+/g, "_")}_${classroomName.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
