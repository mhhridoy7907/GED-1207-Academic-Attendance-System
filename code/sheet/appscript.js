
const DEPARTMENTS = [
  "CSE",
  "EEE",
  "ENGLISH",
  "BDPH",
  "FASHION DESIGN",
  "BBA"
];

const HEADERS = [
  "Student ID",
  "Name",
  "Department",
  "Level",
  "Total Class",
  "Present",
  "Absent",
  "Attendance %",
  "Mark / 10",
  "Last Present Date",
  "Last Timestamp"
];

const PRESENT_COLOR = "#d9ead3";
const ABSENT_COLOR = "#f4cccc";
const HEADER_COLOR = "#163832";


function doGet() {
  return response({
    success: true,
    message: "Academic Attendance API is running."
  });
}


function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return response({
        success: false,
        message: "No data received."
      });
    }

    const data = JSON.parse(e.postData.contents);

    const settings = data.settings || {};
    const attendance = data.attendance || {};

    const total = Number(settings.totalClasses || 0);

    if (!Number.isInteger(total) || total < 1 || total > 1000) {
      return response({
        success: false,
        message: "Invalid total class."
      });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    const students = {};
    const dateSet = new Set();

    // Collect all attendance dates and students
    Object.entries(attendance).forEach(([studentId, dates]) => {
      if (!dates || typeof dates !== "object") return;

      const records = [];

      Object.entries(dates).forEach(([date, record]) => {
        if (!record) return;

        dateSet.add(date);

        if (record.present === true) {
          records.push({
            date: date,
            ...record
          });
        }
      });

      if (records.length === 0) return;

      records.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

      const latest = records[0];

      const present = Math.min(records.length, total);
      const absent = Math.max(0, total - present);

      students[studentId] = {
        studentId: studentId,
        name: latest.name || "",
        department: latest.department || "",
        level: latest.level || "",
        total: total,
        present: present,
        absent: absent,
        percentage: round((present / total) * 100),
        mark: round((present / total) * 10),
        lastDate: latest.date || "",
        lastTimestamp: latest.timestamp || ""
      };
    });

    // Sort dates chronologically
    const dates = Array.from(dateSet).sort();

    // Update department sheets
    DEPARTMENTS.forEach(department => {
      const sheet = getSheet(spreadsheet, department);

      sheet.clear();

      const headers = [...HEADERS, ...dates];

      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers]);

      const departmentStudents = Object.values(students)
        .filter(student => student.department === department)
        .sort((a, b) =>
          String(a.studentId).localeCompare(String(b.studentId))
        );

      const rows = [];
      const backgrounds = [];
      const fontColors = [];

      departmentStudents.forEach(student => {
        const studentDates = attendance[student.studentId] || {};

        const statuses = dates.map(date => {
          const record = studentDates[date];

          return record && record.present === true ? "P" : "A";
        });

        rows.push([
          student.studentId,
          student.name,
          student.department,
          student.level,
          student.total,
          student.present,
          student.absent,
          student.percentage,
          student.mark,
          student.lastDate,
          student.lastTimestamp,
          ...statuses
        ]);

        backgrounds.push(
          statuses.map(status =>
            status === "P" ? PRESENT_COLOR : ABSENT_COLOR
          )
        );

        fontColors.push(
          statuses.map(status =>
            status === "P" ? "#38761d" : "#990000"
          )
        );
      });

      // Write student data
      if (rows.length > 0) {
        sheet.getRange(
          2,
          1,
          rows.length,
          headers.length
        ).setValues(rows);

        // Format attendance cells
        if (dates.length > 0) {
          const attendanceRange = sheet.getRange(
            2,
            HEADERS.length + 1,
            rows.length,
            dates.length
          );

          attendanceRange
            .setBackgrounds(backgrounds)
            .setFontColors(fontColors)
            .setFontWeight("bold")
            .setHorizontalAlignment("center");
        }
      }

      // Header formatting
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground(HEADER_COLOR)
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");

      sheet.setFrozenRows(1);
      sheet.setFrozenColumns(3);

      sheet.autoResizeColumns(1, headers.length);

      // Attendance date columns width
      if (dates.length > 0) {
        sheet.setColumnWidths(
          HEADERS.length + 1,
          dates.length,
          75
        );
      }

      // Center attendance summary values
      if (rows.length > 0) {
        sheet.getRange(
          2,
          5,
          rows.length,
          5
        ).setHorizontalAlignment("center");
      }
    });

    // Update SUMMARY sheet
    const summary = getSheet(spreadsheet, "SUMMARY");

    summary.clear();

    const summaryHeaders = [
      "Department",
      "Students",
      "Total Class",
      "Last Sync"
    ];

    summary.getRange(1, 1, 1, 4)
      .setValues([summaryHeaders]);

    const summaryRows = DEPARTMENTS.map(department => {
      const count = Object.values(students)
        .filter(student => student.department === department)
        .length;

      return [
        department,
        count,
        total,
        new Date()
      ];
    });

    summary.getRange(
      2,
      1,
      summaryRows.length,
      4
    ).setValues(summaryRows);

    summary.getRange(1, 1, 1, 4)
      .setBackground(HEADER_COLOR)
      .setFontColor("#ffffff")
      .setFontWeight("bold");

    summary.setFrozenRows(1);
    summary.autoResizeColumns(1, 4);

    return response({
      success: true,
      message: "Google Sheets updated successfully.",
      students: Object.keys(students).length,
      dates: dates.length,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(error);

    return response({
      success: false,
      message: error.message || String(error)
    });

  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}


// Get or create sheet
function getSheet(spreadsheet, name) {
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  return sheet;
}


// Round numbers
function round(value) {
  return Math.round(Number(value) * 100) / 100;
}


// JSON response
function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
