class LogoReveal {
  constructor() {
    this.logo = document.querySelector('[data-logo]');
    if (!this.logo) {
      return;
    }

    this.grid = this.logo.querySelector('[data-logo-grid]');
    this.svgText = this.logo.querySelector('[data-logo-svg-text]');

    if (!this.grid || !this.svgText) {
      return;
    }

    this.activeAnimations = [];
    this.runId = null;

    this.handlePreferenceChange = this.handlePreferenceChange.bind(this);

    this.init();
  }

  init() {
    if (typeof this.grid.animate !== 'function' || typeof this.svgText.animate !== 'function') {
      this.showStatic();
      return;
    }

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.handlePreferenceChange(this.motionQuery);

    if (typeof this.motionQuery.addEventListener === 'function') {
      this.motionQuery.addEventListener('change', this.handlePreferenceChange);
    } else if (typeof this.motionQuery.addListener === 'function') {
      this.motionQuery.addListener(this.handlePreferenceChange);
    }
  }

  handlePreferenceChange(event) {
    const prefersReduced = event.matches;
    this.stopCurrentRun();

    if (prefersReduced) {
      this.showStatic();
    } else {
      this.startAnimation();
    }
  }

  stopCurrentRun() {
    this.runId = null;
    if (this.activeAnimations.length) {
      for (const animation of this.activeAnimations) {
        try {
          animation.cancel();
        } catch (error) {
          // ignore cancellation issues
        }
      }
      this.activeAnimations.length = 0;
    }
  }

  trackAnimation(animation) {
    if (!animation) {
      return;
    }

    this.activeAnimations.push(animation);
    const remove = () => {
      const index = this.activeAnimations.indexOf(animation);
      if (index >= 0) {
        this.activeAnimations.splice(index, 1);
      }
    };
    animation.addEventListener('finish', remove, { once: true });
    animation.addEventListener('cancel', remove, { once: true });
  }

  async ensureFontsLoaded(runId) {
    if (document.fonts && typeof document.fonts.ready === 'object') {
      try {
        await document.fonts.ready;
      } catch (error) {
        // ignore font readiness issues
      }
    }

    return this.runId === runId;
  }

  async prepareStroke(runId) {
    const fontsOk = await this.ensureFontsLoaded(runId);
    if (!fontsOk || this.runId !== runId) {
      return 0;
    }

    const textLength = this.svgText.getComputedTextLength();
    const dashLength = Math.max(Math.ceil(textLength), 1);

    this.svgText.style.strokeDasharray = `${dashLength}`;
    this.svgText.style.strokeDashoffset = `${dashLength}`;
    this.svgText.style.fillOpacity = '0';
    this.svgText.style.strokeOpacity = '1';

    return dashLength;
  }

  async startAnimation() {
    this.stopCurrentRun();
    const runId = Symbol('logo-run');
    this.runId = runId;

    this.logo.classList.add('is-animating');
    this.logo.dataset.state = 'animating';
    this.grid.style.opacity = '0';
    this.svgText.style.opacity = '1';

    const dashLength = await this.prepareStroke(runId);
    if (!dashLength || this.runId !== runId) {
      return;
    }

    const gridFadeIn = this.grid.animate(
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      {
        duration: 600,
        easing: 'ease-out',
        fill: 'forwards'
      }
    );
    this.trackAnimation(gridFadeIn);

    try {
      await gridFadeIn.finished;
    } catch (error) {
      if (this.runId !== runId) {
        return;
      }
    }

    if (this.runId !== runId) {
      return;
    }

    const strokeDraw = this.svgText.animate(
      [
        { strokeDashoffset: dashLength },
        { strokeDashoffset: 0 }
      ],
      {
        duration: 1600,
        easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
        fill: 'forwards'
      }
    );
    this.trackAnimation(strokeDraw);

    try {
      await strokeDraw.finished;
    } catch (error) {
      if (this.runId !== runId) {
        return;
      }
    }

    if (this.runId !== runId) {
      return;
    }

    const fillIn = this.svgText.animate(
      [
        { fillOpacity: 0 },
        { fillOpacity: 1 }
      ],
      {
        duration: 520,
        easing: 'ease-out',
        fill: 'forwards'
      }
    );

    const gridFadeOut = this.grid.animate(
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      {
        duration: 720,
        easing: 'ease-in',
        delay: 180,
        fill: 'forwards'
      }
    );

    this.trackAnimation(fillIn);
    this.trackAnimation(gridFadeOut);

    await Promise.allSettled([
      fillIn.finished,
      gridFadeOut.finished
    ]);

    if (this.runId !== runId) {
      return;
    }

    this.logo.classList.remove('is-animating');
    this.logo.dataset.state = 'final';
    this.svgText.style.strokeDashoffset = '0';
    this.svgText.style.fillOpacity = '1';
    this.svgText.style.strokeOpacity = '0';
    this.grid.style.opacity = '0';
    this.runId = null;
  }

  showStatic() {
    this.logo.classList.remove('is-animating');
    this.logo.dataset.state = 'final';
    this.grid.style.opacity = '0';
    this.svgText.style.opacity = '0';
    this.svgText.style.strokeDasharray = 'none';
    this.svgText.style.strokeDashoffset = '0';
    this.svgText.style.fillOpacity = '1';
    this.svgText.style.strokeOpacity = '0';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new LogoReveal();
});
