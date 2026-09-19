import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cards, slugify, selectCard, shareURL} from '../shared/postcard-catalog.mjs';
import {createImagePreview} from '../shared/image-preview.mjs';
test('legacy slugs and prefixed share URLs preserve other route parameters', () => {
  assert.equal(slugify("Mimi's Drift"), 'mimis-drift');
  assert.equal(shareURL('https://example.org/personal-sonic-postcards/collections/?profile=mmi#art','vintage-2'), 'https://example.org/personal-sonic-postcards/collections/?profile=mmi&t=vintage-2#art');
  assert.equal(selectCard(cards, 'VINTAGE-2'), cards[1]);
  assert.equal(selectCard(cards, 'missing'), null);
  assert.throws(() => shareURL('javascript:alert(1)', 'x'));
});
test('every copied asset retains its source SHA-256 and every card asset exists', () => {
  const manifest = JSON.parse(readFileSync(new URL('../docs/stage-6-preservation.json', import.meta.url)));
  for (const row of manifest.copied_assets) {
    const data = readFileSync(new URL('../'+row.destination, import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'), row.sha256, row.destination);
  }
  for (const card of cards) for (const key of ['front','back','audio']) assert.ok(existsSync(new URL('../collections/'+card[key],import.meta.url)));
});
test('preview owns one URL and rejects invalid files before allocation', () => {
  let count = 0; const revoked = [];
  const urls = {createObjectURL: () => 'blob:'+ ++count, revokeObjectURL: url => revoked.push(url)};
  const image = {removeAttribute() {delete this.src;}, naturalWidth:100,naturalHeight:100};
  const preview = createImagePreview(image, {urls});
  assert.throws(() => preview.show({type:'text/html',size:10}));
  assert.throws(() => preview.show({type:'image/png',size:13*1024*1024}));
  assert.equal(count,0);
  preview.show({type:'image/png',size:100});
  const staleError = image.onerror;
  preview.show({type:'image/jpeg',size:100});
  staleError(); assert.equal(image.src,'blob:2');
  assert.deepEqual(revoked,['blob:1']);
  preview.dispose(); preview.dispose();
  assert.deepEqual(revoked,['blob:1','blob:2']);
});
test('oversized decoded or corrupt images release their URL', () => {
  const revoked=[]; const image={removeAttribute(){delete this.src;},naturalWidth:8000,naturalHeight:8000};
  const preview=createImagePreview(image,{urls:{createObjectURL:()=> 'blob:x',revokeObjectURL:x=>revoked.push(x)}});
  let error=''; preview.show({type:'image/png',size:100},m=>error=m); image.onload();
  assert.match(error,/24 megapixels/); assert.equal(revoked.length,1);
  preview.show({type:'image/png',size:100},m=>error=m); image.onerror();
  assert.match(error,/could not be opened/); assert.equal(revoked.length,2);
});
