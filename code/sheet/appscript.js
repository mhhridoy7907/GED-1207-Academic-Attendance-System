
const DEPARTMENTS = [
  "CSE",
  "EEE",
  "ENGLISH",
  "BDPH",
  "FASHION DESIGN",
  "BBA"
];

const LEVELS = [
  "1.1", "1.2",
  "2.1", "2.2",
  "3.1", "3.2",
  "4.1", "4.2"
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
  "Last Present Date"
];

const PRESENT_COLOR = "#d9ead3";
const ABSENT_COLOR = "#f4cccc";
const HEADER_COLOR = "#163832";
const HEADER_TEXT_COLOR = "#ffffff";
const ALTERNATE_COLOR = "#f3f7f5";
const LEVEL_COLOR = "#dce9e4";


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

    // COLLECT ATTENDANCE

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
        lastDate: latest.date || ""
      };

    });

    const dates = Array.from(dateSet).sort();

    // DEPARTMENT SHEETS

    DEPARTMENTS.forEach(department => {

      const sheet = getSheet(spreadsheet, department);

      sheet.clear();

      const headers = [...HEADERS, ...dates];
      const totalColumns = headers.length;

      sheet.getRange(1, 1, 1, totalColumns)
        .setValues([headers]);

      // SORT BY LEVEL AND STUDENT ID

      const departmentStudents = Object.values(students)
        .filter(student => student.department === department)
        .sort((a, b) => {

          const levelA = LEVELS.indexOf(a.level);
          const levelB = LEVELS.indexOf(b.level);

          const orderA = levelA === -1 ? 999 : levelA;
          const orderB = levelB === -1 ? 999 : levelB;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          const idA = BigInt(a.studentId);
          const idB = BigInt(b.studentId);

          return idA < idB ? -1 : idA > idB ? 1 : 0;

        });

      const outputRows = [];

      const rowTypes = [];

      let currentLevel = null;

      // GENERATE LEVEL SECTIONS

      departmentStudents.forEach(student => {

        if (student.level !== currentLevel) {

          // GAP ROW BETWEEN LEVELS

          if (currentLevel !== null) {

            outputRows.push(
              Array(totalColumns).fill("")
            );

            rowTypes.push("GAP");

          }

          // LEVEL HEADER ROW

          const levelHeader = Array(totalColumns).fill("");

          levelHeader[0] = "LEVEL " + student.level;

          outputRows.push(levelHeader);

          rowTypes.push("LEVEL");

          currentLevel = student.level;

        }

        const studentDates = attendance[student.studentId] || {};

        const statuses = dates.map(date => {

          const record = studentDates[date];

          return record && record.present === true ? "P" : "A";

        });

        outputRows.push([
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
          ...statuses
        ]);

        rowTypes.push("STUDENT");

      });

      // WRITE DATA

      if (outputRows.length > 0) {

        sheet.getRange(
          2,
          1,
          outputRows.length,
          totalColumns
        ).setValues(outputRows);

        outputRows.forEach((row, index) => {

          const rowNumber = index + 2;
          const type = rowTypes[index];

          if (type === "LEVEL") {

            sheet.getRange(
              rowNumber,
              1,
              1,
              totalColumns
            )
            .setBackground(LEVEL_COLOR)
            .setFontColor(HEADER_COLOR)
            .setFontWeight("bold")
            .setFontSize(11)
            .setVerticalAlignment("middle");

            sheet.getRange(rowNumber, 1)
              .setHorizontalAlignment("left");

            sheet.setRowHeight(rowNumber, 30);

          }

          else if (type === "GAP") {

            sheet.getRange(
              rowNumber,
              1,
              1,
              totalColumns
            ).setBackground("#ffffff");

            sheet.setRowHeight(rowNumber, 10);

          }

          else {

            const mainRange = sheet.getRange(
              rowNumber,
              1,
              1,
              HEADERS.length
            );

            mainRange.setBackground(
              index % 2 === 0
                ? "#ffffff"
                : ALTERNATE_COLOR
            );

            mainRange.setVerticalAlignment("middle");

            sheet.getRange(rowNumber, 5, 1, 5)
              .setHorizontalAlignment("center");

            sheet.getRange(rowNumber, 8, 1, 2)
              .setNumberFormat("0.00");

            if (dates.length > 0) {

              const attendanceRange = sheet.getRange(
                rowNumber,
                HEADERS.length + 1,
                1,
                dates.length
              );

              const backgrounds = statusesForRow(
                attendance,
                row[0],
                dates
              ).map(status =>
                status === "P" ? PRESENT_COLOR : ABSENT_COLOR
              );

              const fontColors = statusesForRow(
                attendance,
                row[0],
                dates
              ).map(status =>
                status === "P" ? "#38761d" : "#990000"
              );

              attendanceRange
                .setBackgrounds([backgrounds])
                .setFontColors([fontColors])
                .setFontWeight("bold")
                .setHorizontalAlignment("center");

            }

          }

        });

      }

      // MAIN HEADER DESIGN

      sheet.getRange(1, 1, 1, totalColumns)
        .setBackground(HEADER_COLOR)
        .setFontColor(HEADER_TEXT_COLOR)
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true);

      sheet.setRowHeight(1, 40);

      // COLUMN SETTINGS

      sheet.setFrozenRows(1);
      sheet.setFrozenColumns(3);

      sheet.setColumnWidth(1, 165);
      sheet.setColumnWidth(2, 180);
      sheet.setColumnWidth(3, 140);
      sheet.setColumnWidth(4, 85);

      sheet.setColumnWidths(5, 5, 105);

      sheet.setColumnWidth(10, 140);

      if (dates.length > 0) {
        sheet.setColumnWidths(
          HEADERS.length + 1,
          dates.length,
          75
        );
      }

      sheet.autoResizeRows(2, Math.max(outputRows.length, 1));

      // FILTER

      if (sheet.getFilter()) {
        sheet.getFilter().remove();
      }

      sheet.getRange(
        1,
        1,
        Math.max(outputRows.length + 1, 1),
        totalColumns
      ).createFilter();

      sheet.setTabColor(HEADER_COLOR);

    });

    // SUMMARY SHEET

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
      .setFontColor(HEADER_TEXT_COLOR)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true);

    summary.getRange(2, 1, summaryRows.length, 4)
      .setVerticalAlignment("middle");

    summary.getRange(2, 2, summaryRows.length, 2)
      .setHorizontalAlignment("center");

    summary.getRange(2, 4, summaryRows.length, 1)
      .setNumberFormat("dd MMM yyyy, hh:mm:ss");

    summary.setRowHeight(1, 40);

    summary.setFrozenRows(1);

    summary.setColumnWidth(1, 180);
    summary.setColumnWidth(2, 110);
    summary.setColumnWidth(3, 120);
    summary.setColumnWidth(4, 200);

    summary.setTabColor("#0b8043");

    return response({
      success: true,
      message: "Google Sheets updated successfully.",
      students: Object.keys(students).length,
      dates: dates.length,
      sorting: "Level ASC, Student ID ASC",
      levelSections: true,
      syncedAt: new Date().toISOString()
    });

  }

  catch (error) {

    console.error(error);

    return response({
      success: false,
      message: error.message || String(error)
    });

  }

  finally {

    if (lock.hasLock()) {
      lock.releaseLock();
    }

  }

}


// ATTENDANCE STATUS

function statusesForRow(attendance, studentId, dates) {

  const studentDates = attendance[studentId] || {};

  return dates.map(date => {

    const record = studentDates[date];

    return record && record.present === true ? "P" : "A";

  });

}


// GET OR CREATE SHEET

function getSheet(spreadsheet, name) {

  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  return sheet;

}


// ROUND NUMBERS

function round(value) {

  return Math.round(Number(value) * 100) / 100;

}


// JSON RESPONSE

function response(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

}
