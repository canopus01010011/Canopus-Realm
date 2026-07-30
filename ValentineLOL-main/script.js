const noBtn = document.getElementById("NoB");
const yesBtn = document.getElementById("YesB");
const hearts = document.querySelector(".hearts");

const container = document.querySelector(".page");

const padding = 20;

function placeNextToYes() {
    const y = yesBtn.getBoundingClientRect();
    const c = container.getBoundingClientRect();

    noBtn.style.left = (y.right - c.left + 15) + "px";
    noBtn.style.top  = (y.top - c.top) + "px";
}

placeNextToYes();

noBtn.addEventListener("mouseenter", () => {
    const c = container.getBoundingClientRect();
    const b = noBtn.getBoundingClientRect();

    const maxX = c.width - b.width - padding;
    const maxY = c.height - b.height - padding;

    const x = Math.random() * maxX + padding;
    const y = Math.random() * maxY + padding;

    noBtn.style.left = `${x}px`;
    noBtn.style.top  = `${y}px`;
});

noBtn.addEventListener("click", e => e.preventDefault());


yesBtn.addEventListener("click", () => {
    window.location.href = "yes.html";
});

function createHeart() {
    const heart = document.createElement("span");
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = (Math.random() * 3 + 5) + "s";
    hearts.appendChild(heart);
    setTimeout(() => heart.remove(), 8000);
}

setInterval(createHeart, 400);
