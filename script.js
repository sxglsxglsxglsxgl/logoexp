(() => {
  const body = document.body;
  if (!body) return;

  const hero = document.querySelector('.hero');
  const grid = document.querySelector('.grid-overlay');
  const svgText = document.querySelector('.logo__svg-text');

  if (!hero || !grid || !svgText) {
    body.classList.remove('no-js');
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsWA = typeof svgText.animate === 'function';

  const cancelAnimations = () => {
    [grid, svgText].forEach((element) => {
      if (!element || typeof element.getAnimations !== 'function') return;
      element.getAnimations().forEach((animation) => {
        try {
          animation.cancel();
        } catch (error) {
          // ignore cancellation failures
        }
      });
    });
  };

  const applyStaticLogo = () => {
    cancelAnimations();
    svgText.style.strokeDasharray = 'none';
    svgText.style.strokeDashoffset = '0';
    svgText.style.fillOpacity = '1';
    svgText.style.strokeOpacity = '0.15';
    grid.style.opacity = '0';
    hero.classList.add('hero--complete');
  };

  if (body.classList.contains('no-js')) {
    body.classList.remove('no-js');
  }

  if (!supportsWA || reduceMotionQuery.matches) {
    applyStaticLogo();
    return;
  }

  const length = Math.max(svgText.getComputedTextLength(), 1);
  svgText.style.strokeDasharray = `${length}`;
  svgText.style.strokeDashoffset = `${length}`;
  svgText.style.fillOpacity = '0';
  svgText.style.strokeOpacity = '1';
  hero.classList.remove('hero--complete');

  const whenFinished = (animation) => {
    if (!animation || typeof animation.finished === 'undefined') {
      return Promise.resolve();
    }
    return animation.finished.catch(() => {});
  };

  const runSequence = async () => {
    try {
      const gridFadeIn = grid.animate(
        [
          { opacity: 0 },
          { opacity: 0.45 }
        ],
        { duration: 600, easing: 'ease-out', fill: 'forwards' }
      );
      await whenFinished(gridFadeIn);

      const strokeAnimation = svgText.animate(
        [
          { strokeDashoffset: length },
          { strokeDashoffset: 0 }
        ],
        { duration: 1600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
      );
      await whenFinished(strokeAnimation);

      const fillAnimation = svgText.animate(
        [
          { fillOpacity: 0, strokeOpacity: 1 },
          { fillOpacity: 1, strokeOpacity: 0.15 }
        ],
        { duration: 750, easing: 'ease-out', fill: 'forwards' }
      );
      await whenFinished(fillAnimation);

      const gridFadeOut = grid.animate(
        [
          { opacity: 0.45 },
          { opacity: 0 }
        ],
        { duration: 900, delay: 150, easing: 'ease-in', fill: 'forwards' }
      );
      await whenFinished(gridFadeOut);

      hero.classList.add('hero--complete');
    } catch (error) {
      applyStaticLogo();
    }
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(runSequence);
  });

  const handleReduceMotionChange = (event) => {
    if (event.matches) {
      applyStaticLogo();
    } else {
      window.location.reload();
    }
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleReduceMotionChange);
  }
})();
