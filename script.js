const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsFinePointer = window.matchMedia("(pointer: fine)");
const supportsLargeViewport = window.matchMedia("(min-width: 1025px)");

document.documentElement.classList.add("js-ready");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });
});

const revealHero = () => {
  window.requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
    document.body.classList.remove("is-booting");
  });
};

const revealSections = () => {
  const sections = [...document.querySelectorAll("[data-animate-section]")];

  if (!sections.length) return;

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.24,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  sections.forEach((section) => observer.observe(section));
};

const setupHeroVideo = () => {
  const video = document.querySelector(".hero-background-video");
  if (!video) return;

  const activateVideo = () => {
    if (!video.src) {
      const source = video.dataset.src;
      if (source) {
        video.src = source;
        video.load();
      }
    }
  };

  const revealVideo = () => {
    video.classList.add("is-active");
  };

  video.addEventListener("loadeddata", revealVideo, { once: true });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(activateVideo, { timeout: 1200 });
  } else {
    window.setTimeout(activateVideo, 180);
  }

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    activateVideo();
    return;
  }

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
          video.pause();
          return;
        }

        activateVideo();
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
          playAttempt.catch(() => {});
        }
      });
    },
    {
      threshold: [0, 0.35, 0.7],
    },
  );

  const heroSection = document.querySelector(".hero-section");
  if (heroSection) heroObserver.observe(heroSection);
};

const setupProjectParallax = () => {
  const visuals = [...document.querySelectorAll(".parallax-media")];
  if (!visuals.length) return;

  if (
    prefersReducedMotion.matches ||
    !supportsFinePointer.matches ||
    !supportsLargeViewport.matches
  ) {
    visuals.forEach((item) => item.style.setProperty("--parallax-shift", "0px"));
    return;
  }

  let ticking = false;

  const update = () => {
    const viewportHeight = window.innerHeight || 1;

    visuals.forEach((visual) => {
      const rect = visual.getBoundingClientRect();
      const section = visual.closest("[data-animate-section]");

      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      if (section && !section.classList.contains("is-visible")) return;

      const cardCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const normalized = (cardCenter - viewportCenter) / viewportHeight;
      const shift = Math.max(-18, Math.min(18, normalized * -24));

      visual.style.setProperty("--parallax-shift", `${shift}px`);
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
};

const init = () => {
  setupHeroVideo();
  revealHero();
  revealSections();
  setupProjectParallax();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
