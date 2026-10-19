/**
 * ============================================================================
 * GEMS Network - About Page 3D Perspective Scroll & Banner Overlay Engine
 * Scoped strictly to about.html.
 * ============================================================================
 */

(function () {
  "use strict";

  // Check user preference for reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  if (prefersReducedMotion && prefersReducedMotion.matches) {
    return; // Exit gracefully if user prefers reduced motion
  }

  function init3DPerspectiveScroll() {
    const trackedItems = [];
    let isAnimating = false;
    let windowHeight = window.innerHeight;
    let windowWidth = window.innerWidth;

    // Device responsive multipliers
    let rotScale = 1.0;
    let depthScale = 1.0;
    let allowY = true;

    function updateDeviceMetrics() {
      windowHeight = window.innerHeight;
      windowWidth = window.innerWidth;

      if (windowWidth > 991) {
        // Desktop / Laptop: Full subtle 3D perspective
        rotScale = 1.0;
        depthScale = 1.0;
        allowY = true;
      } else if (windowWidth >= 768) {
        // Tablet: Reduced intensity
        rotScale = 0.45;
        depthScale = 0.55;
        allowY = true;
      } else {
        // Mobile: Lightweight depth, no rotation to prevent gesture interference
        rotScale = 0.0;
        depthScale = 0.22;
        allowY = false;
      }
    }

    updateDeviceMetrics();

    // =========================================================================
    // VIDEO BANNER SECTION - FULL-COVER OVERLAY & SMOOTH SCROLL DEPTH CONTROLLER
    // =========================================================================
    const bannerSection = document.querySelector(".about-page-banner");
    function updateBannerScroll() {
      if (!bannerSection) return;
      const bannerHeight = bannerSection.offsetHeight || 380;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      // Only perform calculations when banner is in or adjacent to viewport
      if (scrollY <= bannerHeight + 120) {
        const factor = Math.min(1, Math.max(0, scrollY / bannerHeight));
        // Deepen overlay smoothly from 0.74 at the top to 0.88 as user scrolls into the story
        const overlayOp = 0.74 + factor * 0.14;
        // Subtle vertical parallax movement (keeps video 100% full cover without gaps)
        const videoTy = scrollY * 0.18;

        bannerSection.style.setProperty(
          "--banner-overlay-op",
          overlayOp.toFixed(3)
        );
        bannerSection.style.setProperty(
          "--banner-video-ty",
          videoTy.toFixed(2) + "px"
        );
      }
    }

    // Helper to register an element into 3D tracking
    function registerElement(el, type) {
      if (!el) return;
      el.classList.add("gems-3d-layer");
      trackedItems.push({
        el: el,
        type: type,
        isVisible: true,
        currentRx: 0,
        currentRy: 0,
        currentTz: 0,
        currentScale: 1,
        targetRx: 0,
        targetRy: 0,
        targetTz: 0,
        targetScale: 1,
      });
    }

    // 1. Story Section Rows (subtle card/row perspective tilt)
    const storyRows = document.querySelectorAll(".aboutus-sectin-home .row");
    storyRows.forEach(function (row) {
      registerElement(row, "row");
    });

    // 2. Our Philosophy Timeline Panels (left/right alternating depth)
    const timelineRows = document.querySelectorAll(
      "#Our\\ Philosophy .gems-timeline-row"
    );
    timelineRows.forEach(function (row) {
      const panelWrap = row.querySelector(".gems-timeline-panel-wrap");
      if (panelWrap) {
        const isLeft = row.classList.contains("gems-row-left");
        registerElement(panelWrap, isLeft ? "timeline-left" : "timeline-right");
      }
    });

    // 3. Every Journey Matters Swiper Wrap
    const journeySlider = document.querySelector(
      "#every-journey-matters .gems-journey-slider-wrap"
    );
    if (journeySlider) {
      registerElement(journeySlider, "card");
    }

    // 4. Mission Preview Card
    const missionCard = document.querySelector(
      ".about-mission-preview-section .mission-preview-card"
    );
    if (missionCard) {
      registerElement(missionCard, "card");
    }

    // 5. Guiding Principles Vision Editorial Card
    const visionCard = document.querySelector(
      ".gems-eagle-editorial-wrapper .gems-eagle-editorial-card"
    );
    if (visionCard) {
      registerElement(visionCard, "card");
    }

    // 6. Final CTA Content Panel
    const finalCtaContent = document.querySelector(
      ".about-final-cta-section .about-final-cta-content"
    );
    if (finalCtaContent) {
      registerElement(finalCtaContent, "cta");
    }

    if (trackedItems.length === 0 && !bannerSection) return;

    // Use IntersectionObserver for high performance (only calculate in-view items)
    let observer;
    if ("IntersectionObserver" in window && trackedItems.length > 0) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            const item = trackedItems.find(function (i) {
              return i.el === entry.target;
            });
            if (item) {
              item.isVisible = entry.isIntersecting;
              if (item.isVisible) requestTick();
            }
          });
        },
        { rootMargin: "150px 0px 150px 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
      );

      trackedItems.forEach(function (item) {
        observer.observe(item.el);
      });
    }

    // Main animation and interpolation render loop
    function render() {
      let hasUnfinishedMotion = false;
      const LERP_FACTOR = 0.12;

      // Update banner overlay and video parallax
      updateBannerScroll();

      for (let i = 0; i < trackedItems.length; i++) {
        const item = trackedItems[i];
        if (!item.isVisible) continue;

        const rect = item.el.getBoundingClientRect();

        // Calculate progress relative to viewport center
        const elCenter = rect.top + rect.height * 0.5;
        const vpCenter = windowHeight * 0.5;
        const span = windowHeight * 0.55;
        let progress = (elCenter - vpCenter) / (span || 1);
        progress = Math.max(-1.15, Math.min(1.15, progress));

        // Determine targets by element type
        if (item.type === "row") {
          item.targetRx = progress * 3.2 * rotScale;
          item.targetRy = 0;
          item.targetTz = -Math.abs(progress) * 22 * depthScale;
          item.targetScale = 1 - Math.abs(progress) * 0.018 * depthScale;
        } else if (item.type === "timeline-left") {
          item.targetRx = progress * 2.4 * rotScale;
          item.targetRy = allowY ? -progress * 2.0 * rotScale : 0;
          item.targetTz = -Math.abs(progress) * 18 * depthScale;
          item.targetScale = 1 - Math.abs(progress) * 0.015 * depthScale;
        } else if (item.type === "timeline-right") {
          item.targetRx = progress * 2.4 * rotScale;
          item.targetRy = allowY ? progress * 2.0 * rotScale : 0;
          item.targetTz = -Math.abs(progress) * 18 * depthScale;
          item.targetScale = 1 - Math.abs(progress) * 0.015 * depthScale;
        } else if (item.type === "card") {
          item.targetRx = progress * 2.8 * rotScale;
          item.targetRy = 0;
          item.targetTz = -Math.abs(progress) * 24 * depthScale;
          item.targetScale = 1 - Math.abs(progress) * 0.016 * depthScale;
        } else if (item.type === "cta") {
          item.targetRx = progress * 2.2 * rotScale;
          item.targetRy = 0;
          item.targetTz = -Math.abs(progress) * 18 * depthScale;
          item.targetScale = 1 - Math.abs(progress) * 0.014 * depthScale;
        }

        // Smooth Lerp Interpolation
        item.currentRx += (item.targetRx - item.currentRx) * LERP_FACTOR;
        item.currentRy += (item.targetRy - item.currentRy) * LERP_FACTOR;
        item.currentTz += (item.targetTz - item.currentTz) * LERP_FACTOR;
        item.currentScale += (item.targetScale - item.currentScale) * LERP_FACTOR;

        // Apply via CSS custom properties for hardware-accelerated transform
        item.el.style.setProperty("--gems-rx", item.currentRx.toFixed(2) + "deg");
        item.el.style.setProperty("--gems-ry", item.currentRy.toFixed(2) + "deg");
        item.el.style.setProperty("--gems-tz", item.currentTz.toFixed(2) + "px");
        item.el.style.setProperty("--gems-scale", item.currentScale.toFixed(4));

        // Check if motion has settled
        const delta =
          Math.abs(item.targetRx - item.currentRx) +
          Math.abs(item.targetRy - item.currentRy) +
          Math.abs(item.targetTz - item.currentTz) +
          Math.abs(item.targetScale - item.currentScale);

        if (delta > 0.01) {
          hasUnfinishedMotion = true;
        }
      }

      if (hasUnfinishedMotion) {
        requestAnimationFrame(render);
      } else {
        isAnimating = false; // Sleep until next scroll/resize
      }
    }

    function requestTick() {
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(render);
      }
    }

    // Passive scroll and resize listeners for silky smooth performance
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        updateDeviceMetrics();
        requestTick();
      },
      { passive: true }
    );

    // Initial render
    requestTick();

    // Clean up if navigating away
    window.addEventListener(
      "pagehide",
      function () {
        window.removeEventListener("scroll", requestTick);
        if (observer) observer.disconnect();
      },
      { once: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DPerspectiveScroll);
  } else {
    init3DPerspectiveScroll();
  }
})();
