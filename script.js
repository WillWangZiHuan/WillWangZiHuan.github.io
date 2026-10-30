const dialog = document.querySelector('#figure-dialog');
const figureImage = document.querySelector('#figure-image');
const figureCaption = document.querySelector('#figure-caption');
const figureTitle = document.querySelector('#figure-title');

function openImage(src, alt, caption, title) {
  figureImage.src = src;
  figureImage.alt = alt;
  figureCaption.textContent = caption;
  figureTitle.textContent = title;
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
}

document.querySelectorAll('[data-figure]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    openImage(link.href, link.getAttribute('aria-label'), link.dataset.caption,
      link.dataset.title);
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());

dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

dialog.addEventListener('close', () => {
  document.documentElement.style.overflow = '';
});

const photoViewer = document.querySelector('.photo-viewer');
const photoStack = document.querySelector('.photo-stack');
const photoCards = [...document.querySelectorAll('.photo-card')];
const photoPlay = document.querySelector('#photo-play');
const photoMeta = document.querySelector('.photo-meta');
const photoCaption = document.querySelector('#photo-caption');
const photoCount = document.querySelector('#photo-count');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let photoIndex = 0;
let photoPaused = reducedMotion.matches;
let photoHovered = false;
let photoVisible = false;
let photoTurning = false;
let photoTimer;

function updatePhoto() {
  photoCards.forEach((card, index) => {
    const depth = (index - photoIndex + photoCards.length) % photoCards.length;
    card.dataset.depth = depth;
    card.setAttribute('aria-hidden', String(depth !== 0));
  });
  photoCaption.textContent = photoCards[photoIndex].dataset.label;
  photoCount.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photoCards.length).padStart(2, '0')}`;
}

function turnPhoto(direction) {
  if (photoTurning) return;
  if (!reducedMotion.matches) {
    photoTurning = true;
    const outgoing = photoCards[photoIndex];
    outgoing.style.setProperty('--turn-direction', direction);
    outgoing.classList.add('is-turning');
  }
  photoIndex = (photoIndex + direction + photoCards.length) % photoCards.length;
  updatePhoto();
}

photoStack.addEventListener('animationend', event => {
  if (event.animationName !== 'turn-photo') return;
  event.target.classList.remove('is-turning');
  photoTurning = false;
});

function syncPhotoPlayback() {
  window.clearTimeout(photoTimer);
  photoPlay.textContent = photoPaused ? 'Play' : 'Pause';
  photoPlay.setAttribute('aria-label', photoPaused ? 'Play slideshow' : 'Pause slideshow');
  photoMeta.setAttribute('aria-live', photoPaused ? 'polite' : 'off');
  if (!photoPaused && !photoHovered && photoVisible && !document.hidden && !dialog.open) {
    photoTimer = window.setTimeout(() => {
      turnPhoto(1);
      syncPhotoPlayback();
    }, 4500);
  }
}

function browsePhoto(direction) {
  photoPaused = true;
  turnPhoto(direction);
  syncPhotoPlayback();
}

document.querySelector('#photo-prev').addEventListener('click', () => browsePhoto(-1));
document.querySelector('#photo-next').addEventListener('click', () => browsePhoto(1));
photoPlay.addEventListener('click', () => {
  photoPaused = !photoPaused;
  syncPhotoPlayback();
});
photoViewer.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  browsePhoto(event.key === 'ArrowRight' ? 1 : -1);
});
photoViewer.addEventListener('focusin', event => {
  if (event.target === photoPlay) return;
  photoPaused = true;
  syncPhotoPlayback();
});
photoViewer.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'mouse') return;
  photoHovered = true;
  syncPhotoPlayback();
});
photoViewer.addEventListener('pointerleave', () => {
  photoHovered = false;
  syncPhotoPlayback();
});

let photoPointer;
let photoSwiped = false;
photoStack.addEventListener('pointerdown', event => {
  photoPointer = { x: event.clientX, y: event.clientY };
  photoSwiped = false;
});
photoStack.addEventListener('pointerup', event => {
  if (!photoPointer) return;
  const dx = event.clientX - photoPointer.x;
  const dy = event.clientY - photoPointer.y;
  photoPointer = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    photoSwiped = true;
    browsePhoto(dx < 0 ? 1 : -1);
  }
});
photoStack.addEventListener('pointercancel', () => { photoPointer = null; });
photoStack.addEventListener('click', () => {
  if (photoSwiped) { photoSwiped = false; return; }
  photoPaused = true;
  syncPhotoPlayback();
  const card = photoCards[photoIndex];
  const img = card.querySelector('img');
  openImage(img.src, img.alt, card.dataset.caption, 'Moments along the way');
});

const photoObserver = new IntersectionObserver(([entry]) => {
  photoVisible = entry.isIntersecting;
  syncPhotoPlayback();
}, { threshold: .25 });
photoObserver.observe(photoViewer);
document.addEventListener('visibilitychange', syncPhotoPlayback);
dialog.addEventListener('close', syncPhotoPlayback);
reducedMotion.addEventListener('change', () => {
  photoPaused = reducedMotion.matches;
  photoCards.forEach(card => card.classList.remove('is-turning'));
  photoTurning = false;
  syncPhotoPlayback();
});
syncPhotoPlayback();
