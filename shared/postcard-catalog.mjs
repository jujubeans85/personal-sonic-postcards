// Canonical recipient catalogue; slug behavior retained from 111PLURAT.
export function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export function shareURL(location, slug) {
  const url = new URL(location);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Serve the collection over HTTP(S).');
  if (!slug) throw new Error('A postcard slug is required.');
  url.searchParams.set('t', slug);
  return url.href;
}
export function selectCard(cards, slug) {
  return slug ? cards.find(card => card.slug.toLowerCase() === slug.toLowerCase()) || null : cards[0] || null;
}
export const cards = Array.from({length: 8}, (_, i) => ({
  slug: `vintage-${i + 1}`, title: `Vintage postcard ${i + 1}`,
  front: `./vintage/vintage_postcards/fronts/front${i + 1}.jpg`,
  back: `./vintage/vintage_postcards/backs/back${i + 1}.jpg`,
  audio: `./vintage/vintage_audio/tone${i + 1}.wav`
}));
