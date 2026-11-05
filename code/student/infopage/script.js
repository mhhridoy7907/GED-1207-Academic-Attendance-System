    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
    import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

    const firebaseConfig = {
      apiKey: "AIz*********************V-4Cnc",
      authDomain: "stu*********************seapp.com",
      databaseURL: "http*********************tabase.app",
      projectId: "stu*********************207",
      storageBucket: "stude*********************ge.app",
      messagingSenderId: "6*********************0823",
      appId: "1:647*********************60db9ed2",
      measurementId: "G-*********************ZY11"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const form = document.getElementById("lookupForm");
    const input = document.getElementById("studentId");
    const button = document.getElementById("checkBtn");
    const message = document.getElementById("message");
    const results = document.getElementById("results");
    const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 16);
    });

    function setMessage(text, type = "") {
      message.textContent = text;
      message.className = type;
    }

    function formatDate(dateKey) {
      const match = DATE_KEY.exec(dateKey);
      if (!match) return dateKey;
      const [y, m, d] = dateKey.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
      });
    }

    function collectClassDates(allAttendance, myRecords) {
      const dates = new Set();
      for (const studentRecords of Object.values(allAttendance || {})) {
        if (!studentRecords || typeof studentRecords !== "object") continue;
        for (const [dateKey, rec] of Object.entries(studentRecords)) {
          if (DATE_KEY.test(dateKey) && rec && typeof rec === "object" && rec.present === true) {
            dates.add(dateKey);
          }
        }
      }
      for (const dateKey of Object.keys(myRecords || {})) {
        if (DATE_KEY.test(dateKey)) dates.add(dateKey);
      }
      return [...dates].sort();           // oldest -> newest
    }

    function showRecord(id, myRecords, allAttendance) {
      const classDates = collectClassDates(allAttendance, myRecords);

      const history = classDates.map(date => {
        const rec = myRecords[date];
        const present = !!(rec && typeof rec === "object" && rec.present === true);
        return { date, present };
      });

      const presentCount = history.filter(h => h.present).length;
      const absentCount = history.length - presentCount;

      // Latest profile info from this student's own records
      const myEntries = Object.entries(myRecords)
        .filter(([k, r]) => r && typeof r === "object")
        .sort((a, b) => a[0].localeCompare(b[0]));
      const latest = [...myEntries].reverse().find(([k, r]) => r.name);
      const info = latest ? latest[1] : null;

      document.getElementById("studentName").textContent = (info && info.name) || "Name not available";
      document.getElementById("resultId").textContent = "STUDENT ID: " + id;
      document.getElementById("department").textContent = (info && info.department) || "Not available";
      document.getElementById("level").textContent = (info && info.level) || "Not available";
      document.getElementById("totalClasses").textContent = String(history.length);
      document.getElementById("totalPresent").textContent = String(presentCount);
      document.getElementById("totalAbsent").textContent = String(absentCount);
      document.getElementById("presentRate").textContent =
        (history.length ? Math.round((presentCount / history.length) * 100) : 0) + "%";
      document.getElementById("historyCount").textContent = history.length + " class days";

      const tbody = document.getElementById("historyBody");
      tbody.replaceChildren();

      if (!history.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.className = "empty";
        td.textContent = "No attendance history found.";
        tr.appendChild(td);
        tbody.appendChild(tr);
      } else {
        // newest first
        [...history].reverse().forEach((item, index) => {
          const tr = document.createElement("tr");
          if (!item.present) tr.className = "row-absent";
          const number = document.createElement("td");
          const date = document.createElement("td");
          const status = document.createElement("td");
          const badge = document.createElement("span");
          number.textContent = String(index + 1);
          date.textContent = formatDate(item.date);
          badge.className = "badge " + (item.present ? "present" : "absent");
          badge.textContent = item.present ? "Present" : "Absent";
          status.appendChild(badge);
          tr.append(number, date, status);
          tbody.appendChild(tr);
        });
      }
      results.style.display = "block";
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const id = input.value.trim();
      results.style.display = "none";

      if (!/^\d{16}$/.test(id)) {
        setMessage("Please enter a valid 16-digit Student ID.", "error");
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = "Checking...";
      setMessage("Loading attendance from Firebase. Please wait...");

      try {
        const snapshot = await get(ref(db, "attendance"));
        if (!snapshot.exists()) {
          setMessage("No attendance data found yet.", "error");
          return;
        }
        const all = snapshot.val();
        const mine = all && all[id];
        if (!mine || typeof mine !== "object") {
          setMessage("No attendance record was found for this Student ID.", "error");
          return;
        }
        showRecord(id, mine, all);
        setMessage("Attendance information loaded successfully.", "success");
      } catch (error) {
        console.error("Attendance lookup failed:", error);
        if (error && (error.code === "PERMISSION_DENIED" || error.code === "permission_denied")) {
          setMessage("Firebase denied access. Check that public read access is enabled for attendance in your Realtime Database Rules.", "error");
        } else {
          setMessage("Could not connect to Firebase. Check your internet connection and database configuration, then try again.", "error");
        }
      } finally {
        button.disabled = false;
        button.textContent = "Check Attendance";
      }
    });
