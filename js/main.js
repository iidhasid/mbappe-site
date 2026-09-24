/* ============================================================
   MBAPPE — main.js
   Lenis · GSAP ScrollTrigger · SplitText · scrub · cursor · menu
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(hover: none), (pointer: coarse)").matches || innerWidth < 820;
  const hasSplit = typeof SplitText !== "undefined" && typeof ScrollTrigger !== "undefined";

  document.documentElement.classList.add("js");
  if (prefersReduced) document.documentElement.classList.add("no-js");

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) SplitText;
  else console.warn("[mbappe] SplitText not loaded — falling back to fades.");

  /* ---------------- LENIS ---------------- */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    ScrollTrigger.refresh();
  }

  /* ---------------- CURSOR ---------------- */
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  if (dot && ring && !isMobile) {
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      rx(e.clientX);
      ry(e.clientY);
    });
    const hot = (list) =>
      list.forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("hot"));
        el.addEventListener("mouseleave", () => ring.classList.remove("hot"));
      });
    hot($$("a, button, [data-cursor], video, .reel-media, .about-frame"));
  }

  /* ---------------- GRAIN INTENSITY BY SECTION ---------------- */
  // (kept via CSS; could be faded down over Nile section with toggle)
  const grain = $(".grain");

  /* ---------------- PROGRESS BAR ---------------- */
  gsap.to("#progressBar", {
    width: "100%",
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 },
  });

  /* ---------------- NAV AUTO-HIDE ---------------- */
  const nav = $(".nav");
  let lastY = 0;
  gsap.to(nav, { yPercent: 0, duration: 0.4, ease: "power2.out" });
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > lastY && y > 200) nav.classList.add("hidden");
      else nav.classList.remove("hidden");
      lastY = y;
    },
    { passive: true }
  );

  /* ---------------- MOBILE MENU ---------------- */
  const burger = $("#burger");
  const menu = $("#menu");
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.classList.toggle("open", open);
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open) {
        gsap.fromTo(
          menu,
          { clipPath: "circle(0% at 100% 0%)" },
          { clipPath: "circle(150% at 100% 0%)", duration: 0.8, ease: "expo.inOut" }
        );
        gsap.fromTo(
          menu.querySelectorAll("nav a"),
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.07, delay: 0.25, duration: 0.6, ease: "expo.out" }
        );
      } else {
        gsap.to(menu, { clipPath: "circle(0% at 100% 0%)", duration: 0.6, ease: "expo.inOut" });
      }
    });
  }

  /* ---------------- SMOOTH ANCHOR SCROLL ---------------- */
  $$("[data-scroll]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href");
      if (!target || !target.startsWith("#")) return;
      e.preventDefault();
      const el = document.querySelector(target);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -10 });
      else el.scrollIntoView({ behavior: "smooth" });
      // close the mobile menu if it was open
      if (menu && menu.classList.contains("open")) {
        menu.classList.remove("open");
        burger.classList.remove("open");
        if (lenis) lenis.start();
        gsap.to(menu, { clipPath: "circle(0% at 100% 0%)", duration: 0.6, ease: "expo.inOut" });
      }
    });
  });

  /* ---------------- VIDEO HELPERS ---------------- */
  function playVideo(v) {
    if (!v) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }
  function pauseVideo(v) {
    if (v && !v.paused) v.pause();
  }

  /* Autoplay-loop a video while its frame is on screen —
     keeps every clip visibly running (YouTube-style playback). */
  function autoplayOnView(video, triggerEl, clickToggle) {
    if (!video) return;
    video.muted = true;
    video.loop = true;
    const io = new IntersectionObserver(
      (es) => es.forEach((en) => (en.isIntersecting ? playVideo(video) : pauseVideo(video))),
      { threshold: 0.2 }
    );
    io.observe(triggerEl || video.parentElement);
    if (clickToggle) video.addEventListener("click", () => (video.paused ? playVideo(video) : pauseVideo(video)));
    return io;
  }

  /* ---------------- REELS + ABOUT VIDEOS ---------------- */
  autoplayOnView($(".rv-a"), $("#reelA"), true);
  autoplayOnView($(".rv-b"), $("#reelB"), true);
  autoplayOnView($(".ab-video"), null, true);

  /* ---------------- HERO (always running, YouTube-style) ---------------- */
  const heroVideo = $(".hero-video");
  const heroEl = $("#hero");

  if (heroVideo && heroEl) {
    autoplayOnView(heroVideo, heroEl);
    // slow cinematic push-in so the hero never looks static
    if (!prefersReduced) {
      gsap.fromTo(heroVideo, { scale: 1.08 }, { scale: 1.3, ease: "sine.inOut", duration: 26, yoyo: true, repeat: -1 });
    } else {
      gsap.set(heroVideo, { scale: 1.14 });
    }

    // glyphs drift
    gsap.to(".glyph-a", { y: -80, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".glyph-b", { y: -140, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".glyph-c", { y: -60, ease: "none", scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------------- STAT COUNTERS ---------------- */
  $$(".stat-num").forEach((el) => {
    const target = parseFloat(el.dataset.count || "0");
    gsap.fromTo(
      el,
      { innerText: 0 },
      {
        innerText: target,
        duration: 2,
        snap: { innerText: 1 },
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      }
    );
  });

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  if (!isMobile) {
    $$("[data-cursor='magnetic']").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------------- REVEAL ENGINE ---------------- */
  const revealEls = (selector, makeSplit, anim) => {
    $$(selector).forEach((el) => {
      if (!el || el.dataset.done) return;
      if (el.closest(".hero")) return; // hero animates through preloader
      el.dataset.done = "1";

      if (makeSplit && hasSplit && !prefersReduced) {
        let text;
        try {
          text = new SplitText(el, { type: "chars,words,lines", mask: "lines" });
        } catch (e) {
          console.warn("[mbappe] split failed, fading.", e);
        }
        if (!text || !text.chars || !text.chars.length) {
          gsap.from(el, { y: 46, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
          return;
        }
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
          onComplete: () => {
            if (text && text.revert) text.revert();
          },
        });
        tl.from(text.chars, { yPercent: 120, opacity: 0, stagger: 0.016, duration: 0.62, ease: "expo.out" });
        return;
      }

      const tl2 = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      tl2.from(el, anim || { y: 46, opacity: 0, duration: 0.9, ease: "expo.out" });
    });
  };

  revealEls(".split-char", true);
  revealEls(".kicker, .ccard, .stat, .about-copy p, .about-list li, .reel-copy p, .reel-tag, .contact-note, .hero-eyebrow, .hero-sub, .hero-actions, .hero-credit", false);

  // split-line wrappers: reveal each wrapped child
  $$(".split-line").forEach((el) => {
    if (el.dataset.done) return;
    if (el.closest(".hero")) return;
    el.dataset.done = "1";
    if (prefersReduced) return;
    const kids = Array.from(el.children).filter((c) => c.children.length || c.nodeType === 1);
    gsap.from(kids.length ? kids : el, {
      y: 46,
      opacity: 0,
      stagger: 0.08,
      duration: 0.85,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  // reel media parallax zoom on scroll
  $$(".about-frame video, .reel-media video").forEach((v) => {
    gsap.fromTo(
      v,
      { scale: 1.12 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: v.closest(".about-frame, .reel-media"), start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  // reveal safety-net: nothing reveal-gated may stay hidden if a trigger
  // misfired during heavy scroll/load — force any visible-but-faded item to show.
  setTimeout(() => {
    $$(".split-char, .split-line > *").forEach((el) => {
      if (el.parentElement && el.parentElement.closest(".hero")) return;
      const stillHidden = [...el.children].some((c) => parseFloat(window.getComputedStyle(c).opacity || "1") < 0.1);
      if (!stillHidden) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        gsap.to(el.children, { yPercent: 0, y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
      }
    });
  }, 2500);

  /* ---------------- PRELOADER ---------------- */
  function _runPreloader() {
    const pre = $("#preloader");
    const letters = $$(".pre-letter");
    const counter = $(".pre-count");
    const line = document.createElement("div");
    line.className = "pre-line";
    pre.appendChild(line);

    // 1. letters write in
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(line, { opacity: 0.7, duration: 0.6, ease: "power2.inOut" }, 0);
    letters.forEach((l, i) => tl.to(l, { opacity: 1, y: 0, duration: 0.55 }, i * 0.06 + 0.15));
    tl.to(line, { opacity: 0, duration: 0.4 }, "-=0.3");

    // 2. count 00 -> 100
    const countObj = { v: 0 };
    const countTween = gsap.to(countObj, {
      v: 100,
      duration: 1.6,
      ease: "power2.inOut",
      delay: 0.35,
      onUpdate: () => {
        if (counter) counter.textContent = String(Math.floor(countObj.v)).padStart(2, "0");
      },
    });
    tl.add(countTween, 0.15);

    // 3. wipe up reveal
    tl.to(pre, {
      clipPath: "inset(0 0 100% 0)",
      duration: 1,
      ease: "expo.inOut",
      delay: 0.1,
      onStart: () => document.body.classList.add("loaded"),
      onComplete: () => {
        pre.classList.add("done");
        pre.remove();
        ScrollTrigger.refresh();
      },
    });

    // 4. hero entrance — split the MBAPPE display title into chars
    let heroChars = null;
    const heroTitle = $(".hero-title");
    if (heroTitle && hasSplit && !prefersReduced) {
      try {
        heroChars = new SplitText(heroTitle, { type: "chars,words,lines", mask: "lines" });
        tl.from(heroChars.chars, { yPercent: 130, opacity: 0, stagger: 0.035, duration: 0.75, ease: "expo.out" }, "-=0.45");
      } catch (e) {
        heroChars = null;
      }
    }
    if (!heroChars) {
      tl.from(".hero-title", { y: 90, opacity: 0, duration: 0.8, ease: "expo.out" }, "-=0.45");
    }
    tl.from(
      ".hero-eyebrow, .hero-arabic, .hero-sub, .hero-actions, .hero-credit",
      { y: 60, opacity: 0, stagger: 0.09, duration: 0.8, ease: "expo.out" },
      "-=0.9"
    );
    tl.add(() => {
      if (heroChars && heroChars.revert) heroChars.revert();
    });
  }

  function runPreloader() {
    try {
      _runPreloader();
    } catch (e) {
      console.error("[mbappe] preloader error", e);
      forceOpen();
    }
  }

  function forceOpen() {
    const pre = $("#preloader");
    if (!pre) return;
    document.body.classList.add("loaded");
    pre.classList.add("done");
    if (pre.parentNode) pre.parentNode.removeChild(pre);
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  }

  window.addEventListener("load", () => {
    // small settle so webgl + video warm up
    setTimeout(boot, prefersReduced ? 0 : 250);
  });

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    runPreloader();
    // failsafe: never allow the preloader to trap the page
    setTimeout(forceOpen, 9000);
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  }

  // safety: if load already fired (served from cache), kick boots anyway
  if (document.readyState === "complete") {
    setTimeout(boot, prefersReduced ? 0 : 60);
  }

  /* ---------------- RESIZE ---------------- */
  window.addEventListener("resize", () => ScrollTrigger.refresh());
})();