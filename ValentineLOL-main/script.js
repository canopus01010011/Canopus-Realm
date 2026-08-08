
const yesBtn = document.getElementById("YesB");
const noBtn = document.getElementById("NoB");

const plannerOverlay =
    document.getElementById("plannerOverlay");

const plannerSkip =
    document.getElementById("plannerSkip");

const plannerNext =
    document.getElementById("plannerNext");

const plannerBack =
    document.getElementById("plannerBack");

const plannerStatus =
    document.getElementById("plannerStatus");

const plannerProgressBar =
    document.getElementById("plannerProgressBar");

const plannerStepLabel =
    document.getElementById("plannerStepLabel");

const plannerPercent =
    document.getElementById("plannerPercent");

const planPreview =
    document.getElementById("planPreview");

const music =
    document.getElementById("bgMusic");

const hearts =
    document.querySelector(".hearts");




let currentStep = 1;

const TOTAL_STEPS = 10;

const plan = {

    date: "",

    time: "",

    place: "",

    food: [],

    foodCustom: "",

    dessert: [],

    activities: [],

    activityCustom: "",

    vibe: [],

    transport: [],

    dress: [],

    message: ""

};




const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";

const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";


if (
    typeof emailjs !== "undefined" &&
    EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY"
) {

    emailjs.init(EMAILJS_PUBLIC_KEY);

}




document.addEventListener("click", () => {

    if (
        music &&
        music.paused
    ) {

        music.play().catch(() => {});

    }

}, { once: true });



function positionNoButton() {

    if (!yesBtn || !noBtn) return;

    const yes =
        yesBtn.getBoundingClientRect();

    noBtn.style.left =
        `${yes.right + 20}px`;

    noBtn.style.top =
        `${yes.top}px`;

}


positionNoButton();


window.addEventListener(
    "resize",
    positionNoButton
);


noBtn.addEventListener(
    "mouseenter",
    moveNoButton
);


noBtn.addEventListener(
    "touchstart",
    moveNoButton
);


function moveNoButton(e) {

    e.preventDefault();

    const padding = 20;

    const maxX =
        window.innerWidth -
        noBtn.offsetWidth -
        padding;

    const maxY =
        window.innerHeight -
        noBtn.offsetHeight -
        padding;

    const x =
        Math.random() *
        Math.max(maxX, padding);

    const y =
        Math.random() *
        Math.max(maxY, padding);

    noBtn.style.left =
        `${Math.max(x, padding)}px`;

    noBtn.style.top =
        `${Math.max(y, padding)}px`;

}


noBtn.addEventListener(
    "click",
    e => e.preventDefault()
);




yesBtn.addEventListener(
    "click",
    () => {

        plannerOverlay.classList.add("active");

        currentStep = 1;

        showStep(currentStep);

        document.body.style.overflow = "hidden";

    }
);



plannerSkip.addEventListener(
    "click",
    () => {

        window.location.href =
            "yes.html";

    }
);




plannerNext.addEventListener(
    "click",
    async () => {

        if (!validateStep()) {

            return;

        }

        collectCurrentData();


        if (currentStep < TOTAL_STEPS) {

            currentStep++;

            showStep(currentStep);

            return;

        }



        await finishDatePlan();

    }
);


plannerBack.addEventListener(
    "click",
    () => {

        if (currentStep > 1) {

            currentStep--;

            showStep(currentStep);

        }

    }
);



function showStep(step) {

    document
        .querySelectorAll(".planner-step")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.querySelector(
            `.planner-step[data-step="${step}"]`
        );


    if (target) {

        target.classList.add("active");

    }


    const percentage =
        Math.round(
            (step / TOTAL_STEPS) * 100
        );


    plannerProgressBar.style.width =
        `${percentage}%`;

    plannerPercent.textContent =
        `${percentage}%`;

    plannerStepLabel.textContent =
        `Step ${step} of ${TOTAL_STEPS}`;


    plannerBack.style.visibility =
        step === 1
            ? "hidden"
            : "visible";


    plannerNext.textContent =
        step === TOTAL_STEPS
            ? "Create Our Plan 💖"
            : "Next →";


    if (step === TOTAL_STEPS) {

        collectCurrentData();

        renderPreview();

    }


    plannerStatus.textContent = "";

}




function validateStep() {

    plannerStatus.textContent = "";


    if (currentStep === 1) {

        const date =
            document.getElementById(
                "dateInput"
            ).value;

        const time =
            document.getElementById(
                "timeInput"
            ).value;


        if (!date) {

            plannerStatus.textContent =
                "Please choose our date 💕";

            return false;

        }


        if (!time) {

            plannerStatus.textContent =
                "Please choose when we meet ⏰";

            return false;

        }

    }


    if (currentStep === 2) {

        const place =
            document.getElementById(
                "placeInput"
            ).value.trim();


        if (!place) {

            plannerStatus.textContent =
                "Tell me where we're going 📍";

            return false;

        }

    }


    if (currentStep === 3) {

        const custom =
            document.getElementById(
                "foodCustomInput"
            ).value.trim();


        if (
            plan.food.length === 0 &&
            !custom
        ) {

            plannerStatus.textContent =
                "Choose something delicious 🍽️";

            return false;

        }

    }


    return true;

}




function collectCurrentData() {

    plan.date =
        document.getElementById(
            "dateInput"
        ).value;

    plan.time =
        document.getElementById(
            "timeInput"
        ).value;

    plan.place =
        document.getElementById(
            "placeInput"
        ).value.trim();

    plan.foodCustom =
        document.getElementById(
            "foodCustomInput"
        ).value.trim();

    plan.activityCustom =
        document.getElementById(
            "activityCustomInput"
        ).value.trim();

    plan.message =
        document.getElementById(
            "messageInput"
        ).value.trim();


    plan.food =
        getSelected("food");

    plan.dessert =
        getSelected("dessert");

    plan.activities =
        getSelected("activity");

    plan.vibe =
        getSelected("vibe");

    plan.transport =
        getSelected("transport");

    plan.dress =
        getSelected("dress");

}




function getSelected(group) {

    return [
        ...document.querySelectorAll(
            `.planner-chip.selected[data-group="${group}"]`
        )
    ].map(
        button =>
            button.dataset.value
    );

}




document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".planner-chip"
            );


        if (!button) return;


        const group =
            button.dataset.group;




        if (button.dataset.target) {

            const input =
                document.getElementById(
                    button.dataset.target
                );

            if (input) {

                input.value =
                    button.dataset.value;

            }

            return;

        }




        if (group) {

            button.classList.toggle(
                "selected"
            );

        }

    }
);




function renderPreview() {

    collectCurrentData();


    const rows = [

        [
            "📅 Date",
            formatDate(plan.date)
        ],

        [
            "⏰ Time",
            plan.time || "Not specified"
        ],

        [
            "📍 Location",
            plan.place || "Surprise me"
        ],

        [
            "🍽️ Food",
            combine(
                plan.food,
                plan.foodCustom
            )
        ],

        [
            "🍰 Dessert",
            combine(
                plan.dessert
            )
        ],

        [
            "🎬 Activities",
            combine(
                plan.activities,
                plan.activityCustom
            )
        ],

        [
            "✨ Vibe",
            combine(
                plan.vibe
            )
        ],

        [
            "🚗 Transport",
            combine(
                plan.transport
            )
        ],

        [
            "👗 Dress",
            combine(
                plan.dress
            )
        ],

        [
            "💌 Message",
            plan.message || "A special day together ❤️"
        ]

    ];


    planPreview.innerHTML =
        rows.map(
            row => `

                <div class="preview-item">

                    <span class="preview-label">
                        ${escapeHTML(row[0])}
                    </span>

                    <span class="preview-value">
                        ${escapeHTML(row[1])}
                    </span>

                </div>

            `
        ).join("");

}


function combine(array, custom = "") {

    const values = [
        ...(array || [])
    ];

    if (custom) {

        values.push(custom);

    }

    return values.length
        ? values.join(", ")
        : "Not specified";

}


function formatDate(date) {

    if (!date) {

        return "Not specified";

    }

    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString(
        undefined,
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}




async function finishDatePlan() {

    try {

        /* Collect the final answers */
        collectCurrentData();

        /* Update the preview */
        renderPreview();

        /* Lock the button */
        plannerNext.disabled = true;

        plannerStatus.textContent =
            "Creating your Valentine's invitation... 💕";



        await generateValentinePDF(plan);


  
        localStorage.setItem(
            "valentinePlan",
            JSON.stringify(plan)
        );


        plannerStatus.textContent =
            "Your Valentine's invitation is ready! 💌";


   
        setTimeout(() => {

            window.location.href = "yes.html";

        }, 1500);


    } catch (error) {

        console.error(
            "VALENTINE PDF ERROR:",
            error
        );

        plannerStatus.textContent =
            "Something went wrong creating the invitation 💔";


        plannerNext.disabled = false;

    }

}




function getLoggedInEmail() {



    try {

        if (
            typeof firebase !== "undefined" &&
            firebase.auth
        ) {

            const user =
                firebase.auth().currentUser;

            if (user?.email) {

                return user.email;

            }

        }

    } catch (error) {

        console.warn(
            "Firebase user lookup failed:",
            error
        );

    }




    const storedEmail =
        localStorage.getItem(
            "userEmail"
        );


    if (storedEmail) {

        return storedEmail;

    }


    return null;

}


/*     ========
   PDF
       ======== */


async function generateValentinePDF(plan) {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true
    });

    const W = 297;
    const H = 210;


    const C = {
        bg: [255, 247, 250],
        white: [255, 255, 255],
        pinkLight: [255, 232, 239],
        pink: [255, 174, 196],
        rose: [244, 91, 125],
        red: [211, 53, 84],
        wine: [126, 39, 61],
        text: [91, 44, 58],
        muted: [143, 92, 108],
        cream: [255, 250, 246],
        border: [250, 190, 207]
    };


    /* BG */

    pdf.setFillColor(...C.bg);
    pdf.rect(0, 0, W, H, "F");


    pdf.setFillColor(...C.pinkLight);
    pdf.circle(15, 15, 45, "F");

    pdf.setFillColor(255, 239, 244);
    pdf.circle(285, 195, 55, "F");

    pdf.setFillColor(255, 235, 242);
    pdf.circle(282, 25, 28, "F");

    pdf.setFillColor(255, 242, 246);
    pdf.circle(20, 190, 28, "F");


    /*     ====
       MAIN CARD
           ==== */

    pdf.setFillColor(...C.white);

    pdf.roundedRect(
        8,
        8,
        W - 16,
        H - 16,
        8,
        8,
        "F"
    );

    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(1);

    pdf.roundedRect(
        8,
        8,
        W - 16,
        H - 16,
        8,
        8,
        "S"
    );

    /* Inner border */

    pdf.setDrawColor(255, 224, 233);
    pdf.setLineWidth(0.35);

    pdf.roundedRect(
        13,
        13,
        W - 26,
        H - 26,
        6,
        6,
        "S"
    );


  

    function drawHeart(x, y, size, color) {

        pdf.setFillColor(...color);

        const s = size;

        pdf.circle(
            x - s * 0.25,
            y - s * 0.12,
            s * 0.25,
            "F"
        );

        pdf.circle(
            x + s * 0.25,
            y - s * 0.12,
            s * 0.25,
            "F"
        );

        pdf.triangle(
            x - s * 0.48,
            y,
            x + s * 0.48,
            y,
            x,
            y + s * 0.58,
            "F"
        );
    }


    drawHeart(25, 25, 5, C.pink);
    drawHeart(272, 25, 5, C.rose);
    drawHeart(25, 185, 4, C.rose);
    drawHeart(272, 185, 4, C.pink);


    /*     ====
       HEADER
           ==== */

    pdf.setTextColor(...C.rose);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text(
        "YOU ARE INVITED",
        W / 2,
        27,
        { align: "center" }
    );


    pdf.setTextColor(...C.wine);
    pdf.setFont("times", "bold");
    pdf.setFontSize(28);

    pdf.text(
        "Our Valentine's Date",
        W / 2,
        42,
        { align: "center" }
    );


    pdf.setTextColor(...C.muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);

    pdf.text(
        "A little plan for a very special day",
        W / 2,
        49,
        { align: "center" }
    );


    /* Divider */

    pdf.setDrawColor(...C.border);
    pdf.setLineWidth(0.5);

    pdf.line(
        50,
        56,
        247,
        56
    );

    drawHeart(
        W / 2,
        55,
        3,
        C.rose
    );


    /*     ====
       IMAGE
           ==== */

    const imageX = 26;
    const imageY = 67;
    const imageW = 64;
    const imageH = 75;

    pdf.setFillColor(...C.pinkLight);

    pdf.roundedRect(
        imageX,
        imageY,
        imageW,
        imageH,
        7,
        7,
        "F"
    );

    try {

        const image =
            await loadPDFImage("bears-pdf.png");

        pdf.addImage(
            image,
            "PNG",
            imageX + 5,
            imageY + 5,
            imageW - 10,
            imageH - 10,
            undefined,
            "FAST"
        );

    } catch (error) {

        drawHeart(
            imageX + imageW / 2,
            imageY + 28,
            15,
            C.rose
        );

        pdf.setTextColor(...C.rose);
        pdf.setFont("times", "italic");
        pdf.setFontSize(12);

        pdf.text(
            "Made with love",
            imageX + imageW / 2,
            imageY + 53,
            { align: "center" }
        );
    }


    /*     ====
       DATE + TIME
           ==== */

    const contentX = 101;

    pdf.setTextColor(...C.rose);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);

    pdf.text(
        "THE SPECIAL DAY",
        contentX,
        69
    );


    pdf.setTextColor(...C.wine);
    pdf.setFont("times", "bold");
    pdf.setFontSize(17);

    pdf.text(
        formatValentineDate(plan.date),
        contentX,
        80
    );


    pdf.setTextColor(...C.text);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    pdf.text(
        `At ${formatTime(plan.time)}`,
        contentX,
        90
    );


    /*     ====
       INFORMATION CARD
           ==== */

    function infoCard(
        x,
        y,
        width,
        height,
        label,
        value
    ) {

        pdf.setFillColor(...C.cream);

        pdf.roundedRect(
            x,
            y,
            width,
            height,
            4,
            4,
            "F"
        );

        pdf.setDrawColor(
            250,
            221,
            229
        );

        pdf.setLineWidth(0.3);

        pdf.roundedRect(
            x,
            y,
            width,
            height,
            4,
            4,
            "S"
        );


        /* Label */

        pdf.setTextColor(...C.rose);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(6.5);

        pdf.text(
            label.toUpperCase(),
            x + 5,
            y + 7
        );


        /* Value */

        pdf.setTextColor(...C.text);

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(8);

        const cleanValue =
            normalizePDFValue(value);


        const lines =
            pdf.splitTextToSize(
                cleanValue || "Not specified",
                width - 10
            );


        pdf.text(
            lines.slice(0, 2),
            x + 5,
            y + 15
        );
    }


    /*     ====
       ROW 1
           ==== */

    infoCard(
        contentX,
        98,
        88,
        25,
        "Where",
        plan.place
    );

    infoCard(
        contentX + 94,
        98,
        88,
        25,
        "Food",
        plan.food
    );



    infoCard(
        contentX,
        127,
        88,
        25,
        "Dessert",
        plan.dessert
    );

    infoCard(
        contentX + 94,
        127,
        88,
        25,
        "Activities",
        plan.activities
    );


    /*     ====
       ROW 3
           ==== */

    infoCard(
        contentX,
        156,
        55,
        25,
        "Vibe",
        plan.vibe
    );

    infoCard(
        contentX + 61,
        156,
        55,
        25,
        "Transport",
        plan.transport
    );

    infoCard(
        contentX + 122,
        156,
        60,
        25,
        "Dress Code",
        plan.dress
    );


    /*     ====
       MESSAGE
           ==== */

    const messageX = 26;
    const messageY = 151;
    const messageW = 64;
    const messageH = 30;

    pdf.setFillColor(
        255,
        241,
        246
    );

    pdf.roundedRect(
        messageX,
        messageY,
        messageW,
        messageH,
        5,
        5,
        "F"
    );

    pdf.setTextColor(...C.rose);

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(6.5);

    pdf.text(
        "A LITTLE MESSAGE",
        messageX + 6,
        messageY + 8
    );


    pdf.setTextColor(...C.text);

    pdf.setFont(
        "times",
        "italic"
    );

    pdf.setFontSize(7.5);

    const message =
        normalizePDFValue(
            plan.message
        ) ||
        "I can't wait to spend this special day with you.";

    const messageLines =
        pdf.splitTextToSize(
            `"${message}"`,
            messageW - 12
        );

    pdf.text(
        messageLines.slice(0, 3),
        messageX + 6,
        messageY + 16
    );



    pdf.setTextColor(...C.rose);

    pdf.setFont(
        "times",
        "italic"
    );

    pdf.setFontSize(8);

    pdf.text(
        "A day planned with love",
        W / 2,
        197,
        { align: "center" }
    );


    /*     ====
       SAVE
           ==== */

    const filename =
        "Our-Valentines-Date.pdf";

    pdf.save(filename);

    return pdf;
}




function normalizePDFValue(value) {

    if (value === null || value === undefined) {
        return "";
    }


    if (Array.isArray(value)) {

        return value
            .map(item =>
                normalizePDFValue(item)
            )
            .filter(Boolean)
            .join(" • ");
    }


    let text =
        String(value);




    text = text
        .replace(
            /[\u{1F000}-\u{1FFFF}]/gu,
            ""
        )
        .replace(
            /[\u{2600}-\u{27BF}]/gu,
            ""
        )
        .replace(
            /[♡♥❤💕💗💖💘💝💞💓💟]/gu,
            ""
        );


    /*
       Replace common problematic symbols
    */

    text = text
        .replace(/&a/g, "")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();


    return text;
}


/*     ========
   DATE FORMAT
       ======== */

function formatValentineDate(dateString) {

    if (!dateString) {
        return "Date to be decided";
    }

    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return normalizePDFValue(
            dateString
        );
    }

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


/*     ========
   TIME FORMAT
       ======== */

function formatTime(timeString) {

    if (!timeString) {
        return "Time to be decided";
    }

    const parts =
        timeString.split(":");

    if (parts.length < 2) {
        return timeString;
    }

    let hour =
        parseInt(parts[0], 10);

    const minute =
        parts[1];

    if (Number.isNaN(hour)) {
        return timeString;
    }

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}


/*     ========
   IMAGE LOADER
       ======== */

function loadPDFImage(src) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();

            img.onload =
                () => resolve(img);

            img.onerror =
                () => reject(
                    new Error(
                        `Could not load ${src}`
                    )
                );

            img.src = src;
        }
    );
}


function formatValentineDate(dateString) {

    if (!dateString) {

        return "Date to be decided";

    }

    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}





/*     ========
   EMAILJS
       ======== */

async function sendEmail(
    recipient
) {

    if (
        typeof emailjs === "undefined"
    ) {

        throw new Error(
            "EmailJS is not loaded."
        );

    }


    if (
        EMAILJS_PUBLIC_KEY ===
        "YOUR_PUBLIC_KEY"
    ) {

        console.warn(
            "EmailJS is not configured."
        );

        return;

    }


    const templateParams = {

        to_email: recipient,

        date: formatDate(plan.date),

        time: plan.time,

        location: plan.place,

        food: combine(
            plan.food,
            plan.foodCustom
        ),

        dessert: combine(
            plan.dessert
        ),

        activities: combine(
            plan.activities,
            plan.activityCustom
        ),

        vibe: combine(
            plan.vibe
        ),

        transport: combine(
            plan.transport
        ),

        dress: combine(
            plan.dress
        ),

        message:
            plan.message ||
            "Can't wait for our special day ❤️"

    };


    return emailjs.send(

        EMAILJS_SERVICE_ID,

        EMAILJS_TEMPLATE_ID,

        templateParams

    );

}


/*     ========
   ESCAPE HTML
       ======== */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/*     ========
   HEART ANIMATION
       ======== */

function createHeart() {

    if (!hearts) return;


    const heart =
        document.createElement("span");


    heart.style.left =
        Math.random() * 100 + "vw";


    heart.style.animationDuration =
        Math.random() * 4 + 5 + "s";


    heart.style.transform =
        `scale(${Math.random() * 0.8 + 0.5})`;


    hearts.appendChild(
        heart
    );


    setTimeout(
        () => heart.remove(),
        9000
    );

}


setInterval(
    createHeart,
    500
);