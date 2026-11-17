const desktopGallery = window.matchMedia('(min-width: 841px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const verticalWorkflow = window.matchMedia('(max-width: 680px)');
function unitRange(value) {
  return Math.min(1, Math.max(0, value));
}

const gallery = document.querySelector('.gallery');
const films = [...gallery.querySelectorAll('.film')];
const filmCopies = films.map(film => film.querySelector('.film-copy'));
const filmFrames = films.map(film => film.querySelector('.film-frame'));
const sidebar = gallery.querySelector('.gallery-active');
const rail = [...gallery.querySelectorAll('.gallery-rail i')];
const workflow = document.querySelector('.workflow-steps');
const workflowItems = [...workflow.children];
let activeFilm = -1;

function setFilm(index) {
  if (activeFilm === index) return;
  const previous = sidebar.lastElementChild;
  const previousOpacity = previous ? getComputedStyle(previous).opacity : '1';
  sidebar.getAnimations({subtree: true}).forEach(animation => animation.cancel());
  if (activeFilm >= 0) {
    rail[activeFilm].classList.remove('is-active');
    films[activeFilm].classList.remove('is-current');
  }
  activeFilm = index;
  rail[index].classList.add('is-active');
  films[index].classList.add('is-current');
  const next = filmCopies[index].cloneNode(true);
  sidebar.replaceChildren(next);
  if (previous && desktopGallery.matches && !reducedMotion.matches) {
    sidebar.prepend(previous);
    const fadeOut = previous.animate([{opacity: previousOpacity}, {opacity: 0}], {
      duration: 180, easing: 'ease-out', fill: 'forwards'
    });
    fadeOut.finished.then(() => previous.remove()).catch(() => {});
    next.animate([
      {opacity: 0, transform: 'translateY(5px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 360, easing: 'cubic-bezier(.22,1,.36,1)'});
  }
}

function sizeGalleryCopy() {
  sidebar.style.minHeight = '';
  if (!desktopGallery.matches) return;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none';
  probe.append(...filmCopies.map(copy => copy.cloneNode(true)));
  sidebar.append(probe);
  const height = Math.max(...[...probe.children].map(copy => copy.getBoundingClientRect().height));
  probe.remove();
  sidebar.style.minHeight = `${Math.ceil(height)}px`;
}

gallery.classList.add('has-gallery');
setFilm(0);
sizeGalleryCopy();
document.fonts.ready.then(sizeGalleryCopy);

let frameRequested = false;
let workflowProgress = 0;

function paintWorkflow(height) {
  if (workflowProgress === 1) return;

  const rect = workflow.getBoundingClientRect();
  const vertical = verticalWorkflow.matches;
  const distance = vertical ? rect.height : height * .68;
  const progress = unitRange((height * .88 - rect.top) / distance);
  if (progress <= workflowProgress) return;

  workflowProgress = progress;
  workflow.style.setProperty('--workflow-progress', workflowProgress.toFixed(4));
  workflowItems.forEach((item, index) => {
    const marker = vertical ? item.offsetTop / rect.height : (index + .2) / (workflowItems.length - .3);
    if (workflowProgress > marker) item.classList.add('is-lit');
  });
}

function paintGallery(height) {
  const galleryRect = gallery.getBoundingClientRect();
  if (galleryRect.top > height || galleryRect.bottom < 0) return;

  // Mobile places the image above its copy; focus the image in the upper reading area.
  const center = height * (desktopGallery.matches ? .53 : .32);
  let nearest = activeFilm;
  let nearestDistance = Infinity;
  films.forEach((film, index) => {
    const rect = (desktopGallery.matches ? film : filmFrames[index]).getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - center);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  });
  setFilm(nearest);
}

function updateViewport() {
  frameRequested = false;
  const height = window.innerHeight;
  if (!reducedMotion.matches) paintWorkflow(height);
  paintGallery(height);
}

function scheduleViewportUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(updateViewport);
}

function syncMotion() {
  if (reducedMotion.matches) {
    document.querySelectorAll('.is-animated').forEach(element => element.classList.remove('is-animated'));
    sidebar.getAnimations({subtree: true}).forEach(animation => animation.cancel());
    sidebar.replaceChildren(filmCopies[activeFilm].cloneNode(true));
  }
  document.body.classList.toggle('motion-enabled', !reducedMotion.matches);
  scheduleViewportUpdate();
}

window.addEventListener('scroll', scheduleViewportUpdate, {passive: true});
window.addEventListener('resize', () => {
  sizeGalleryCopy();
  scheduleViewportUpdate();
}, {passive: true});
window.addEventListener('pageshow', scheduleViewportUpdate);
reducedMotion.addEventListener('change', syncMotion);
syncMotion();

if ('IntersectionObserver' in window) {
  const onReveal = (entries, observer) => {
    for (const entry of entries) {
      const minimumVisible = entry.target.matches('.film, .delivery-visual') ? .2 : .15;
      if (!entry.isIntersecting || entry.intersectionRatio < minimumVisible) continue;
      entry.target.classList.add('is-revealed');
      if (!reducedMotion.matches) entry.target.classList.add('is-animated');
      observer.unobserve(entry.target);
    }
  };
  const reveal = new IntersectionObserver(onReveal, {rootMargin: '0px 0px -10% 0px', threshold: .15});
  const revealImages = new IntersectionObserver(onReveal, {rootMargin: '0px', threshold: .2});
  const motionTargets = '.heading-mask, #philosophy .manifesto, .gallery-sidebar, .about-intro, #contact';
  document.querySelectorAll(motionTargets).forEach(element => reveal.observe(element));
  document.querySelectorAll('.film, .delivery-visual').forEach(element => revealImages.observe(element));

  const hero = document.querySelector('#hero');
  const heroImage = hero.querySelector('.hero-image');
  if (heroImage.complete) {
    reveal.observe(hero);
  } else {
    heroImage.addEventListener('load', () => reveal.observe(hero), {once: true});
  }
  document.body.classList.add('can-reveal');
}

const dialog = document.querySelector('#site-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogLabel = document.querySelector('#dialog-label');
const dialogTitle = document.querySelector('#dialog-title');

function openDialog({label, title, image}) {
  dialogLabel.textContent = label;
  dialogTitle.textContent = title;
  dialogImage.hidden = !image;
  if (image) {
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt;
  } else {
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
  }
  dialog.showModal();
}

dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

filmFrames.forEach((button, index) => {
  const image = button.querySelector('img');
  button.addEventListener('click', () => {
    openDialog({
      label: filmCopies[index].querySelector('.eyebrow').textContent,
      title: filmCopies[index].querySelector('h3').textContent,
      image
    });
  });
});
