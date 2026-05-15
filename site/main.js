/* ═══════════════════════════════════════════
   SrP-CFG Installer — Interactive Logic
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Scroll Reveal ─── //

  const revealEls = document.querySelectorAll(
    '.feat-card, .step-item, .showcase-row, .terminal, .cta-card, .stats-strip'
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Stagger within a group of siblings
        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.children).filter((el) => el.classList.contains('reveal') || el.matches('.feat-card, .step-item')) : [];
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.max(0, idx) * 70}ms`;
        entry.target.classList.add('visible');
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // ─── Nav Scroll Shadow ─── //

  const nav = document.getElementById('nav');
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 32);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── Mobile Menu ─── //

  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // ─── Nav Active Highlight ─── //

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        });
      },
      { threshold: 0.25, rootMargin: '-64px 0px -35% 0px' }
    );

    sections.forEach((s) => sectionObserver.observe(s));
  }

  // ─── Log Terminal Typing Animation ─── //

  const termBody = document.getElementById('termBody');

  if (termBody) {
    const logLines = Array.from(termBody.querySelectorAll('.log-ln'));

    const termObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        termObserver.disconnect();

        termBody.classList.add('animated');
        logLines.forEach((line, i) => {
          line.style.animationDelay = `${i * 75}ms`;
        });
      },
      { threshold: 0.15 }
    );

    termObserver.observe(termBody);
  }
})();
