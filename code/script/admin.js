/*
======= admin script====
 */


/* =====================================================
   FIREBASE APP
===================================================== */

import {
    initializeApp
}
from
"https://w**************************pp.js";


import {
    getDatabase,
    ref,
    onValue,
    update
}
from
"https://ww************************atabase.js";


import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
}
from
"http************************se-auth.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIza************************mZgeAAIk",

    authDomain:
        "ged************************p.com",

    databaseURL:
        "http************************asedatabase.app",

    projectId:
        "************************7",

    storageBucket:
        "ge************************.app",

    messagingSenderId:
        "7************************433",

    appId:
        "1:************************4a0bb8",

    measurementId:
        "G-H************************T90"

};


const app =
    initializeApp(firebaseConfig);


const db =
    getDatabase(app);


const auth =
    getAuth(app);


/* =====================================================
   ONLY THIS UID IS ADMIN
===================================================== */

const ADMIN_UID =
    "uv************************j1";


/* =====================================================
   APPS SCRIPT
===================================================== */

const APPS_SCRIPT_URL =
"https://script.google.com*************oA/exec";


/* =====================================================
   VARIABLES
===================================================== */

let settings = {};

let attendance = {};

let databaseListenersStarted = false;


/* =====================================================
   ELEMENTS
===================================================== */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );


const adminApp =
    document.getElementById(
        "adminApp"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const loginEmail =
    document.getElementById(
        "loginEmail"
    );


const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


const table =
    document.getElementById(
        "attendanceTable"
    );


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        if(user){

            if(
                user.uid === ADMIN_UID
            ){

                loginScreen.style.display =
                    "none";

                adminApp.style.display =
                    "block";

                loginError.textContent =
                    "";

                startDatabaseListeners();

            }else{

                signOut(auth);

                loginScreen.style.display =
                    "flex";

                adminApp.style.display =
                    "none";

                loginError.textContent =
                    "This account is not authorized as Admin.";

            }

        }else{

            loginScreen.style.display =
                "flex";

            adminApp.style.display =
                "none";

        }

    }
);


/* =====================================================
   LOGIN
===================================================== */

loginButton.addEventListener(
    "click",
    async () => {

        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        loginError.textContent =
            "";


        if(!email){

            loginError.textContent =
                "Enter your admin email.";

            return;

        }


        if(!password){

            loginError.textContent =
                "Enter your password.";

            return;

        }


        loginButton.disabled =
            true;

        loginButton.textContent =
            "Logging in...";


        try{

            const result =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            if(
                result.user.uid !==
                ADMIN_UID
            ){

                await signOut(auth);

                throw new Error(
                    "NOT_ADMIN"
                );

            }


            loginPassword.value =
                "";

        }catch(error){

            console.error(error);


            if(
                error.message ===
                "NOT_ADMIN"
            ){

                loginError.textContent =
                    "This Firebase account is not the Admin account.";

            }else if(
                error.code ===
                "auth/invalid-credential"
            ){

                loginError.textContent =
                    "Incorrect email or password.";

            }else if(
                error.code ===
                "auth/user-not-found"
            ){

                loginError.textContent =
                    "Admin account was not found.";

            }else if(
                error.code ===
                "auth/wrong-password"
            ){

                loginError.textContent =
                    "Incorrect password.";

            }else{

                loginError.textContent =
                    error.message ||
                    "Login failed.";

            }

        }finally{

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Login to Admin";

        }

    }
);


/* =====================================================
   ENTER KEY LOGIN
===================================================== */

[
    loginEmail,
    loginPassword
]
.forEach(
    input => {

        input.addEventListener(
            "keydown",
            event => {

                if(
                    event.key ===
                    "Enter"
                ){

                    loginButton.click();

                }

            }
        );

    }
);


/* =====================================================
   LOGOUT
===================================================== */

document
.getElementById(
    "logoutButton"
)
.addEventListener(
    "click",
    async () => {

        await signOut(auth);

    }
);


/* =====================================================
   BANGLADESH DATE
===================================================== */

function getBDDate(){

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:"Asia/Dhaka",
            year:"numeric",
            month:"2-digit",
            day:"2-digit"
        }
    ).format(
        new Date()
    );

}


/* =====================================================
   DATABASE LISTENERS
===================================================== */

function startDatabaseListeners(){

    if(databaseListenersStarted){
        return;
    }

    databaseListenersStarted =
        true;


    /* SETTINGS */

    onValue(
        ref(
            db,
            "settings"
        ),
        snapshot => {

            settings =
                snapshot.val() || {};

            updateDashboard();

            renderTable();

        }
    );


    /* ATTENDANCE */

    onValue(
        ref(
            db,
            "attendance"
        ),
        snapshot => {

            attendance =
                snapshot.val() || {};

            updateDashboard();

            renderTable();

        }
    );

}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard(){

    const active =
        settings.classActive === true &&
        Number(
            settings.autoOffAt || 0
        ) > Date.now();


    const live =
        document.getElementById(
            "liveStatus"
        );


    if(active){

        live.textContent =
            "● CLASS OPEN";

        live.className =
            "live open";

    }else{

        live.textContent =
            "● CLASS CLOSED";

        live.className =
            "live closed";

    }


    document
    .getElementById(
        "totalClassDisplay"
    )
    .textContent =
        settings.totalClasses || 0;


    document
    .getElementById(
        "codeDisplay"
    )
    .textContent =
        settings.classCode || "----";


    let today = 0;


    const todayDate =
        getBDDate();


    Object.values(attendance)
    .forEach(
        dates => {

            if(!dates){
                return;
            }


            if(
                dates[todayDate]
            ){

                today++;

            }

        }
    );


    document
    .getElementById(
        "todayCount"
    )
    .textContent =
        today;


    document
    .getElementById(
        "studentCount"
    )
    .textContent =
        Object.keys(
            attendance
        ).length;


    const autoOff =
        Number(
            settings.autoOffAt || 0
        );


    let info =
        "Class is currently CLOSED.";


    if(active){

        info =
            "Class OPEN | Code: " +
            settings.classCode +
            " | Auto OFF: " +
            new Date(
                autoOff
            ).toLocaleString();

    }


    document
    .getElementById(
        "classInfo"
    )
    .textContent =
        info;

}


/* =====================================================
   SAVE SETTINGS
===================================================== */

document
.getElementById(
    "saveSettings"
)
.addEventListener(
    "click",
    async () => {

        const code =
            document
            .getElementById(
                "classCode"
            )
            .value
            .trim();


        const total =
            Number(
                document
                .getElementById(
                    "totalClasses"
                )
                .value
            );


        if(
            !/^\d{4}$/.test(code)
        ){

            showMessage(
                "Class code must be exactly 4 digits."
            );

            return;

        }


        if(
            !Number.isInteger(total) ||
            total < 1 ||
            total > 1000
        ){

            showMessage(
                "Total class must be between 1 and 1000."
            );

            return;

        }


        try{

            await update(
                ref(
                    db,
                    "settings"
                ),
                {

                    classCode:
                        code,

                    totalClasses:
                        total

                }
            );


            showMessage(
                "Settings saved successfully."
            );

        }catch(error){

            console.error(error);

            showMessage(
                "Could not save settings."
            );

        }

    }
);


/* =====================================================
   START CLASS
===================================================== */

document
.getElementById(
    "startClass"
)
.addEventListener(
    "click",
    async () => {

        const code =
            document
            .getElementById(
                "classCode"
            )
            .value
            .trim();


        const total =
            Number(
                document
                .getElementById(
                    "totalClasses"
                )
                .value
            );


        if(
            !/^\d{4}$/.test(code)
        ){

            showMessage(
                "Enter a 4 digit class code."
            );

            return;

        }


        if(
            !Number.isInteger(total) ||
            total < 1
        ){

            showMessage(
                "Enter total class first."
            );

            return;

        }


        const start =
            Date.now();


        const autoOff =
            start +
            (18 * 60 * 60 * 1000);


        try{

            await update(
                ref(
                    db,
                    "settings"
                ),
                {

                    classActive:
                        true,

                    classCode:
                        code,

                    totalClasses:
                        total,

                    presentStart:
                        start,

                    autoOffAt:
                        autoOff

                }
            );


            showMessage(
                "Class started. Auto OFF after 18 hours."
            );

        }catch(error){

            console.error(error);

            showMessage(
                "Could not start class."
            );

        }

    }
);


/* =====================================================
   OFF CLASS
===================================================== */

document
.getElementById(
    "offClass"
)
.addEventListener(
    "click",
    async () => {

        try{

            await update(
                ref(
                    db,
                    "settings"
                ),
                {
                    classActive:false
                }
            );


            showMessage(
                "Class turned OFF."
            );

        }catch(error){

            console.error(error);

            showMessage(
                "Could not turn class OFF."
            );

        }

    }
);


/* =====================================================
   FILTERS
===================================================== */

[
    "departmentFilter",
    "levelFilter",
    "dateFilter"
]
.forEach(
    id => {

        document
        .getElementById(id)
        .addEventListener(
            "change",
            renderTable
        );

    }
);


/* =====================================================
   CLEAR FILTER
===================================================== */

document
.getElementById(
    "clearFilter"
)
.addEventListener(
    "click",
    () => {

        document
        .getElementById(
            "departmentFilter"
        )
        .value =
            "ALL";


        document
        .getElementById(
            "levelFilter"
        )
        .value =
            "ALL";


        document
        .getElementById(
            "dateFilter"
        )
        .value =
            "";


        renderTable();

    }
);


/* =====================================================
   RENDER TABLE
===================================================== */

function renderTable(){

    table.innerHTML = "";


    const department =
        document
        .getElementById(
            "departmentFilter"
        )
        .value;


    const level =
        document
        .getElementById(
            "levelFilter"
        )
        .value;


    const date =
        document
        .getElementById(
            "dateFilter"
        )
        .value;


    const total =
        Number(
            settings.totalClasses || 0
        );


    const students = [];


    Object.entries(
        attendance
    )
    .forEach(
        ([studentId,dates]) => {

            if(!dates){
                return;
            }


            const records =
                Object.entries(dates)
                .filter(
                    ([recordDate,record]) => {

                        if(!record){
                            return false;
                        }


                        if(
                            date &&
                            recordDate !== date
                        ){

                            return false;

                        }


                        if(
                            department !== "ALL" &&
                            record.department !==
                            department
                        ){

                            return false;

                        }


                        if(
                            level !== "ALL" &&
                            record.level !==
                            level
                        ){

                            return false;

                        }


                        return true;

                    }
                );


            if(
                records.length === 0
            ){

                return;

            }


            const allRecords =
                Object.values(dates)
                .filter(
                    r =>
                        r &&
                        r.present === true
                );


            const present =
                allRecords.length;


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
                ? Math.min(
                    10,
                    (present / total) * 10
                )
                : 0;


            const latest =
                allRecords
                .slice()
                .sort(
                    (a,b) =>
                        String(b.date)
                        .localeCompare(
                            String(a.date)
                        )
                )[0];


            const safe =
                value =>
                    String(
                        value ?? ""
                    )
                    .replaceAll(
                        "&",
                        "&amp;"
                    )
                    .replaceAll(
                        "<",
                        "&lt;"
                    )
                    .replaceAll(
                        ">",
                        "&gt;"
                    )
                    .replaceAll(
                        '"',
                        "&quot;"
                    )
                    .replaceAll(
                        "'",
                        "&#039;"
                    );


            students.push({

                studentId,

                name:
                    latest?.name || "",

                department:
                    latest?.department || "",

                level:
                    latest?.level || "",

                present,

                total,

                absent,

                percentage:
                    percentage.toFixed(2),

                mark:
                    mark.toFixed(2),

                lastDate:
                    latest?.date || "",

                safe

            });

        }
    );


    students.sort(
        (a,b) =>
            a.studentId
            .localeCompare(
                b.studentId
            )
    );


    students.forEach(
        student => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${student.safe(
                        student.studentId
                    )}
                </td>

                <td>
                    ${student.safe(
                        student.name
                    )}
                </td>

                <td>
                    ${student.safe(
                        student.department
                    )}
                </td>

                <td>
                    ${student.safe(
                        student.level
                    )}
                </td>

                <td>
                    ${student.present}
                </td>

                <td>
                    ${student.total}
                </td>

                <td>
                    ${student.absent}
                </td>

                <td>
                    ${student.percentage}%
                </td>

                <td class="mark">
                    ${student.mark}/10
                </td>

                <td>
                    ${student.safe(
                        student.lastDate
                    )}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );


    if(
        students.length === 0
    ){

        table.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No attendance records found.
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   GOOGLE SHEETS SYNC
===================================================== */

document
.getElementById(
    "syncSheets"
)
.addEventListener(
    "click",
    async () => {

        if(
            APPS_SCRIPT_URL.includes(
                "PASTE_"
            )
        ){

            showMessage(
                "First add your Apps Script Web App URL."
            );

            return;

        }


        try{

            const response =
                await fetch(
                    APPS_SCRIPT_URL,
                    {

                        method:"POST",

                        headers:{
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify({

                                settings,
                                attendance,

                                syncedAt:
                                    new Date()
                                    .toISOString()

                            })

                    }
                );


            const result =
                await response.json();


            if(
                !result.success
            ){

                throw new Error(
                    result.message
                );

            }


            showMessage(
                "Google Sheets sync completed."
            );

        }catch(error){

            console.error(error);

            showMessage(
                "Google Sheets sync failed."
            );

        }

    }
);


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(text){

    document
    .getElementById(
        "message"
    )
    .textContent =
        text;

}


/* =====================================================
   AUTO REFRESH
===================================================== */

setInterval(
    () => {

        if(
            auth.currentUser &&
            auth.currentUser.uid ===
            ADMIN_UID
        ){

            updateDashboard();

        }

    },
    1000
);
