// src/scripts/VideoDetailHero.ts

/**
 * Manages the content auto-hide / reveal behaviour on the
 * video-detail hero (.vd-hero), mirroring the hero-banner logic.
 *
 * After 3 s of inactivity the overlaid text & buttons fade out
 * and the gradient cross-fades from radial → linear so the video
 * plays "clean". Any mouse / touch / scroll interaction reveals
 * the content again and restarts the timer.
 */

const HIDE_DELAY = 3000; // ms

export function initVideoDetailHero(): void {
  const hero = document.querySelector<HTMLElement>('.vd-hero');
  if (!hero) return;

  /* ── Responsive video source (mobile / desktop) ── */
  const video = hero.querySelector<HTMLVideoElement>('.vd-hero__video');
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  function setVideoSource() {
    if (!video) return;
    const desiredSrc = mobileQuery.matches
      ? video.dataset.srcMobile
      : video.dataset.srcDesktop;
    if (!desiredSrc) return;
    if (video.src && video.src.endsWith(desiredSrc)) return;
    video.src = desiredSrc;
    video.load();
    video.play().catch(() => {});
  }

  setVideoSource();
  mobileQuery.addEventListener('change', setVideoSource);

  /* ── Content auto-hide / reveal ── */
  let timer: number | null = null;

  const hide = () => {
    hero.classList.add('vd-hero--content-hidden');
  };

  const show = () => {
    hero.classList.remove('vd-hero--content-hidden');
  };

  const startTimer = () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(hide, HIDE_DELAY);
  };

  const reveal = () => {
    show();
    startTimer();
  };

  // Manage hover class for description visibility
  hero.addEventListener('mouseenter', () => {
    hero.classList.add('vd-hero--hovering');
  });
  hero.addEventListener('mouseleave', () => {
    hero.classList.remove('vd-hero--hovering');
  });

  // Touch & pointer events on the hero
  hero.addEventListener('touchstart', reveal, { passive: true });
  hero.addEventListener('mousedown', reveal);
  hero.addEventListener('mousemove', reveal, { passive: true });

  // Scroll anywhere on the page also reveals content
  window.addEventListener('scroll', reveal, { passive: true });

  // Kick off the first timer
  startTimer();
}
