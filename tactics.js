/* ZONE ZÉRO : LE CARREFOUR — contrôleur 3D et interface au tour par tour */
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {W,H,START,EXIT,STYLES,WEAPONS,createState,preview,act,key,distance,analysisOf,visibleZombies,hereStash} from './tactics-rules.js';
import {CELL,toWorld,createDiorama} from './tactics-world.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#435350');scene.fog=new T.FogExp2('#435350',.014);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
renderer.setPixelRatio(Math.min(1.6,window.devicePixelRatio||1));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xb8d4cc,0x303c38,1.9));
const sun=new T.DirectionalLight(0xffd6b0,3.15);
sun.position.set(-28,40,17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;
sun.shadow.camera.left=-68;sun.shadow.camera.right=68;sun.shadow.camera.top=58;sun.shadow.camera.bottom=-58;scene.add(sun);
const haze=new T.AmbientLight(0x8aa49c,.34);scene.add(haze);
const camera=new T.OrthographicCamera(-34,34,20,-20,.1,220);
let zoom=.87,center=new T.Vector3(toWorld(8,10).x,0,toWorld(8,10).z);
const yaw=-.64;
function cameraUpdate(){
 const radius=48,angle=1.03;
 camera.position.set(center.x+radius*Math.sin(yaw)*Math.cos(angle),center.y+radius*Math.sin(angle),center.z+radius*Math.cos(yaw)*Math.cos(angle));
 camera.lookAt(center);
 sun.position.set(center.x-30,45,center.z+20);
 sun.target.position.set(center.x,0,center.z);sun.target.updateMatrixWorld();
}
function resize(){
 const w=innerWidth,h=innerHeight,half=(w<700?22:19)*zoom;
 camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
 renderer.setSize(w,h);cameraUpdate();
}
window.addEventListener('resize',resize);resize();
const world=createDiorama(T,scene);
let state=createState();
world.setupZombies(state);world.setupStashes(state);
function sync(initial=false){
 world.sync(state);
 if(initial){
   for(const unit of [world.player,...world.zombies.values()]){
     if(unit.goalX===undefined)continue;
     unit.group.position.set(unit.goalX,.08,unit.goalZ);
   }
 }
}
sync(true);
const raycaster=new T.Raycaster(),pointer=new T.Vector2();
const pathGroup=new T.Group();scene.add(pathGroup);
const pathMat=new T.MeshBasicMaterial({color:0xb3d9b9,transparent:true,opacity:.67,depthWrite:false,side:T.DoubleSide});
const routeEndMat=new T.MeshBasicMaterial({color:0xf6dfa4,transparent:true,opacity:.86,depthWrite:false,side:T.DoubleSide});
for(let i=0;i<6;i++){
 const obj=new T.Mesh(new T.PlaneGeometry(.45,.45),i===5?routeEndMat:pathMat);
 obj.rotation.x=-Math.PI/2;obj.position.y=.30;pathGroup.add(obj);obj.visible=false;
}
const noiseMat=new T.MeshBasicMaterial({color:0xe1ad6c,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide});
const noiseDisk=new T.Mesh(new T.CircleGeometry(1,80),noiseMat);
noiseDisk.rotation.x=-Math.PI/2;noiseDisk.position.y=.28;scene.add(noiseDisk);noiseDisk.visible=false;
const ringMat=new T.MeshBasicMaterial({color:0xedc18b,transparent:true,opacity:.76,depthWrite:false,side:T.DoubleSide});
const noiseRing=new T.Mesh(new T.RingGeometry(.99,1,80),ringMat);
noiseRing.rotation.x=-Math.PI/2;noiseRing.position.y=.29;scene.add(noiseRing);noiseRing.visible=false;
const hoverMarker=new T.Mesh(new T.RingGeometry(.41,.47,40),new T.MeshBasicMaterial({color:0xffe4b5,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}));
hoverMarker.rotation.x=-Math.PI/2;hoverMarker.position.y=.32;scene.add(hoverMarker);hoverMarker.visible=false;
const soundFlash=new T.Mesh(new T.RingGeometry(.95,1,56),new T.MeshBasicMaterial({color:0xf6b980,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}));
soundFlash.rotation.x=-Math.PI/2;soundFlash.position.y=.35;scene.add(soundFlash);soundFlash.visible=false;
const effects=[];
const audio={context:null,muted:false};
function unlockSound(){if(audio.context)return;
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 try{audio.context=new C();}catch{}}
function tone(freq,duration=.12,gain=.04,type='triangle'){
 const c=audio.context;if(!c||audio.muted||c.state!=='running')return;
 const t=c.currentTime,osc=c.createOscillator(),vol=c.createGain();
 osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(48,freq*.4),t+duration);
 vol.gain.setValueAtTime(gain,t);vol.gain.exponentialRampToValueAtTime(.001,t+duration);
 osc.connect(vol);vol.connect(c.destination);osc.start(t);osc.stop(t+duration);
}
function noise(duration=.16,volume=.15){
 const c=audio.context;if(!c||audio.muted||c.state!=='running')return;
 const length=Math.ceil(c.sampleRate*duration),buf=c.createBuffer(1,length,c.sampleRate),data=buf.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
 const src=c.createBufferSource(),filter=c.createBiquadFilter(),v=c.createGain();src.buffer=buf;
 filter.type='bandpass';filter.frequency.value=1050;v.gain.setValueAtTime(volume,c.currentTime);v.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
 src.connect(filter);filter.connect(v);v.connect(c.destination);src.start();
}
function playEvent(event){
 if(!event)return;
 if(event.type==='kill'||event.type==='shot'){noise(.13,.12);tone(190,.13,.08,'sawtooth')}
 else if(event.type==='bottle'){noise(.2,.17);tone(1180,.22,.04)}
 else if(event.type==='hurt'){tone(105,.31,.11,'sawtooth')}
 else if(event.type==='loot'){tone(660,.16,.045)}
 else if(event.type==='heal'){tone(500,.20,.045)}
 else if(event.type==='reload'){tone(310,.1,.035)}
 else if(event.type==='move'){tone(120,.06,.012)}
}
let hoverCell=null,drag=null,lastPreview=null,lastMessage='',busy=false;
function canvasCell(e){
 const rect=renderer.domElement.getBoundingClientRect();
 pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 // En mode tir, cliquer sur le volume du zombie sélectionne réellement ce zombie,
 // pas une dalle derrière sa silhouette dans la projection isométrique.
 if(state.tool==='shoot'){
   for(const z of state.zombies){
     if(!z.alive||!state.visible.has(key(z.x,z.z)))continue;
     const actor=world.zombies.get(z.id);
     if(actor?.group.visible&&raycaster.intersectObject(actor.group,true).length)return{x:z.x,z:z.z};
   }
 }
 const hit=raycaster.intersectObject(world.clickSurface,false)[0];
 if(!hit)return null;
 const x=Math.round(hit.point.x/CELL+(W-1)/2),z=Math.round(hit.point.z/CELL+(H-1)/2);
 if(x<0||x>=W||z<0||z>=H)return null;
 return{x,z};
}
function showPreview(cell){
 hoverCell=cell;noiseDisk.visible=noiseRing.visible=hoverMarker.visible=false;
 pathGroup.children.forEach(p=>p.visible=false);
 lastPreview=null;
 if(!cell||state.phase!=='playing')return;
 const result=preview(state,cell);lastPreview=result;
 const point=toWorld(cell.x,cell.z);
 hoverMarker.visible=true;hoverMarker.position.set(point.x,.32,point.z);
 hoverMarker.material.color.set(result.valid?0xd4eac7:0xde9a88);
 if(result.valid){
  const destination=toWorld((result.kind==='shoot'?state.player:result.end).x,(result.kind==='shoot'?state.player:result.end).z);
  noiseDisk.visible=noiseRing.visible=true;
  noiseDisk.position.set(destination.x,.27,destination.z);
  noiseRing.position.set(destination.x,.28,destination.z);
  const size=result.radius*CELL;
  noiseDisk.scale.set(size,size,1);noiseRing.scale.set(size,size,1);
  const path=result.route||[];
  for(let i=0;i<Math.min(path.length-1,pathGroup.children.length);i++){
   const obj=pathGroup.children[i],p=toWorld(path[i+1].x,path[i+1].z);
   obj.visible=true;obj.position.set(p.x,.31,p.z);
   obj.material=i===path.length-2?routeEndMat:pathMat;
  }
 }
 $('previewText').textContent=result.valid?result.text:result.reason;
 $('previewText').dataset.valid=result.valid?'yes':'no';
 $('noiseAmount').textContent=result.valid?result.radius+' cases':'—';
}
function announce(message,type='info'){lastMessage=message;
 $('feedback').textContent=message;$('feedback').dataset.type=type}
function flashAt(point,radius){
 const pos=toWorld(point.x,point.z);
 soundFlash.position.set(pos.x,.36,pos.z);
 soundFlash.scale.set(radius*CELL,radius*CELL,1);
 soundFlash.visible=true;soundFlash.material.opacity=.75;
 effects.push({type:'sound',life:.55});
}
function shotTracer(target){
 const a=toWorld(state.player.x,state.player.z),b=toWorld(target.x,target.z);
 const geometry=new T.BufferGeometry().setFromPoints([
   new T.Vector3(a.x,1.28,a.z),new T.Vector3(b.x,1.42,b.z)
 ]);
 const material=new T.LineBasicMaterial({color:0xffdba2,transparent:true,opacity:.95,depthWrite:false});
 const line=new T.Line(geometry,material);scene.add(line);effects.push({type:'tracer',mesh:line,life:.17,max:.17});
 const flash=new T.Sprite(new T.SpriteMaterial({color:0xffd18d,transparent:true,opacity:.82,depthWrite:false}));
 flash.position.set(a.x,1.3,a.z);flash.scale.set(.85,.85,1);scene.add(flash);
 effects.push({type:'flash',mesh:flash,life:.15,max:.15});
}
function updateGame(action){
 if(busy||state.phase!=='playing')return;
 unlockSound();if(audio.context?.state==='suspended')audio.context.resume().catch(()=>{});
 const success=act(state,action);
 if(success&&action.type==='shoot')shotTracer(action.target);
 if(!success){announce(state.events.at(-1)?.text||'Action impossible','warning');showPreview(hoverCell);return}
 busy=true;
 for(const event of state.events)playEvent(event);
 const message=state.events.map(e=>e.text).join('  ')||'Tour terminé';
 announce(message,state.events.some(e=>['hurt','end'].includes(e.type))?'warning':'info');
 if(state.noise)flashAt(state.noise,state.noise.radius);
 sync();
 showPreview(null);render();
 if(state.phase!=='playing'){displayEnd();busy=false;return}
 window.setTimeout(()=>{busy=false;render()},380);
}
function render(){
 $('turnValue').textContent=String(state.turn).padStart(2,'0');
 $('hpValue').textContent='♥'.repeat(state.player.hp)+'♡'.repeat(state.player.maxHp-state.player.hp);
 $('ammoValue').textContent=state.weapon==='pistol'?state.player.mag+' / '+state.player.reserve:state.player.shells+' CART.';
 $('bottleValue').textContent=state.player.bottles;
 $('medkitValue').textContent=state.player.medkits;
 $('staminaValue').textContent=state.player.stamina+' / '+state.player.maxStamina;
 $('staminaFill').style.width=Math.round(state.player.stamina/state.player.maxStamina*100)+'%';
 $('distanceValue').textContent=manhattanUi(state.player,EXIT)+' cases';
 $('seenValue').textContent=visibleZombies(state).length+' visibles';
 const info=analysisOf(state);
 $('intelValue').textContent=state.zombies.filter(z=>z.alive&&z.brain!=='errant'&&state.visible.has(key(z.x,z.z))).length+' en alerte';
 $('weaponValue').textContent=WEAPONS[state.weapon].label;
 $('lootHint').textContent=hereStash(state)?'UNE CACHE SE TROUVE ICI · FOUILLER':'FOUILLE POSSIBLE SUR UNE CASE MARQUÉE';
 $('buttonLoot').disabled=!hereStash(state)||busy;
 $('buttonReload').disabled=state.player.reserve===0||state.player.mag>=6||busy;
 $('buttonHeal').disabled=state.player.medkits===0||state.player.hp===state.player.maxHp||busy;
 $('buttonWait').disabled=busy;
 $('tool-bottle').disabled=state.player.bottles===0||busy;
 $('buttonShotgun').disabled=!state.player.shotgun||busy;
 $('buttonPistol').classList.toggle('active',state.weapon==='pistol');
 $('buttonShotgun').classList.toggle('active',state.weapon==='shotgun');
 for(const id of ['sneak','walk','sprint'])$('mode-'+id).classList.toggle('active',state.mode===id);
 for(const id of ['move','shoot','bottle'])$('tool-'+id).classList.toggle('active',state.tool===id);
 $('missionProgress').style.width=Math.round((state.player.x-START.x)/(EXIT.x-START.x)*100)+'%';
 const visible=visibleZombies(state);
 $('threats').innerHTML=visible.length?visible.map(z=>{
  const status=z.brain==='poursuite'?'POURSUIT':z.brain==='alerte'?'ATTIRÉ PAR UN BRUIT':z.brain==='recherche'?'CHERCHE':'ERRE';
  return '<div class="threat-row"><span class="threat-dot '+(z.brain==='errant'?'calm':'hot')+'"></span><span>INFECTÉ '+String(z.id+1).padStart(2,'0')+'</span><em>'+status+'</em></div>';
 }).join(''):'<div class="threat-empty">Aucun infecté dans votre champ de vision.</div>';
 if(state.noise)$('lastNoise').textContent=state.noise.label.toUpperCase()+' · '+state.noise.radius+' CASES';
 else $('lastNoise').textContent='SILENCE';
}
function manhattanUi(a,b){return Math.abs(a.x-b.x)+Math.abs(a.z-b.z)}
function displayEnd(){
 const won=state.phase==='won';
 $('endOverlay').hidden=false;
 $('endTitle').textContent=won?'SORTIE ATTEINTE':'VOUS N’AVEZ PAS SURVÉCU';
 let rating=state.kills===0?'SANS UN SEUL TIR MORTEL':state.kills<=2?'DISCRÉTION PARTIELLE':'PAR LA FORCE';
 $('endDetail').textContent=(won?'Vous avez franchi le Carrefour. ':'Vous êtes tombé dans le secteur. ')+
 ' '+state.turn+' tours · '+state.kills+' infectés éliminés · '+state.player.hp+' santé restante. Style : '+rating+'.';
}
$('buttonRestart').onclick=()=>window.location.reload();
$('endRestart').onclick=()=>window.location.reload();
$('buttonCenter').onclick=()=>{const p=toWorld(state.player.x,state.player.z);center.set(p.x,0,p.z);cameraUpdate();announce('Vue recentrée. La caméra reste manuelle.')};
$('buttonSound').onclick=()=>{audio.muted=!audio.muted;$('buttonSound').textContent=audio.muted?'SON COUPÉ':'SON ACTIVÉ';unlockSound()};
function tool(name){state.tool=name;render();showPreview(hoverCell)}
function mode(name){state.mode=name;render();showPreview(hoverCell)}
for(const type of ['move','shoot','bottle'])$('tool-'+type).onclick=()=>tool(type);
for(const type of ['sneak','walk','sprint'])$('mode-'+type).onclick=()=>mode(type);
$('buttonReload').onclick=()=>updateGame({type:'reload'});
$('buttonWait').onclick=()=>updateGame({type:'wait'});
$('buttonHeal').onclick=()=>updateGame({type:'heal'});
$('buttonLoot').onclick=()=>updateGame({type:'loot'});
$('buttonPistol').onclick=()=>{state.weapon='pistol';render();showPreview(hoverCell)};
$('buttonShotgun').onclick=()=>{if(state.player.shotgun){state.weapon='shotgun';render();showPreview(hoverCell)}};
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const k=e.key.toLowerCase();
 if(['1','2','3'].includes(k))mode({1:'sneak',2:'walk',3:'sprint'}[k]);
 if(k==='a')tool('move');if(k==='f')tool('shoot');if(k==='b')tool('bottle');
 if(k==='q'){$('buttonPistol').click()}if(k==='d'){$('buttonShotgun').click()}
 if(k==='r')$('buttonReload').click();if(k==='e')$('buttonLoot').click();
 if(k==='h')$('buttonHeal').click();
 if(k==='c')$('buttonCenter').click();
 if(e.code==='Space'){e.preventDefault();$('buttonWait').click()}
});
const canvas=renderer.domElement;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.button!==2)return;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,center:center.clone(),moved:false,button:e.button};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 const cell=canvasCell(e);
 if(!drag){if(!hoverCell||!cell||hoverCell.x!==cell.x||hoverCell.z!==cell.z)showPreview(cell);return}
 if(e.pointerId!==drag.id)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(dx,dy)>7)drag.moved=true;
 if(drag.moved){
  const scale=.043*zoom,horizontal=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),vertical=new T.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  center.copy(drag.center).addScaledVector(horizontal,-dx*scale).addScaledVector(vertical,dy*scale);cameraUpdate();
  showPreview(null);
 }
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 const prior=drag;drag=null;
 if(prior.moved||prior.button===2||state.phase!=='playing')return;
 const cell=canvasCell(e);if(!cell)return;
 updateGame({type:state.tool==='move'?'move':state.tool,target:cell});
});
canvas.addEventListener('pointerleave',()=>{if(!drag)showPreview(null)});
canvas.addEventListener('pointercancel',()=>{drag=null;showPreview(null)});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.60,Math.min(1.75,zoom*(e.deltaY>0?1.075:.92)));resize()},{passive:false});
render();
announce('Explorez les rues, prévoyez le bruit de vos actions et rejoignez la sortie B.');
let lastFrame=performance.now(),elapsed=0;
function animate(now){
 requestAnimationFrame(animate);
 const dt=Math.min(.045,(now-lastFrame)/1000);lastFrame=now;elapsed+=dt;
 world.animate(dt,elapsed);
 for(let i=effects.length-1;i>=0;i--){
   const eff=effects[i];eff.life-=dt;
   if(eff.type==='sound'){
     soundFlash.material.opacity=Math.max(0,eff.life/.55)*.73;
     if(eff.life<=0){soundFlash.visible=false;effects.splice(i,1)}
   }else if(eff.mesh){
     eff.mesh.material.opacity=Math.max(0,eff.life/eff.max)*.95;
     if(eff.life<=0){scene.remove(eff.mesh);eff.mesh.geometry?.dispose();eff.mesh.material.dispose();effects.splice(i,1)}
   }
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
