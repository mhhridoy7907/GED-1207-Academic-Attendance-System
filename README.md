# GED 1207 — Academic Attendance System

A web-based attendance management system developed to assist the **GED 1207 course teacher** in taking, managing, and monitoring student attendance more efficiently.

The system provides a simple student attendance portal along with an admin dashboard for classroom attendance management.

---

## 📚 Course Information

**Course Code:** GED 1207

**Course Title:** Academic Proficiency: Writing and Presentation Skills in English

**Course Teacher:** S.A.M. Thahmid

**Institution:** RTM Al-Kabir Technical University

---

## 🎯 Purpose of the Project

This system was developed as an academic utility to help the course teacher manage student attendance in a faster and more organized way.

Instead of manually maintaining attendance records, students can submit their attendance through the web portal using their:

* Student ID
* Name
* Department
* Level
* Class Code

The teacher can then monitor attendance records from the Admin Dashboard.

---

## ✨ Key Features

### 👨‍🎓 Student Portal

Students can:

* Enter their 16-digit Student ID
* Enter their name
* Select their department
* Select their academic level
* Enter the class code
* Submit attendance
* See whether the class is currently open or closed
* Receive real-time attendance submission feedback

---

### 👨‍🏫 Teacher/Admin Dashboard

The teacher can:

* Log in through Firebase Authentication
* Start an attendance session
* Set a class code
* Set the total number of classes
* Turn attendance OFF manually
* Monitor current class status
* View attendance records
* Filter attendance by department
* Filter attendance by level
* Filter attendance by date
* View present/absent statistics
* View attendance percentage
* View attendance marks out of 10
* Synchronize attendance data with Google Sheets

---

## ⏱️ Attendance Session

The teacher can start an attendance session from the Admin Dashboard.

When a session is started:

```text
Class Status → OPEN
       ↓
Class Code Active
       ↓
Students Submit Attendance
       ↓
Attendance Stored in Firebase
```

The system automatically expires the attendance session after **18 hours**, while the teacher can also turn the class OFF manually.

---

## 📊 Attendance Records

The system stores attendance records using the student's ID and attendance date.

Example:

```text
attendance
│
├── Student ID
│   └── 2026-09-16
│       ├── Student ID
│       ├── Name
│       ├── Department
│       ├── Level
│       ├── Class Code
│       ├── Present
│       ├── Date
│       └── Timestamp
```

This allows the teacher to review attendance history for individual students.

---

## 📈 Attendance Calculation

The Admin Dashboard provides automatic attendance calculations.

### Present

```text
Present = Number of recorded attendance sessions
```

### Absent

```text
Absent = Total Classes − Present
```

### Attendance Percentage

```text
Attendance % = (Present ÷ Total Classes) × 100
```

### Attendance Mark

```text
Mark = (Present ÷ Total Classes) × 10
```

Maximum:

```text
10 / 10
```

---

## 🔎 Filtering System

The teacher can quickly find specific attendance records using:

* Department
* Level
* Date

For example:

```text
Department → CSE
Level      → 1.1
Date       → 2026-09-16
```

This makes it easier to check attendance for a particular group or class date.

---

## 🔐 Admin Access

The Admin Dashboard uses **Firebase Email/Password Authentication**.

Only the configured administrator account is allowed to access the dashboard.

```text
Admin Login
     ↓
Firebase Authentication
     ↓
UID Verification
     ↓
Admin Dashboard
```

Students do not need access to the Admin Dashboard.

---

## 🔥 Firebase

The project uses:

* Firebase Authentication
* Firebase Realtime Database

Firebase is used for real-time communication between the student portal and the teacher's dashboard.

When attendance is submitted, the Admin Dashboard can receive the updated record without manually refreshing the page.

---

## 📑 Google Sheets Support

The Admin Dashboard includes Google Sheets synchronization through a Google Apps Script Web App.

```text
Student Portal
      ↓
Firebase Realtime Database
      ↓
Teacher/Admin Dashboard
      ↓
Google Apps Script
      ↓
Google Sheets
```

This can help the teacher maintain an additional spreadsheet-based attendance record.

---

## 🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript
* Firebase Authentication
* Firebase Realtime Database
* Google Apps Script
* Google Sheets

No frontend framework is required.

The project is built using standard HTML, CSS, and JavaScript.

---

## 📱 Responsive Interface

The system is designed to work on:

* Desktop
* Laptop
* Tablet
* Mobile phone

The student portal is optimized for quick attendance submission from a smartphone.

---

## 🏫 Academic Use

This project was created specifically as a practical solution for managing attendance for the **GED 1207 course**.

The main goal is to make attendance collection:

* Faster
* More organized
* Easier to monitor
* Easier to maintain
* Accessible through a web browser

---

## 🚀 Basic Workflow

### Teacher

```text
Admin Login
     ↓
Set Class Code
     ↓
Set Total Classes
     ↓
Start Attendance
     ↓
Monitor Attendance
     ↓
Turn Class OFF
```

### Student

```text
Open Student Portal
       ↓
Enter Student Information
       ↓
Enter Class Code
       ↓
Submit Attendance
       ↓
Attendance Saved
```

---

## 📌 Current Status

**Project Status: Active Academic Project**

### Implemented

* [x] Student Attendance Portal
* [x] Firebase Realtime Database
* [x] Firebase Admin Authentication
* [x] Admin Authorization
* [x] Class Code System
* [x] Class Start/Stop Control
* [x] 18-Hour Automatic Expiration
* [x] Student Attendance Records
* [x] Department Filtering
* [x] Level Filtering
* [x] Date Filtering
* [x] Attendance Statistics
* [x] Attendance Percentage
* [x] Attendance Mark / 10
* [x] Google Sheets Synchronization
* [x] Responsive UI

---

## 👨‍💻 Developer

**MH2 HRIDOY**

Developed as an academic project to assist the **GED 1207 course teacher** with classroom attendance management.

GitHub: `@mhhridoy7907`

---

## 📄 Note

This system is intended to support the course teacher's attendance management workflow. It is an academic utility project and can be further customized according to the requirements of the course and institution.
