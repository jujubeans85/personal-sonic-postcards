import {loadHandwriting,drawHandwriting} from '../../shared/handwriting.mjs';
import {drawFinishedLettering} from '../../shared/lettering-finishes.mjs';
const entries=[['original','Original','Your captured marks, in warm ink.'],['outline','Outline','Open centres, keeping the character of each letter.'],['inflated','Inflated outline','A fuller outline with the centre left clear.'],['worn','Worn / aged','Broken, faded marks; the paper shows through.']];
try{
 await loadHandwriting();
 for(const [finish,title,note] of entries){
  const section=document.createElement('section'),heading=document.createElement('h2'),canvas=document.createElement('canvas'),p=document.createElement('p');heading.textContent=title;p.textContent=note;
  canvas.width=1600;canvas.height=340;const c=canvas.getContext('2d');c.font='110px sans-serif';c.fillStyle='#67412e';c.textBaseline='top';
  const raw=(ctx,...args)=>drawHandwriting(ctx,...args,'adam-capture03');raw.face='adam-capture03';
  drawFinishedLettering(c,'CRATE JUICE',55,50,1490,160,1,finish,300/25.4,raw);
  c.font='40px sans-serif';drawFinishedLettering(c,'SOME WORDS STAY WITH YOU.',55,230,1490,65,1,finish,300/25.4,raw);
  section.append(heading,canvas,p);document.getElementById('proofs').append(section);
 }
}catch(e){document.getElementById('proof-status').textContent=e.message;}
