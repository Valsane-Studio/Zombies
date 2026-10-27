/* ZONE ZÉRO — LA PHARMACIE : commandes de jeu et prévision avant chaque tour. */
import * as G from './pharmacy-engine.js';
import {makePainter} from './pharmacy-board.js';
const $=id=>document.getElementById(id);
const canvas=$('board'),painter=makePainter(canvas);
let state=G.createState(),pending=null,prediction=null,hover=null,hoverPrediction=null;
let animation=null,soundOn=true,audio=null,clock=0;
const posFromEvent=e=>{
 const r=canvas.getBoundingClientRect();
 const x=Math.floor((e.clientX-r.left)/r.width*G.W),y=Math.floor((e.clientY-r.top)/r.height*G.H);
 return G.inside(x,y)?{x,y}:null;
};
function actionFor(cell){
 if(!cell)return null;
 if(state.tool==='bottle')return{type:'bottle',to:cell};
 if(state.tool==='shoot')return{type:'shoot',to:cell};
 const isAction=G.DOORS.some(d=>d.x===cell.x&&d.y===cell.y)||
  (cell.x===G.PANEL.x&&cell.y===G.PANEL.y)||(cell.x===G.MED.x&&cell.y===G.MED.y);
 if(isAction)return{type:'interact',at:cell};
 return{type:'move',to:cell};
}
function label(a){
 if(!a)return'Choisissez une action sur le plateau';
 if(a.type==='move')return G.MODES[state.mode].name+' vers ('+(a.to.x+1)+' · '+String.fromCharCode(65+a.to.y)+')';
 if(a.type==='bottle')return'Lancer une bouteille';
 if(a.type==='shoot')return'Tirer sur cet infecté';
 if(a.type==='reload')return'Recharger le pistolet';
 if(a.type==='heal')return'Utiliser un pansement';
 if(a.type==='wait')return'Attendre un tour';
 if(a.type==='interact'){
  const d=G.doorAt(a.at.x,a.at.y);if(d)return'Ouvrir '+d.name.toLowerCase();
  if(a.at.x===G.PANEL.x&&a.at.y===G.PANEL.y)return'Déclencher l’alarme';
  if(a.at.x===G.MED.x&&a.at.y===G.MED.y)return'Récupérer les médicaments';
 }
 return'Action en préparation';
}
function clearPending(){pending=null;prediction=null;$('confirm').disabled=true;$('cancel').disabled=true;$('pendingLabel').textContent='Aucune action préparée'}
function forecast(a){
 if(!a||state.status!=='playing')return null;
 return G.simulate(state,a);
}
function explain(preview,action){
 if(!preview||!action){
  $('previewTitle').textContent='Choisissez une action sur le plateau';
  $('previewDetails').textContent='Survolez une case pour anticiper les déplacements des zombies. Cliquez, puis confirmez votre décision.';
  $('previewNoise').textContent='—';$('previewAlert').textContent='—';$('previewRisk').textContent='—';return;
 }
 const {valid,next,events,noise}=preview;
 $('previewTitle').textContent=label(action);
 if(!valid){
  $('previewDetails').textContent=events[0]||'Cette action est impossible.';
  $('previewNoise').textContent='—';$('previewAlert').textContent='—';$('previewRisk').textContent='IMPOSSIBLE';return;
 }
 const moved=next.zombies.filter((z,i)=>z.hp>0&&(z.x!==state.zombies[i].x||z.y!==state.zombies[i].y)).length;
 const newlyAlert=next.zombies.filter((z,i)=>z.hp>0&&z.phase!=='errant'&&state.zombies[i].phase==='errant').length;
 const hurt=Math.max(0,state.player.hp-next.player.hp);
 $('previewDetails').textContent=(events.join(' ')||'Tour prévu.')+' '+moved+' infecté'+(moved>1?'s':'')+' se déplacera'+(moved>1?'ont':'')+' après votre action.';
 $('previewNoise').textContent=noise?noise.radius+' cases':'SILENCE';
 $('previewAlert').textContent=String(newlyAlert);
 $('previewRisk').textContent=hurt?'−'+hurt+' PV':'AUCUN';
 $('previewRisk').style.color=hurt?'#eeab91':'#cbe2ba';
}
function prepare(a){
 if(state.status!=='playing'||animation)return;
 const result=forecast(a);if(!result)return;
 if(!result.valid){
  explain(result,a);$('log').textContent=result.events[0]||'Action impossible.';
  clearPending();hover=a.to||a.at||null;hoverPrediction=result;draw();return;
 }
 pending=a;prediction=result;hover=a.to||a.at||null;
 $('pendingLabel').textContent=label(a);
 $('confirm').disabled=false;$('cancel').disabled=false;
 explain(result,a);draw();
}
function playSound(type){
 if(!soundOn)return;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type==='shoot'?'sawtooth':'triangle';
  let freq=type==='shoot'?165:type==='bottle'?930:type==='interact'?450:330;
  osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(type==='shoot'?56:freq*.56,t+.14);
  gain.gain.setValueAtTime(type==='shoot'?.10:.047,t);
  gain.gain.exponentialRampToValueAtTime(.001,t+.15);
  osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.16);
 }catch{}
}
function confirm(){
 if(!pending||!prediction?.valid||state.status!=='playing'||animation)return;
 const old=G.clone(state),action=pending;
 if(!G.apply(state,action)){$('log').textContent=state.events[0];clearPending();return}
 clearPending();hoverPrediction=null;hover=null;
 playSound(action.type);$('log').textContent=state.events.join('  ');
 animation={previous:old,began:performance.now(),duration:470};
 updateUI();draw();
 if(state.status!=='playing')setTimeout(showEnd,560);
}
function showEnd(){
 const won=state.status==='won';
 $('endTitle').textContent=won?'MISSION ACCOMPLIE':'MISSION ÉCHOUÉE';
 const style=state.kills===0?'sans tuer un seul infecté':state.kills===1?'avec un infecté neutralisé':'avec '+state.kills+' infectés neutralisés';
 $('endText').textContent=won?
  'Vous avez rapporté les médicaments en '+state.turn+' tours, '+style+'. Santé restante : '+state.player.hp+'/3. Essayez une autre approche pour améliorer votre itinéraire.':
  'Votre survivant est tombé après '+state.turn+' tours. Les zombies sont prévisibles : essayez d’abord de les attirer ailleurs ou de changer de porte.';
 $('end').hidden=false;
}
function renderNearby(){
 const root=$('nearby'),actions=G.nearby(state);
 if(!actions.length){root.innerHTML='<p class="empty-action">Approchez-vous d’une porte, du boîtier d’alarme ou des médicaments pour agir.</p>';return}
 root.innerHTML='';
 for(const a of actions){const b=document.createElement('button');b.textContent='✦ '+a.label;b.onclick=()=>prepare(a);root.appendChild(b)}
}
function updateUI(){
 const p=state.player;
 $('turn').textContent=String(state.turn).padStart(2,'0');
 $('health').textContent=('♥ '.repeat(p.hp)+'♡ '.repeat(3-p.hp)).trim();
 $('objectiveState').textContent=p.medicine?'EN POSSESSION':'À RÉCUPÉRER';
 $('ammo').innerHTML=p.ammo+' <span>/ '+p.reserve+'</span>';
 $('bottles').textContent=p.bottles;$('medkits').textContent=p.medkits;$('stamina').textContent=p.stamina+' / 4';
 const inside=G.isPharmacy(p.x,p.y)||p.medicine;
 for(const [id,done,current] of [['task1',inside,!inside],['task2',p.medicine,inside&&!p.medicine],['task3',state.status==='won',p.medicine]]){
  const el=$(id);el.classList.toggle('done',done);el.classList.toggle('current',!done&&current);
  el.querySelector('i').textContent=done?'✓':'○';
 }
 for(const el of document.querySelectorAll('[data-mode]'))el.classList.toggle('selected',el.dataset.mode===state.mode);
 for(const el of document.querySelectorAll('[data-tool]'))el.classList.toggle('selected',el.dataset.tool===state.tool);
 $('toolBottle').disabled=p.bottles<=0;$('toolShoot').disabled=p.ammo<=0;
 $('reload').disabled=p.ammo===4||p.reserve===0;
 $('heal').disabled=p.hp===3||p.medkits<=0;
 renderNearby();
}
function draw(){
 const shown=pending?prediction:hoverPrediction,act=pending||hover&&actionFor(hover);
 let t=1,previous=null;
 if(animation){
  const elapsed=performance.now()-animation.began;
  t=Math.min(1,elapsed/animation.duration);t=1-Math.pow(1-t,3);
  previous=animation.previous;
  if(t>=1)animation=null;
 }
 painter.render(state,{preview:shown,action:shown?.valid?act:null,hover,p:state.player,previous,progress:t,clock});
}
function changeMode(mode){
 state.mode=mode;clearPending();hoverPrediction=hover?forecast(actionFor(hover)):null;
 updateUI();explain(hoverPrediction,hover&&actionFor(hover));draw();
}
function changeTool(tool){
 state.tool=tool;clearPending();hoverPrediction=hover?forecast(actionFor(hover)):null;
 updateUI();explain(hoverPrediction,hover&&actionFor(hover));draw();
}
canvas.addEventListener('pointermove',e=>{
 if(pending||animation)return;
 const cell=posFromEvent(e);
 if(cell&&hover&&cell.x===hover.x&&cell.y===hover.y)return;
 hover=cell;const action=actionFor(cell);
 hoverPrediction=forecast(action);explain(hoverPrediction,action);draw();
});
canvas.addEventListener('pointerleave',()=>{
 if(pending)return;hover=null;hoverPrediction=null;explain(null,null);draw();
});
canvas.addEventListener('click',e=>{
 if(animation)return;
 const cell=posFromEvent(e),action=actionFor(cell);
 if(action)prepare(action);
});
$('confirm').onclick=confirm;$('cancel').onclick=()=>{clearPending();explain(null,null);draw()};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>changeMode(b.dataset.mode);
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>changeTool(b.dataset.tool);
$('wait').onclick=()=>prepare({type:'wait'});
$('reload').onclick=()=>prepare({type:'reload'});
$('heal').onclick=()=>prepare({type:'heal'});
$('restartTop').onclick=()=>window.location.reload();$('retry').onclick=()=>window.location.reload();
$('helpToggle').onclick=()=>{$('help').hidden=false};
$('closeHelp').onclick=$('closeHelpBottom').onclick=()=>{$('help').hidden=true};
$('help').addEventListener('click',e=>{if(e.target===$('help'))$('help').hidden=true});
$('sound').onclick=()=>{
 soundOn=!soundOn;$('sound').textContent=soundOn?'♫ SON : ON':'SON : OFF';
};
window.addEventListener('keydown',e=>{
 if(!$('help').hidden){if(e.key==='Escape')$('help').hidden=true;return}
 if(!$('end').hidden)return;
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const k=e.key.toLowerCase();
 if(k==='enter'){e.preventDefault();confirm()}
 if(k==='escape'){clearPending();explain(null,null);draw()}
 if(k==='1')changeMode('sneak');if(k==='2')changeMode('walk');if(k==='3')changeMode('sprint');
 if(k==='a')changeTool('move');if(k==='b')changeTool('bottle');if(k==='f')changeTool('shoot');
 if(e.code==='Space'){e.preventDefault();prepare({type:'wait'})}
 if(k==='r')prepare({type:'reload'});if(k==='h')prepare({type:'heal'});
});
function tick(now){clock=now/1000;if(animation)draw();window.requestAnimationFrame(tick)}
updateUI();draw();window.requestAnimationFrame(tick);
