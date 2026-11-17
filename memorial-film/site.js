const filmGallery = document.querySelector('.film-types');
const filmButtons = [...filmGallery.querySelectorAll('.film-select')];
let currentFilm;

function selectFilm(selectedButton) {
  if (currentFilm === selectedButton) return;

  currentFilm = selectedButton;
  for (const button of filmButtons) {
    const isCurrent = button === selectedButton;
    button.setAttribute('aria-expanded', String(isCurrent));
    button.closest('.film-type').classList.toggle('is-current', isCurrent);
  }
}

selectFilm(filmButtons[0]);
filmGallery.classList.add('is-interactive');
for (const button of filmButtons) {
  button.hidden = false;
  button.addEventListener('click', () => selectFilm(button));
}

filmGallery.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return;

  const button = event.target.closest('.film-select');
  if (button) selectFilm(button);
});

const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!motion.matches && 'IntersectionObserver' in window) {
  const opening = '.prologue-content, .origins .connected-list';
  const openingMargin = Math.round(window.innerHeight * .28);

  const viewportObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        entry.target.classList.add('is-pending');
      } else if (!entry.target.matches(opening)) {
        entry.target.classList.remove('is-pending');
      }
    }
  });

  const openingObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.remove('is-pending');
    }
  }, { rootMargin: `0px 0px -${openingMargin}px 0px` });

  for (const block of document.querySelectorAll('.hero, .hero-caption, .reveal')) {
    const top = block.getBoundingClientRect().top;
    const isOpening = block.matches(opening);
    const revealEdge = window.innerHeight - (isOpening ? openingMargin : 0);
    if (top >= revealEdge || (top >= 0 && block.matches('.prologue-content'))) {
      block.classList.add('is-pending');
    }
    viewportObserver.observe(block);
    if (isOpening) openingObserver.observe(block);
  }
}
