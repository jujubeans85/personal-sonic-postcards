import importlib.util
from pathlib import Path
import tempfile
import unittest
from urllib.parse import unquote
spec=importlib.util.spec_from_file_location('indexer',Path(__file__).resolve().parents[1]/'tools/index-library.py')
indexer=importlib.util.module_from_spec(spec);spec.loader.exec_module(indexer)
class IndexTests(unittest.TestCase):
 def test_preserves_media_and_resolves_nested_special_filenames(self):
  import json
  with tempfile.TemporaryDirectory() as d:
   root=Path(d); media=root/'media';media.mkdir();(media/'nested').mkdir()
   (media/'one # %.WAV').write_bytes(b'fixture');(media/'nested/one # %.WAV').write_bytes(b'fixture2')
   (media/'empty.mp3').touch(); (media/'ignore.txt').write_text('ignore')
   out=root/'catalogue'; self.assertEqual(indexer.build(media,out),2)
   tracks=json.loads((out/'playlist_all.json').read_text());self.assertEqual(len({t['id'] for t in tracks}),2)
   for t in tracks:self.assertEqual((out/unquote(t['file'])).read_bytes(), (media/t['source_path']).read_bytes())
   before=(out/'library.json').read_bytes()
   with self.assertRaises(FileExistsError):indexer.build(media,out)
   self.assertEqual(before,(out/'library.json').read_bytes())
 def test_output_parent_alias_has_resolvable_relative_links(self):
  import json
  with tempfile.TemporaryDirectory() as d:
   root=Path(d).resolve(); real=root/'real';real.mkdir()
   alias=root/'alias';alias.symlink_to(real,target_is_directory=True)
   media=root/'media';media.mkdir();(media/'song.wav').write_bytes(b'fixture')
   out=alias/'catalogue';indexer.build(media,out)
   track=json.loads((out/'playlist_all.json').read_text())[0]
   self.assertEqual((out/unquote(track['file'])).read_bytes(),b'fixture')
 def test_symlink_escape(self):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d);(r/'media').mkdir();(r/'outside.wav').write_bytes(b'fixture');(r/'media/escape.wav').symlink_to(r/'outside.wav')
   with self.assertRaises(ValueError):indexer.build(r/'media',r/'out')
   self.assertFalse((r/'out').exists())
if __name__=='__main__':unittest.main()
