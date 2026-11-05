/* Guest interactions. Personal content and integrations live in content.js. */
(() => {
  'use strict';
  const config = window.WEDDING_CONFIG;
  if (!config) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Navigation remains available before the invitation is opened.
  const menuButton = $('#menu-toggle');
  const navigation = $('#primary-nav');
  function closeMenu(returnFocus = false) {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    if (returnFocus) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation?.classList.toggle('open', open);
  });
  navigation?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (menuButton?.getAttribute('aria-expanded') === 'true' && !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  $('#open-invitation')?.addEventListener('click', () => {
    document.body.classList.add('invitation-open');
    const welcome = $('#welcome');
    welcome?.focus({ preventScroll: true });
    welcome?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
  });

  // Native modal semantics plus explicit focus trapping and focus return.
  const lightbox = $('#lightbox');
  const gallery = config.photos?.gallery || [];
  let activePhoto = 0;
  let photoOpener = null;
  let modalScroll = null;
  let originalOverflow = '';
  function showPhoto(index) {
    if (!gallery.length || !lightbox) return;
    activePhoto = (index + gallery.length) % gallery.length;
    const photo = gallery[activePhoto];
    const container = $('#lightbox-image');
    container.replaceChildren();
    container.classList.toggle('is-placeholder', !photo.src);
    if (photo.src) {
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.alt || photo.label || '';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        const notice = document.createElement('span');
        notice.className = 'lightbox-placeholder-label';
        notice.textContent = `${photo.label || '[GALLERY PHOTO]'} — image unavailable`;
        container.replaceChildren(notice);
        container.classList.add('is-placeholder');
      }, { once: true });
      container.append(image);
    } else {
      const label = document.createElement('span');
      label.className = 'lightbox-placeholder-label';
      label.textContent = photo.label || `[GALLERY PHOTO ${activePhoto + 1}]`;
      const hint = document.createElement('small');
      hint.textContent = 'A place for your photograph';
      container.append(label, hint);
    }
    $('#lightbox-caption').textContent = photo.caption || photo.label || '';
    $('#lightbox-counter').textContent = `${activePhoto + 1} / ${gallery.length}`;
  }
  $$('[data-gallery-index]').forEach(button => button.addEventListener('click', () => {
    if (!lightbox || !gallery.length) return;
    photoOpener = button;
    modalScroll = { x: window.scrollX, y: window.scrollY };
    originalOverflow = document.body.style.overflow;
    showPhoto(Number(button.dataset.galleryIndex));
    lightbox.showModal();
    document.body.style.overflow = 'hidden';
    $('#lightbox-close').focus({ preventScroll: true });
  }));
  $('#lightbox-close')?.addEventListener('click', () => lightbox.close());
  $('#lightbox-prev')?.addEventListener('click', () => showPhoto(activePhoto - 1));
  $('#lightbox-next')?.addEventListener('click', () => showPhoto(activePhoto + 1));
  lightbox?.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  lightbox?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      lightbox.close();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activePhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Tab') {
      const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]', lightbox).filter(element => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  lightbox?.addEventListener('close', () => {
    document.body.style.overflow = originalOverflow;
    photoOpener?.focus({ preventScroll: true });
    if (modalScroll && (window.scrollX !== modalScroll.x || window.scrollY !== modalScroll.y)) window.scrollTo({ left: modalScroll.x, top: modalScroll.y, behavior: 'instant' });
  });

  // Scratch paths are normalized so a resize preserves the reveal progress.
  const scratchCard = $('#scratch-card');
  const canvas = $('#scratch-canvas');
  const revealButton = $('#reveal-button');
  const scratchStatus = $('#scratch-status');
  const context = canvas?.getContext('2d');
  let revealed = false;
  let pointerId = null;
  let paths = [];
  let currentPath = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  const touched = new Set();
  const gridColumns = 32;
  const gridRows = 20;
  const brushRadius = 23;
  function revealScratch() {
    if (revealed) return;
    revealed = true;
    scratchCard?.classList.add('is-revealed');
    canvas?.classList.add('is-revealed');
    if (canvas) {
      canvas.style.pointerEvents = 'none';
      // Keep the transparent overlay responsive after the reveal as well.
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    if (revealButton) {
      revealButton.textContent = 'Note revealed';
      revealButton.setAttribute('aria-pressed', 'true');
    }
    if (scratchStatus) scratchStatus.textContent = 'The note is revealed.';
  }
  function erasePath(path) {
    if (!context || !path.length) return;
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = brushRadius * 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(path[0].x * canvasWidth, path[0].y * canvasHeight);
    if (path.length === 1) {
      context.arc(path[0].x * canvasWidth, path[0].y * canvasHeight, brushRadius, 0, Math.PI * 2);
      context.fill();
    } else {
      for (let i = 1; i < path.length; i += 1) context.lineTo(path[i].x * canvasWidth, path[i].y * canvasHeight);
      context.stroke();
    }
  }
  function paintCover() {
    if (!context || revealed) return;
    // The absolutely positioned canvas fills the padding box, excluding borders.
    const width = scratchCard.clientWidth;
    const height = scratchCard.clientHeight;
    if (!width || !height) return;
    canvasWidth = width;
    canvasHeight = height;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasWidth * scale);
    canvas.height = Math.round(canvasHeight * scale);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#25372F';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.strokeStyle = 'rgba(250,248,243,0.045)';
    context.lineWidth = 1;
    for (let x = -canvasHeight; x < canvasWidth + canvasHeight; x += 14) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x + canvasHeight, canvasHeight); context.stroke();
    }
    context.strokeStyle = 'rgba(250,248,243,0.25)';
    context.strokeRect(16, 16, canvasWidth - 32, canvasHeight - 32);
    context.fillStyle = '#FAF8F3';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '30px "Cormorant Garamond", Georgia, serif';
    context.fillText('A little surprise', canvasWidth / 2, canvasHeight / 2 - 15);
    context.font = '500 11px "DM Sans", Arial, sans-serif';
    context.fillText('SCRATCH TO REVEAL', canvasWidth / 2, canvasHeight / 2 + 22);
    paths.forEach(erasePath);
  }
  function markGrid(x, y) {
    for (let row = 0; row < gridRows; row += 1) {
      for (let column = 0; column < gridColumns; column += 1) {
        const dx = ((column + 0.5) / gridColumns - x) * canvasWidth;
        const dy = ((row + 0.5) / gridRows - y) * canvasHeight;
        if (dx * dx + dy * dy <= brushRadius * brushRadius) touched.add(row * gridColumns + column);
      }
    }
  }
  function scratchAt(event) {
    if (!currentPath || revealed) return;
    const bounds = canvas.getBoundingClientRect();
    const point = { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) };
    const previous = currentPath[currentPath.length - 1];
    currentPath.push(point);
    erasePath(previous ? [previous, point] : [point]);
    if (previous) {
      const distance = Math.hypot((point.x - previous.x) * canvasWidth, (point.y - previous.y) * canvasHeight);
      const steps = Math.max(1, Math.ceil(distance / (brushRadius / 2)));
      for (let step = 0; step <= steps; step += 1) markGrid(previous.x + (point.x - previous.x) * step / steps, previous.y + (point.y - previous.y) * step / steps);
    } else markGrid(point.x, point.y);
    if (touched.size / (gridColumns * gridRows) > 0.42) revealScratch();
  }
  if (canvas && context && scratchCard) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', event => {
      if (revealed || pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointerId = event.pointerId;
      currentPath = [];
      paths.push(currentPath);
      canvas.setPointerCapture(pointerId);
      scratchAt(event);
    });
    canvas.addEventListener('pointermove', event => { if (event.pointerId === pointerId) scratchAt(event); });
    const stopScratch = event => {
      if (event.pointerId !== pointerId) return;
      if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
      pointerId = null;
      currentPath = null;
    };
    canvas.addEventListener('pointerup', stopScratch);
    canvas.addEventListener('pointercancel', stopScratch);
    canvas.addEventListener('lostpointercapture', () => { pointerId = null; currentPath = null; });
    const observer = new ResizeObserver(paintCover);
    observer.observe(scratchCard);
    document.fonts?.ready.then(paintCover);
    paintCover();
  } else if (scratchCard) revealScratch();
  revealButton?.setAttribute('aria-pressed', String(revealed));
  revealButton?.addEventListener('click', revealScratch);
  scratchCard?.setAttribute('tabindex', '0');
  scratchCard?.setAttribute('aria-label', 'Scratch card. Press Enter or Space to reveal the note, or use the Reveal note button.');
  scratchCard?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); revealScratch(); }
  });

  $$('[data-calendar-id]').forEach(button => button.addEventListener('click', () => {
    const item = config.events.find(event => event.id === button.dataset.calendarId);
    const status = document.getElementById(`event-status-${button.dataset.calendarId}`);
    if (!item || !window.WeddingCalendar) return;
    try {
      const result = window.WeddingCalendar.download(item, config.couple);
      if (status) status.textContent = result.ok ? 'Your calendar file is ready. Check your downloads.' : result.error;
    } catch {
      if (status) status.textContent = 'The calendar file could not be created. Please check the event details in content.js.';
    }
  }));
  $$('[data-directions-id]').forEach(button => button.addEventListener('click', () => {
    const status = document.getElementById(`event-status-${button.dataset.directionsId}`);
    if (status) status.textContent = 'Add the venue address or directions URL in content.js to enable directions.';
  }));

  // JSON RSVP integration is opt-in; the default preview never transmits data.
  const form = $('#rsvp-form');
  if (!form) return;
  const settings = config.rsvp || {};
  const submitButton = $('#rsvp-submit');
  const attendingFields = $('#attending-fields');
  const guestName = $('#guest-name');
  const partySize = $('#party-size');
  const meal = $('#meal');
  const formStatus = $('#form-status');
  const errorSummary = $('#form-error-summary');
  const endpoint = typeof settings.endpoint === 'string' ? settings.endpoint.trim() : '';
  const isDemo = !endpoint;
  const maxParty = Number.isSafeInteger(settings.invitedPartySize) && settings.invitedPartySize > 0 ? settings.invitedPartySize : 1;
  let pending = false;
  let submitted = false;
  let lastAttempt = 0;
  const submitLabel = isDemo ? 'Preview my reply' : 'Send my reply';
  submitButton.textContent = submitLabel;
  if (partySize) { partySize.min = '1'; partySize.max = String(maxParty); partySize.step = '1'; }
  const notice = $('#demo-notice');
  if (notice) {
    notice.hidden = !isDemo;
    notice.textContent = 'Preview mode: replies are not sent or stored. The owner can connect an RSVP service in content.js.';
  }
  function selectedAttendance() { return $('[name="attendance"]:checked', form)?.value || ''; }
  function setError(id, message) {
    const target = document.getElementById(`${id}-error`);
    if (target) { target.textContent = message; target.hidden = !message; }
    const fields = id === 'attendance' ? $$('[name="attendance"]', form) : [document.getElementById(id)].filter(Boolean);
    fields.forEach(field => {
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    });
  }
  function clearErrors() {
    ['guest-name', 'attendance', 'party-size', 'meal'].forEach(id => setError(id, ''));
    errorSummary.textContent = '';
    errorSummary.hidden = true;
  }
  function syncAttendance() {
    const accepts = selectedAttendance() === 'accepts';
    attendingFields.hidden = !accepts;
    attendingFields.disabled = !accepts;
    if (partySize) partySize.required = accepts;
    if (!accepts) { setError('party-size', ''); setError('meal', ''); }
  }
  $$('[name="attendance"]', form).forEach(input => input.addEventListener('change', syncAttendance));
  syncAttendance();
  form.addEventListener('input', event => {
    if (submitted && !isDemo) return;
    formStatus.textContent = '';
    formStatus.classList.remove('is-success');
    const id = event.target.name === 'attendance' ? 'attendance' : event.target.id;
    if (['guest-name', 'attendance', 'party-size', 'meal'].includes(id)) setError(id, '');
    if (submitted && isDemo) { submitted = false; submitButton.textContent = submitLabel; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || (submitted && !isDemo)) return;
    clearErrors();
    formStatus.textContent = '';
    formStatus.classList.remove('is-success');
    const errors = [];
    const name = guestName.value.trim();
    const attendance = selectedAttendance();
    const party = Number(partySize.value);
    if (!name) errors.push({ id: 'guest-name', message: 'Please enter your name.' });
    else if (name.length > 160) errors.push({ id: 'guest-name', message: 'Please use 160 characters or fewer for your name.' });
    if (!attendance) errors.push({ id: 'attendance', message: 'Please choose whether you can attend.' });
    if (attendance === 'accepts' && (!Number.isInteger(party) || party < 1 || party > maxParty)) errors.push({ id: 'party-size', message: `Please enter a number of guests from 1 to ${maxParty}.` });
    if (attendance === 'accepts' && meal?.required && !meal.value) errors.push({ id: 'meal', message: 'Please choose a meal preference.' });
    if (errors.length) {
      errors.forEach(error => setError(error.id, error.message));
      errorSummary.textContent = `Please check ${errors.length === 1 ? 'the highlighted field' : 'the highlighted fields'}.`;
      errorSummary.hidden = false;
      const first = errors[0].id === 'attendance' ? $('[name="attendance"]', form) : document.getElementById(errors[0].id);
      first.focus();
      return;
    }
    if (isDemo) {
      submitted = true;
      formStatus.textContent = 'Preview complete. Your RSVP has not been sent or stored.';
      formStatus.classList.add('is-success');
      submitButton.textContent = 'Preview complete';
      return;
    }
    let destination;
    try {
      destination = new URL(endpoint, window.location.href);
      if (destination.protocol !== 'https:' && destination.origin !== window.location.origin) throw new Error('Unsafe endpoint');
      if (!['https:', 'http:'].includes(destination.protocol) || destination.username || destination.password) throw new Error('Invalid endpoint');
    } catch {
      errorSummary.hidden = false;
      errorSummary.textContent = 'The RSVP service is not configured correctly. Your reply has not been sent. Please contact the invitation host.';
      return;
    }
    const payload = { guestName: name, attendance };
    if (attendance === 'accepts') {
      payload.partySize = party;
      if (meal?.value) payload.meal = meal.value;
      const dietary = $('#dietary')?.value.trim();
      const accessibility = $('#accessibility')?.value.trim();
      if (dietary) payload.dietaryRequirements = dietary;
      if (accessibility) payload.accessibilityRequests = accessibility;
    }
    pending = true;
    lastAttempt += 1;
    const attempt = lastAttempt;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending your reply…';
    form.setAttribute('aria-busy', 'true');
    formStatus.textContent = 'Sending your reply…';
    // Keep the pending payload stable, prevent accidental edits, and never persist it.
    const interactiveFields = $$('input, select, textarea', form);
    const disabledBefore = interactiveFields.map(field => field.disabled);
    interactiveFields.forEach(field => { field.disabled = true; });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(destination.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal
      });
      let data = null;
      try { data = await response.json(); } catch { /* Acknowledgement must be explicit. */ }
      if (!response.ok || data?.success !== true) throw new Error('Service did not acknowledge the RSVP');
      submitted = true;
      formStatus.textContent = attendance === 'accepts' ? 'Thank you. Your RSVP has been received. We look forward to celebrating with you.' : 'Thank you for letting us know. Your RSVP has been received.';
      formStatus.classList.add('is-success');
      submitButton.textContent = 'Reply received';
    } catch {
      if (attempt !== lastAttempt) return;
      formStatus.textContent = '';
      errorSummary.hidden = false;
      errorSummary.textContent = 'We could not confirm your RSVP. Your details are still here. Please try again, or contact the invitation host.';
      submitButton.textContent = 'Try sending again';
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      interactiveFields.forEach((field, index) => { field.disabled = submitted || disabledBefore[index]; });
      submitButton.disabled = submitted;
    }
  });
})();


