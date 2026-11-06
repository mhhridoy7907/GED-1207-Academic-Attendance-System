        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
        import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

        const firebaseConfig = {
            apiKey: "A*************************4Cnc",
            authDomain: "stud*********************app.com",
            databaseURL: "https://s*********************basedatabase.app",
            projectId: "stu*********************207",
            storageBucket: "studen*********************rage.app",
            messagingSenderId: "64*********************23",
            appId: "1:6479*********************e27060db9ed2",
            measurementId: "G-9*********************ZY11"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);

        const form = document.getElementById("attendanceForm");
        const status = document.getElementById("status");
        const submitBtn = document.getElementById("submitBtn");
        const message = document.getElementById("message");
        const studentName = document.getElementById("studentName");
        const department = document.getElementById("department");
        const level = document.getElementById("level");
        const studentId = document.getElementById("studentId");
        const classCode = document.getElementById("classCode");
        const idStatus = document.getElementById("idStatus");

        let settings = null;
        let searchTimer = null;
        let searchNumber = 0;

        function getBDDate() {
            return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        }

        function isActive() {
            if (!settings) return false;
            return settings.classActive === true && Number(settings.autoOffAt || 0) > Date.now();
        }

        onValue(ref(db, "settings"),
            snapshot => {
                settings = snapshot.val() || {};
                updateStatus();
            },
            error => {
                console.error("Settings error:", error);
                status.textContent = "⚠ Firebase connection failed";
                status.className = "status closed";
                submitBtn.disabled = true;
            }
        );

        function updateStatus() {
            if (!settings) {
                status.textContent = "⏳ Loading class...";
                status.className = "status";
                submitBtn.disabled = true;
                return;
            }
            if (!isActive()) {
                status.textContent = "🔴 Class is currently CLOSED";
                status.className = "status closed";
                submitBtn.disabled = true;
                return;
            }
            const remaining = Number(settings.autoOffAt) - Date.now();
            status.textContent = "🟢 Class is OPEN • " + formatRemaining(remaining);
            status.className = "status open";
            updateSubmitButton();
        }

        function formatRemaining(ms) {
            if (ms <= 0) return "Expired";
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return hours + "h " + minutes + "m " + seconds + "s remaining";
        }

        function showMessage(text, type = "error") {
            message.textContent = text;
            message.style.animation = "none";
            void message.offsetWidth;
            message.style.animation = "messageIn .3s ease";
            if (type === "success") message.style.color = "#4ade80";
            else if (type === "info") message.style.color = "#22d3ee";
            else message.style.color = "#f87171";
        }

        function normalizeName(name) {
            return name.trim().replace(/\s+/g, " ").toLowerCase();
        }

        function createStudentKey(name, dept, levelValue) {
            const raw = normalizeName(name) + "|" + dept.trim().toUpperCase() + "|" + levelValue.trim();
            const bytes = new TextEncoder().encode(raw);
            let hex = "";
            for (const byte of bytes) {
                hex += byte.toString(16).padStart(2, "0");
            }
            return hex;
        }

        function validStudentId(id) {
            return /^\d{16}$/.test(String(id).trim());
        }

        async function searchStudentIndex(name, dept, levelValue) {
            const key = createStudentKey(name, dept, levelValue);
            const snapshot = await get(ref(db, "studentIndex/" + key));
            if (!snapshot.exists()) return null;
            const id = String(snapshot.val()).trim();
            if (!validStudentId(id)) return null;
            return id;
        }

        async function findExistingAttendanceID(name, dept, levelValue) {
            const attendanceSnapshot = await get(ref(db, "attendance"));
            if (!attendanceSnapshot.exists()) return null;
            const attendanceData = attendanceSnapshot.val();
            const targetName = normalizeName(name);
            const targetDept = dept.trim().toUpperCase();
            const targetLevel = levelValue.trim();

            for (const [id, dates] of Object.entries(attendanceData)) {
                if (!validStudentId(id)) continue;
                if (!dates) continue;
                for (const record of Object.values(dates)) {
                    if (!record) continue;
                    const recordName = normalizeName(record.name || "");
                    const recordDept = String(record.department || "").trim().toUpperCase();
                    const recordLevel = String(record.level || "").trim();
                    if (recordName === targetName && recordDept === targetDept && recordLevel === targetLevel) {
                        return id;
                    }
                }
            }
            return null;
        }

        async function saveStudentIndex(name, dept, levelValue, id) {
            if (!validStudentId(id)) return false;
            const key = createStudentKey(name, dept, levelValue);
            const indexRef = ref(db, "studentIndex/" + key);
            const existing = await get(indexRef);
            if (existing.exists()) {
                const existingId = String(existing.val()).trim();
                return existingId === id;
            }
            await set(indexRef, id);
            return true;
        }

        async function findStudentID() {
            const name = studentName.value.trim();
            const dept = department.value;
            const levelValue = level.value;

            if (name.length < 2 || !dept || !levelValue) {
                studentId.value = "";
                idStatus.textContent = "Enter name, department and level first.";
                idStatus.className = "id-status";
                studentId.classList.remove("id-found");
                updateSubmitButton();
                return;
            }

            if (searchTimer) clearTimeout(searchTimer);
            const currentSearch = ++searchNumber;
            searchTimer = setTimeout(async () => {
                await searchStudent(name, dept, levelValue, currentSearch);
            }, 350);
        }

        async function searchStudent(name, dept, levelValue, currentSearch) {
            idStatus.textContent = "🔎 Searching Student ID...";
            idStatus.className = "id-status searching";
            studentId.classList.remove("id-found");

            try {
                let foundId = await searchStudentIndex(name, dept, levelValue);
                if (currentSearch !== searchNumber) return;

                if (!foundId) {
                    foundId = await findExistingAttendanceID(name, dept, levelValue);
                }
                if (currentSearch !== searchNumber) return;

                if (foundId) {
                    studentId.value = foundId;
                    studentId.classList.add("id-found");
                    try {
                        await saveStudentIndex(name, dept, levelValue, foundId);
                    } catch (saveError) {
                        console.error("Index save error:", saveError);
                    }
                    idStatus.textContent = "✓ Student ID found automatically and saved.";
                    idStatus.className = "id-status found";
                    updateSubmitButton();
                    return;
                }

                studentId.value = "";
                studentId.classList.remove("id-found");
                idStatus.textContent = "⚠ ID not found. Enter your 16 digit Student ID manually. It will be saved for next time.";
                idStatus.className = "id-status manual";
                updateSubmitButton();
            } catch (error) {
                console.error("Student search error:", error);
                idStatus.textContent = "⚠ Could not search automatically. Enter your 16 digit Student ID manually.";
                idStatus.className = "id-status error";
                updateSubmitButton();
            }
        }

        studentName.addEventListener("input", () => {
            studentId.classList.remove("id-found");
            findStudentID();
            updateSubmitButton();
        });
        department.addEventListener("change", () => {
            studentId.classList.remove("id-found");
            findStudentID();
            updateSubmitButton();
        });
        level.addEventListener("change", () => {
            studentId.classList.remove("id-found");
            findStudentID();
            updateSubmitButton();
        });
        studentId.addEventListener("input", () => {
            studentId.value = studentId.value.replace(/\D/g, "").slice(0, 16);
            if (studentId.value.length !== 16) studentId.classList.remove("id-found");
            updateSubmitButton();
        });
        classCode.addEventListener("input", () => {
            classCode.value = classCode.value.replace(/\D/g, "").slice(0, 4);
            updateSubmitButton();
        });

        function isFormReady() {
            return (
                isActive() &&
                studentName.value.trim().length >= 2 &&
                department.value !== "" &&
                level.value !== "" &&
                validStudentId(studentId.value.trim()) &&
                /^\d{4}$/.test(classCode.value.trim())
            );
        }

        function updateSubmitButton() {
            submitBtn.disabled = !isFormReady();
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();

            if (!isActive()) {
                showMessage("Class is currently closed.");
                return;
            }

            const name = studentName.value.trim();
            const dept = department.value;
            const levelValue = level.value;
            const id = studentId.value.trim();
            const code = classCode.value.trim();

            if (name.length < 2) { showMessage("Please enter a valid name."); studentName.focus(); return; }
            if (!dept) { showMessage("Select department."); department.focus(); return; }
            if (!levelValue) { showMessage("Select level."); level.focus(); return; }
            if (!validStudentId(id)) { showMessage("Student ID must be exactly 16 digits."); studentId.focus(); return; }
            if (!/^\d{4}$/.test(code)) { showMessage("Class code must be exactly 4 digits."); classCode.focus(); return; }
            if (String(settings.classCode) !== code) { showMessage("Incorrect class code."); return; }

            const date = getBDDate();
            const attendanceRef = ref(db, "attendance/" + id + "/" + date);

            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";
            showMessage("Submitting attendance...", "info");

            try {
                const existingAttendance = await get(attendanceRef);
                if (existingAttendance.exists()) {
                    showMessage("✓ Attendance already submitted for today.");
                    return;
                }

                const indexSaved = await saveStudentIndex(name, dept, levelValue, id);
                if (!indexSaved) {
                    showMessage("This Name + Department + Level is already linked to another Student ID.");
                    return;
                }

                if (!isActive()) {
                    showMessage("Class is no longer active.");
                    return;
                }

                await set(attendanceRef, {
                    studentId: id,
                    name: name,
                    department: dept,
                    level: levelValue,
                    classCode: code,
                    present: true,
                    date: date,
                    timestamp: Date.now()
                });

                showMessage("✓ Attendance submitted successfully.", "success");
                form.reset();
                studentId.classList.remove("id-found");
                idStatus.textContent = "Enter name, department and level first.";
                idStatus.className = "id-status";
            } catch (error) {
                console.error("Attendance error:", error);
                if (error.code === "PERMISSION_DENIED" || error.code === "permission_denied") {
                    showMessage("Attendance was not accepted. The class may be closed, the class code may be incorrect, or attendance may already exist.");
                } else {
                    showMessage("Attendance submission failed. Please try again.");
                }
            } finally {
                submitBtn.textContent = "Submit Attendance";
                submitBtn.disabled = !isFormReady();
            }
        });

        setInterval(() => { updateStatus(); }, 1000);
        updateSubmitButton();

        /* ==================================================
           Developed by: MH2 HRIDOY
           Contact: 01962-388 570
           Email: mhhridoy7907@gmail.com
           GitHub: @mhhridoy7907
           ================================================== */
