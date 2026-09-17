
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


/* =====================================================
   GET
===================================================== */

function doGet() {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        success: true,
        message: "Academic Attendance API is running."
      })
    )
    .setMimeType(ContentService.MimeType.JSON);

}


/* =====================================================
   POST
===================================================== */

function doPost(e) {

  try {

    if (
      !e ||
      !e.postData ||
      !e.postData.contents
    ) {

      return response({
        success: false,
        message: "No data received."
      });

    }


    const data =
      JSON.parse(
        e.postData.contents
      );


    const settings =
      data.settings || {};

    const attendance =
      data.attendance || {};


    const total =
      Number(
        settings.totalClasses || 0
      );


    if (
      !Number.isInteger(total) ||
      total < 1
    ) {

      return response({
        success: false,
        message: "Invalid total class."
      });

    }


    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();


    const students = {};


    /* =================================================
       CREATE STUDENT SUMMARY
    ================================================= */

    Object.entries(attendance)
      .forEach(
        ([studentId, dates]) => {

          if (!dates) {
            return;
          }


          const records =
            Object.entries(dates)
              .map(
                ([date, record]) => {

                  if (
                    !record ||
                    record.present !== true
                  ) {
                    return null;
                  }


                  return {
                    date,
                    ...record
                  };

                }
              )
              .filter(Boolean);


          if (
            records.length === 0
          ) {
            return;
          }


          records.sort(
            (a, b) =>
              String(b.date)
                .localeCompare(
                  String(a.date)
                )
          );


          const latest =
            records[0];


          /* IMPORTANT:
             Present can never exceed total class
          */

          const present =
            Math.min(
              records.length,
              total
            );


          const absent =
            Math.max(
              0,
              total - present
            );


          const percentage =
            total > 0
              ? (present / total) * 100
              : 0;


          const mark =
            total > 0
              ? (present / total) * 10
              : 0;


          students[studentId] = {

            studentId,

            name:
              latest.name || "",

            department:
              latest.department || "",

            level:
              latest.level || "",

            total,

            present,

            absent,

            percentage:
              round(
                Math.min(
                  100,
                  percentage
                )
              ),

            mark:
              round(
                Math.min(
                  10,
                  mark
                )
              ),

            lastDate:
              latest.date || "",

            lastTimestamp:
              latest.timestamp || ""

          };

        }
      );


    /* =================================================
       DEPARTMENT SHEETS
    ================================================= */

    DEPARTMENTS.forEach(
      department => {

        const sheet =
          getSheet(
            spreadsheet,
            department
          );


        sheet.clearContents();


        sheet
          .getRange(
            1,
            1,
            1,
            HEADERS.length
          )
          .setValues([
            HEADERS
          ]);


        const rows = [];


        Object.values(students)

          .filter(
            student =>
              student.department ===
              department
          )

          .sort(
            (a, b) =>
              String(a.studentId)
                .localeCompare(
                  String(b.studentId)
                )
          )

          .forEach(
            student => {

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

                student.lastTimestamp

              ]);

            }
          );


        if (rows.length) {

          sheet
            .getRange(
              2,
              1,
              rows.length,
              HEADERS.length
            )
            .setValues(rows);

        }


        sheet.setFrozenRows(1);


        sheet
          .getRange(
            1,
            1,
            1,
            HEADERS.length
          )
          .setFontWeight("bold");


        sheet.autoResizeColumns(
          1,
          HEADERS.length
        );

      }
    );


    /* =================================================
       SUMMARY SHEET
    ================================================= */

    const summary =
      getSheet(
        spreadsheet,
        "SUMMARY"
      );


    summary.clearContents();


    summary
      .getRange(1, 1, 1, 4)
      .setValues([[
        "Department",
        "Students",
        "Total Class",
        "Last Sync"
      ]]);


    const summaryRows = [];


    DEPARTMENTS.forEach(
      department => {

        const count =
          Object.values(students)
            .filter(
              student =>
                student.department ===
                department
            )
            .length;


        summaryRows.push([

          department,

          count,

          total,

          new Date()

        ]);

      }
    );


    summary
      .getRange(
        2,
        1,
        summaryRows.length,
        4
      )
      .setValues(
        summaryRows
      );


    summary.setFrozenRows(1);


    summary
      .getRange(1, 1, 1, 4)
      .setFontWeight("bold");


    summary.autoResizeColumns(
      1,
      4
    );


    /* =================================================
       RESPONSE
    ================================================= */

    return response({

      success: true,

      message:
        "Google Sheets updated successfully.",

      students:
        Object.keys(
          students
        ).length,

      syncedAt:
        new Date().toISOString()

    });


  } catch (error) {

    console.error(error);


    return response({

      success: false,

      message:
        error.message ||
        String(error)

    });

  }

}


/* =====================================================
   GET / CREATE SHEET
===================================================== */

function getSheet(
  spreadsheet,
  name
) {

  let sheet =
    spreadsheet.getSheetByName(
      name
    );


  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        name
      );

  }


  return sheet;

}


/* =====================================================
   ROUND
===================================================== */

function round(value) {

  return Math.round(
    Number(value) * 100
  ) / 100;

}


/* =====================================================
   JSON RESPONSE
===================================================== */

function response(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}