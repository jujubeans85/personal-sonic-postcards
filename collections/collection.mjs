import {cards, selectCard, shareURL} from '../shared/postcard-catalog.mjs';
import {createImagePreview} from '../shared/image-preview.mjs';
const $ = id => document.getElementById(id);
const choice = $('choice');
const unavailable = document.createElement('option');
unavailable.value = ''; unavailable.textContent = 'Choose a postcard'; unavailable.disabled = true;
choice.append(unavailable);
for (const card of cards) { const option = document.createElement('option'); option.value = card.slug; option.textContent = card.title; choice.append(option); }
let current;
function show(slug) {
  $('audio').pause();
  current = selectCard(cards, slug);
  $('card').hidden = !current;
  $('status').textContent = current ? '' : 'That postcard is not in this collection. Choose one below.';
  if (!current) { choice.value = ''; $('audio').removeAttribute('src'); $('audio').load(); return; }
  choice.value = current.slug;
  $('card-title').textContent = current.title;
  $('front').src = current.front; $('back').src = current.back; $('audio').src = current.audio;
}
choice.addEventListener('change', () => { history.replaceState(null, '', shareURL(location.href, choice.value)); show(choice.value); });
window.addEventListener('popstate', () => show(new URL(location.href).searchParams.get('t')));
$('audio').addEventListener('error', () => { $('status').textContent = 'Audio could not load. The postcard artwork is still available.'; });
$('copy').addEventListener('click', async () => {
  if (!current) return;
  const url = shareURL(location.href, current.slug);
  try { await navigator.clipboard.writeText(url); $('status').textContent = 'Postcard link copied.'; }
  catch { window.prompt('Copy this postcard link:', url); }
});
$('print').addEventListener('click', () => window.print());
for (const person of ['cbo','mmi']) {
  for (let i = 1; i <= 9; i++) {
    const back = i === 9;
    const path = back ? `print/backs/back_${person}_A6_300dpi.jpg` : `print/fronts/front_${person}_${String(i).padStart(2,'0')}_A6_300dpi.jpg`;
    const a = document.createElement('a'); a.href = path;
    const img = document.createElement('img'); img.src = path; img.loading = 'lazy'; img.alt = `${person === 'cbo' ? 'Chloe' : 'Mimi'} ${back ? 'back' : 'front '+i}`;
    a.append(img); $('prints').append(a);
  }
}
const preview = createImagePreview($('preview'));
function previewError(message) { $('preview').hidden = true; $('photo-status').textContent = message; }
$('photo').addEventListener('change', () => {
  const file = $('photo').files[0]; if (!file) return;
  try { preview.show(file, previewError); $('preview').hidden = false; $('photo-status').textContent = 'Local preview only. Nothing uploaded or saved.'; }
  catch (error) { $('photo-status').textContent = error.message; }
});
function clearPreview() { preview.clear(); $('preview').hidden = true; $('photo').value = ''; $('photo-status').textContent = ''; }
$('clear').addEventListener('click', clearPreview);
window.addEventListener('pagehide', clearPreview);
show(new URL(location.href).searchParams.get('t'));
