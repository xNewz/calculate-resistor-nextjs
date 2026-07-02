export function downloadGradebookCsv(
  classroomName: string,
  enrollments: any[],
  assignments: any[],
  submissions: any[]
) {
  // 1. Create headers
  const headers = ["ชื่อผู้เรียน", "อีเมล"];
  assignments.forEach((asg) => {
    headers.push(`${asg.title} (Max ${asg.questionCount})`);
  });
  
  const csvRows = [];
  csvRows.push(headers.join(","));

  // 2. Create rows
  enrollments.forEach((enr) => {
    const row = [
      `"${enr.user.name}"`, // Quote strings in case they have commas
      `"${enr.user.email}"`,
    ];

    assignments.forEach((asg) => {
      const sub = submissions.find(
        (s) => s.assignmentId === asg.id && s.studentId === enr.userId
      );
      if (sub) {
        row.push(sub.score.toString());
      } else {
        row.push("-");
      }
    });

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
