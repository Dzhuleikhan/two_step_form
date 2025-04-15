import gsap from "gsap";

gsap.to(".bg-pattern", {
  xPercent: -100,
  duration: 80,
  ease: "none",
  repeat: -1,
});

gsap.to(".frame-big-logo", {
  scale: 1.1,
  ease: "none",
  repeat: -1,
  yoyo: true,
  duration: 1,
});

const playersCountNumber = document.querySelector(".players-count");
let current = 80;
const min = 80;
const max = 240;

function getRandomStep() {
  return Math.floor(Math.random() * 4) + 1; // шаг от 1 до 10
}

function updateNumber() {
  const step = getRandomStep();
  current += step;

  if (current > max) {
    current = min;
  }

  playersCountNumber.textContent = current;
  playersCountNumber.classList.add("grow");
  setTimeout(() => {
    playersCountNumber.classList.remove("grow");
  }, 300);
}

setInterval(updateNumber, 4000);

const preloaderTl = gsap.timeline();
preloaderTl
  .to(".preloader", { opacity: 0, duration: 0.25, delay: 1 })
  .fromTo(
    ".chicken-left",
    { yPercent: 80 },
    { yPercent: 0, duration: 3.5, ease: "elastic.out(1,0.3)" },
  )
  .fromTo(
    ".chicken-right",
    { yPercent: 80 },
    { yPercent: 0, duration: 3.5, ease: "elastic.out(1,0.3)" },
    "<+0.1",
  )
  .add(() => {
    // Floating animation starts after initial entrance
    gsap.to(".chicken-left", {
      y: "+=60", // float up a bit
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(".chicken-right", {
      y: "-=60",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });
