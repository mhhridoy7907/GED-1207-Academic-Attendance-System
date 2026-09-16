/*
===== student portal js====
*/
import {
    initializeApp
}
from
"htt***********p.js";


import {
    getDatabase,
    ref,
    onValue,
    set
}
from
"https://www.gst***********base.js";


/* =====FIREBASE CONFIG==================== */

const firebaseConfig = {

    apiKey: "AI***********eAAIk",

    authDomain: "ge***********pp.com",

    databaseURL: "htt***********e.app",

    projectId: "g***********07",

    storageBucket:"ge***********e.app",

    messagingSenderId:  "72***********3",

    appId: "1:7***********b8",

    measurementId: "G-***********90"

};


const app =
    initializeApp(
        firebaseConfig
    );


const db =
    getDatabase(app);



const form =
    document.getElementById(
        "attendanceForm"
    );


const status =
    document.getElementById(
        "status"
    );


const submitBtn =
    document.getElementById(
        "submitBtn"
    );


const message =
    document.getElementById(
        "message"
    );



let settings = null;



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



function isActive(){

    if(!settings){

        return false;

    }


    return (

        settings.classActive === true &&

        Number(
            settings.autoOffAt || 0
        ) > Date.now()

    );

}


onValue(

    ref(
        db,
        "settings"
    ),

    snapshot => {

        settings =
            snapshot.val() || {};


        updateStatus();

    },

    error => {

        console.error(
            "Settings error:",
            error
        );


        status.textContent =
            "⚠ Firebase connection failed";


        status.className =
            "status closed";


        submitBtn.disabled =
            true;

    }

);



function updateStatus(){

    if(!settings){

        status.textContent =
            "⏳ Loading class...";

        status.className =
            "status";

        submitBtn.disabled =
            true;

        return;

    }


    if(!isActive()){

        status.textContent =
            "🔴 Class is currently CLOSED";

        status.className =
            "status closed";

        submitBtn.disabled =
            true;

        return;

    }


    const remaining =
        Number(
            settings.autoOffAt
        ) -
        Date.now();


    status.textContent =
        "🟢 Class is OPEN • " +
        formatRemaining(
            remaining
        );


    status.className =
        "status open";


    submitBtn.disabled =
        false;

}



setInterval(

    updateStatus,

    1000

);



function formatRemaining(ms){

    if(ms <= 0){

        return "Expired";

    }


    const totalSeconds =
        Math.floor(
            ms / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    return (

        hours + "h " +

        minutes + "m " +

        seconds + "s remaining"

    );

}



function showMessage(
    text,
    type = "error"
){

    message.textContent =
        text;


    if(type === "success"){

        message.style.color =
            "#4ade80";

    }

    else if(type === "info"){

        message.style.color =
            "#22d3ee";

    }

    else{

        message.style.color =
            "#f87171";

    }

}



form.addEventListener(

    "submit",

    async event => {

        event.preventDefault();



        if(!isActive()){

            showMessage(
                "Class is currently closed."
            );

            return;

        }



        const studentId =
            document
            .getElementById(
                "studentId"
            )
            .value
            .trim();


        const name =
            document
            .getElementById(
                "studentName"
            )
            .value
            .trim();


        const department =
            document
            .getElementById(
                "department"
            )
            .value;


        const level =
            document
            .getElementById(
                "level"
            )
            .value;


        const classCode =
            document
            .getElementById(
                "classCode"
            )
            .value
            .trim();



        if(
            !/^\d{16}$/.test(
                studentId
            )
        ){

            showMessage(
                "Student ID must be exactly 16 digits."
            );

            return;

        }


        if(
            name.length < 2
        ){

            showMessage(
                "Please enter a valid name."
            );

            return;

        }


        if(!department){

            showMessage(
                "Select department."
            );

            return;

        }


        if(!level){

            showMessage(
                "Select level."
            );

            return;

        }


        if(
            !/^\d{4}$/.test(
                classCode
            )
        ){

            showMessage(
                "Class code must be exactly 4 digits."
            );

            return;

        }



        if(
            String(
                settings.classCode
            ) !==
            classCode
        ){

            showMessage(
                "Incorrect class code."
            );

            return;

        }



        const date =
            getBDDate();



        const attendanceRef =
            ref(

                db,

                "attendance/" +
                studentId +
                "/" +
                date

            );



        submitBtn.disabled =
            true;

        submitBtn.textContent =
            "Checking...";


        showMessage(
            "Checking today's attendance...",
            "info"
        );


        try{
              await set(

                attendanceRef,

                {

                    studentId:
                        studentId,

                    name:
                        name,

                    department:
                        department,

                    level:
                        level,

                    classCode:
                        classCode,

                    present:
                        true,

                    date:
                        date,

                    timestamp:
                        Date.now()

                }

            );



            showMessage(

                "✓ Attendance submitted successfully.",

                "success"

            );


            form.reset();


        }

        catch(error){

            console.error(
                "Attendance error:",
                error
            );



            if( error.code === "PERMISSION_DENIED" || error.code === "permission_denied" ){

                showMessage(

                    "✓ Already Present Today",

                    "success"

                );

            }

            else{

                showMessage(

                    "Attendance submission failed. Please try again.",

                    "error"

                );

            }

        }

        finally{

            submitBtn.disabled =
                !isActive();

            submitBtn.textContent =
                "Submit Attendance";

        }

    }

);
