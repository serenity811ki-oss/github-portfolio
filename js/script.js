/* ==========================================================================
   STEPHEN KISS PORTFOLIO — script.js
   Handles: sticky header state, mobile nav toggle, smooth-scroll close,
   scroll-reveal animations, back-to-top button, footer year, and the
   hero "signal line" canvas animation (an equipment-uptime waveform motif).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------- Footer year ---------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------- Back to top button ---------------------- */
  // Declared before the sticky-header block so `backToTop` already exists
  // the moment onScroll() runs its initial, synchronous call below.
  const backToTop = document.getElementById('backToTop');
  function toggleBackToTop() {
    if (window.scrollY > 480) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }
  backToTop.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------- Sticky header state ---------------------- */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    toggleBackToTop();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------- Mobile nav toggle ---------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu after a nav link is clicked
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------------- Scroll-reveal animations ---------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for very old browsers
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------- Contact form submission ---------------------- */
  const contactForm = document.getElementById('contactForm');
  const contactFormStatus = document.getElementById('contactFormStatus');
  const contactSubmit = contactForm?.querySelector('button[type="submit"]');

  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    if (!contactForm) return;

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const formData = new FormData(contactForm);
    const submitButton = contactSubmit;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    setFormStatus('', '');

    try {
      const response = await fetch(contactForm.action, {
        method: contactForm.method,
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setFormStatus('Your message was sent successfully. I’ll respond shortly.', 'success');
        contactForm.reset();
      } else {
        const message = result?.message || 'Something went wrong while sending your message. Please try again later.';
        setFormStatus(message, 'error');
      }
    } catch (error) {
      setFormStatus('Unable to send your message right now. Please try again in a few minutes.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
      }
    }
  }

  function setFormStatus(message, type) {
    if (!contactFormStatus) return;

    contactFormStatus.textContent = message;
    contactFormStatus.className = 'form-status';

    if (type === 'success') {
      contactFormStatus.classList.add('form-status--success');
    }
    if (type === 'error') {
      contactFormStatus.classList.add('form-status--error');
    }
  }

  /* ---------------------- Hero signal-line canvas ---------------------- */
  initSignalCanvas();
});

/**
 * Draws a slow-moving oscilloscope-style waveform across the hero section,
 * evoking an equipment uptime/vibration signal. Purely decorative and
 * respects prefers-reduced-motion by rendering a single static frame.
 */
function initSignalCanvas() {
  const canvas = document.getElementById('signalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, width, height);

    const baseline = height * 0.62;
    const amplitude = height * 0.09;
    const segments = 5;

    ctx.beginPath();
    ctx.moveTo(0, baseline);

    for (let x = 0; x <= width; x += 4) {
      const progress = x / width;
      // Combine a slow sine wave with periodic "spike" events to mimic
      // a downtime/vibration signal on an uptime trace.
      let y = baseline + Math.sin(progress * Math.PI * 2 * segments + t) * amplitude * 0.35;

      const spikePhase = (progress * segments + t * 0.15) % 1;
      if (spikePhase > 0.92) {
        const spikeStrength = (spikePhase - 0.92) / 0.08;
        y -= Math.sin(spikeStrength * Math.PI) * amplitude * 2.2;
      }
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = 'rgba(226, 121, 61, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Faint secondary trace for depth
    ctx.beginPath();
    ctx.moveTo(0, baseline + 40);
    for (let x = 0; x <= width; x += 6) {
      const progress = x / width;
      const y = baseline + 40 + Math.sin(progress * Math.PI * 2 * (segments - 1) + t * 0.8 + 1.3) * amplitude * 0.25;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(107, 132, 163, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  resize();
  window.addEventListener('resize', resize);

  if (prefersReducedMotion) {
    drawFrame(0);
    return;
  }

  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const elapsed = (timestamp - start) / 1000;
    drawFrame(elapsed);
    window.requestAnimationFrame(animate);
  }
  window.requestAnimationFrame(animate);
}
