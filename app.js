document.body.classList.add("intro-lock");

const introTL = gsap.timeline({
  defaults: { ease: "power4.out" }
});

introTL
  .from(".intro-title", {
    y: 120,
    opacity: 0,
    duration: 1.4
  })
  .from(".intro-sub", {
    y: 60,
    opacity: 0,
    duration: 1
  }, "-=0.6")

  // subtle glitch pulse
  .to(".intro-title", {
    textShadow: "0 0 80px rgba(93,169,255,0.9)",
    duration: 0.3,
    repeat: 2,
    yoyo: true
  })

  // exit intro
  .to("#intro", {
    y: "-100%",
    duration: 1.4,
    delay: 0.8
  })

  .add(() => {
    document.body.classList.remove("intro-lock");
    document.getElementById("intro").remove();
  });
gsap.registerPlugin(ScrollTrigger);

/* Floating NFT loader */
const catContainer = document.getElementById("cats");

for (let i = 1; i <= 9; i++) {
  const img = document.createElement("img");
  img.src = `assets/cats/${i}.png`;
  img.style.left = Math.random() * 100 + "vw";
  img.style.top = Math.random() * 100 + "vh";
  catContainer.appendChild(img);

  gsap.to(img, {
    y: "+=120",
    x: "+=80",
    rotation: Math.random() * 20 - 10,
    duration: 6 + Math.random() * 6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
}

/* Hero reveal */
gsap.from(".title", {
  opacity: 0,
  y: 80,
  duration: 1.4,
  ease: "power4.out"
});

gsap.from(".subtitle", {
  opacity: 0,
  y: 40,
  delay: 0.4,
  duration: 1
});
