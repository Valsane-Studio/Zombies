/* ZONE ZÉRO · Une seule rue à explorer en temps réel.
   Vue perspective en plongée, personnage 3D animé, pistolet, aucun ennemi. */
import * as T from 'three';
import {createCivilian} from './civilian.js';
import {createClickNavigation} from './click-navigation.js';
import {createImmersiveCamera} from './immersive-camera.js';
import {createImmersiveAmbience} from './immersive-ambience.js';
import {buildStreet} from './street-world.js';

const $=id=>document.getElementById(id);
const scene=new T.Scene();
scene.background=new T.Color('#6b7975');
scene.fog=new T.FogExp2('#61716c',.0087);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<850?1.15:1.65));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.24;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.setClearColor('#64746e');
$('scene').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(44,innerWidth/innerHeight,.1,250);
const hemi=new T.HemisphereLight(0xbfd6d1,0x41433a,2.04);scene.add(hemi);
scene.add(new T.AmbientLight(0x8d9a91,.33));
const sun=new T.DirectionalLight(0xffddbd,3.5);
sun.position.set(-20,35,15);
sun.castShadow=true;
sun.shadow.mapSize.set(window.innerWidth<850?1024:2048,window.innerWidth<850?1024:2048);
sun.shadow.normalBias=.035;
sun.shadow.bias=-.0001;
sun.shadow.camera.left=-39;sun.shadow.camera.right=39;
sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;
sun.shadow.camera.near=1;sun.shadow.camera.far=110;
scene.add(sun);scene.add(sun.target);
const world=buildStreet(T,scene);
const ambience=createImmersiveAmbience({host:window});
$('loadingText').textContent='Préparation des déplacements et des éclairages…';

const playerRoot=new T.Group();
playerRoot.position.set(-12,.12,0);
scene.add(playerRoot);
const player={root:playerRoot,velocity:new T.Vector3(),aim:new T.Vector3(0,0,-1),ammo:12,reloading:0,shootCD:0,moving:false,running:false,step:0,shots:0};
// Personnage civil, de taille inférieure aux voitures et toujours armé.
const character=createCivilian(T,playerRoot);
const pistolRig=character.pistol;

// Vue immersive derrière le personnage. La direction du mouvement oriente la caméra,
 // avec rotation indépendante possible par Alt + glisser ou bouton central.
 const immersiveCamera=createImmersiveCamera(T,{
  camera,player:playerRoot,world,canvas:renderer.domElement,sun
 });
 immersiveCamera.update(.016,{force:true});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
const keys=new Set();
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k))e.preventDefault();
 keys.add(k);
 if(e.repeat)return;
 if(k==='r')reload();
 if(k==='escape'){navigation.clear();note('DÉPLACEMENT ANNULÉ',1)}
 if(k==='h')document.body.classList.toggle('ui-hidden');
 if(k==='c'){immersiveCamera.reset();immersiveCamera.update(.016,{force:true});note('VUE RECENTRÉE',1)}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
function fireTowards(point,immediate=false){
 if(!point)return;
 navigation.faceAt(point,true);
 player.aim.set(-Math.sin(playerRoot.rotation.y),0,-Math.cos(playerRoot.rotation.y));
 // Lever le bras avant le premier coup de feu ; ne pas tirer avec le bras baissé.
 character.setAiming(true);
 if(immediate)character.aimImmediately();
 if(character.readyToFire())shoot();
}
function exploreAction(id){
 if(id==='inaccessible'){note('Cet endroit est inaccessible.',2.5);return}
 ambience.cue(id);
 const message=world.building.activate(id,playerRoot);
 if(message)note(message,4);
 // Ouvrir la porte donne accès au hall ; le personnage franchit ensuite naturellement l'entrée.
 if(id==='entrance'&&world.building.entranceOpen){
  navigation.moveTo(new T.Vector3(-17,.12,-26),false);
 }
}
const navigation=createClickNavigation(T,{
 world,scene,player:playerRoot,camera,canvas:renderer.domElement,onFire:fireTowards,onInteract:exploreAction
});
// Les navigateurs n'autorisent le son qu'après une interaction volontaire.
renderer.domElement.addEventListener('pointerdown',()=>ambience.activate(),{once:true});
const audioToggle=$('audioToggle');
audioToggle?.addEventListener('click',()=>{
 const on=ambience.setEnabled(!ambience.enabled);
 audioToggle.textContent=on?'♫ SON : ON':'♫ SON : OFF';
 audioToggle.setAttribute('aria-pressed',String(on));
});

let noticeExpiry=0,worldClock=0;
function note(message,seconds=2.5){
 const el=$('notice');el.textContent=message;el.hidden=false;noticeExpiry=worldClock+seconds;
}
function reload(){
 if(player.reloading>0||player.ammo===12)return;
 player.reloading=1.15;$('state').textContent='RECHARGEMENT';
 note('RECHARGEMENT EN COURS',1.15);
}
let audioContext=null;
function gunSound(){
 try{
   const Context=window.AudioContext||window.webkitAudioContext;
   if(!Context)return;
   if(!audioContext)audioContext=new Context();
   if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
   const t=audioContext.currentTime,osc=audioContext.createOscillator(),amp=audioContext.createGain();
   osc.type='sawtooth';osc.frequency.setValueAtTime(185,t);osc.frequency.exponentialRampToValueAtTime(57,t+.16);
   amp.gain.setValueAtTime(.10,t);amp.gain.exponentialRampToValueAtTime(.001,t+.16);
   osc.connect(amp);amp.connect(audioContext.destination);osc.start(t);osc.stop(t+.16);
   const length=Math.floor(audioContext.sampleRate*.14);
   const buffer=audioContext.createBuffer(1,length,audioContext.sampleRate);
   const samples=buffer.getChannelData(0);
   for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/length,1.4);
   const source=audioContext.createBufferSource(),gain=audioContext.createGain();
   source.buffer=buffer;gain.gain.value=.23;
   source.connect(gain);gain.connect(audioContext.destination);source.start();
 }catch{}
}
const effects=[];
const bulletMaterial=new T.LineBasicMaterial({color:0xffd1a0,transparent:true,opacity:.96,depthWrite:false});
const hitMaterial=new T.MeshBasicMaterial({color:0x1c2422,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide});
const muzzleMaterial=new T.MeshBasicMaterial({color:0xffd092,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide});
function shoot(){
 if(player.shootCD>0||player.reloading>0)return;
 if(player.ammo<=0){reload();return}
 player.ammo--;player.shootCD=.22;player.shots++;
 gunSound();
 // Balle envoyée dans la direction réellement indiquée par le pointeur.
 const axis=player.aim.clone().normalize();
 const barrel=character.muzzle();
 const end=barrel.clone().add(axis.clone().multiplyScalar(19));
 end.y=Math.max(.05,barrel.y-.09*19);
 // Mur proche : raccourcir visuellement si la ligne arrive en façade.
 const toEnd=new T.Vector3();
 toEnd.copy(end);
 for(let t=1;t<65;t++){
   const f=t/65;
   const at=barrel.clone().lerp(end,f);
   if(world.collides(at.x,at.z,.08)){toEnd.copy(at);break}
 }
 const geo=new T.BufferGeometry().setFromPoints([barrel,toEnd]);
 const tracer=new T.Line(geo,bulletMaterial.clone());scene.add(tracer);
 effects.push({mesh:tracer,life:.115,max:.115});
 const flash=new T.Sprite(new T.SpriteMaterial({color:0xffd0a1,transparent:true,opacity:.97,depthWrite:false}));
 flash.position.copy(barrel);flash.scale.set(.8,.8,1);scene.add(flash);
 effects.push({mesh:flash,life:.09,max:.09});
 const light=new T.PointLight(0xffbb66,10,4);light.position.copy(barrel);scene.add(light);
 effects.push({light,life:.075,max:.075});
 if(toEnd.y<.4){
   const decal=new T.Mesh(new T.RingGeometry(.05,.13,14),hitMaterial.clone());
   decal.rotation.x=-Math.PI/2;decal.position.set(toEnd.x,.06,toEnd.z);
   scene.add(decal);effects.push({mesh:decal,life:9,max:9});
 }
 character.recoil();
 updateAmmo();
}
function updateAmmo(){
 $('ammo').innerHTML=player.ammo+' <small>/ 12</small>';
 $('bullets').textContent=Array.from({length:12},(_,i)=>i<player.ammo?'●':'○').join(' ');
 $('state').textContent=player.reloading>0?'RECHARGEMENT':player.ammo===0?'CHARGEUR VIDE':'PRÊT';
}
updateAmmo();
// Sur écran tactile, un appui au sol commande le déplacement ; le bouton déclenche un tir.
$('mobileFire').addEventListener('pointerdown',e=>{
 e.preventDefault();
 const point=navigation.getAim()||new T.Vector3(playerRoot.position.x+1,0,playerRoot.position.z-3);
 fireTowards(point,true);
});
let lastZoneText='',curiosityNoticed=false,upstairsSound=false;
function updateExplorationLabel(){
 const level=world.building.level,inRoom=world.building.inside;
 const px=playerRoot.position.x,pz=playerRoot.position.z;
 if(!curiosityNoticed&&level===0&&!inRoom&&Math.abs(px+17)<15&&pz<-9&&pz>-28){
  curiosityNoticed=true;
  note('Une lumière vacille au premier étage. Quelqu’un serait-il encore ici ?',5.8);
  ambience.cue('metal');
 }
 if(curiosityNoticed&&!upstairsSound&&level===1){
  upstairsSound=true;
  note('Un grincement retentit derrière une porte.',4.2);
  ambience.cue('metal');
 }
 const nearCafe=Math.abs(playerRoot.position.x+17)<30&&playerRoot.position.z<-12;
 const title=level===2?'SUR LE TOIT':
  level===1?(world.building.apartmentOpen?'APPARTEMENT VISITABLE':'PREMIER ÉTAGE · PALIER'):
  inRoom?'HALL DE L’IMMEUBLE':nearCafe?'CAFÉ NORD · IMMEUBLE ACCESSIBLE':'EXPLORATION LIBRE';
 const hint=level===2?'Redescendez ou observez les alentours':
  level===1?(world.building.apartmentOpen?'Découvrez les objets et le passage vers le toit':'La porte de l’appartement peut s’ouvrir'):
  inRoom?'Escalier et fenêtre arrière à découvrir':
  nearCafe?'Cliquez sur la porte principale pour entrer':'Explorez la rue abandonnée';
 if(title===lastZoneText)return;
 lastZoneText=title;
 $('zoneStatus').textContent=title;$('zoneHint').textContent=hint;
}
let last=performance.now(),loadingDone=false;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.045,(now-last)/1000);last=now;worldClock+=dt;
 if(!loadingDone&&worldClock>.55){loadingDone=true;$('loading').hidden=true}
 if(noticeExpiry>0&&worldClock>noticeExpiry){$('notice').hidden=true;noticeExpiry=0}
 const travel=navigation.update(dt,worldClock,keys.has('shift'));
 world.building.update(dt,playerRoot);
 updateExplorationLabel();
 player.moving=travel.moving||world.building.transitioning;player.running=travel.running;
 // Quand le clic droit est relâché, le bras reprend sa position naturelle.
 character.setAiming(travel.shooting);
 character.animate(dt,worldClock,player.moving,player.running);
 ambience.update(dt,{moving:player.moving,running:player.running,
   inside:world.building.inside,level:world.building.level});
 player.shootCD=Math.max(0,player.shootCD-dt);
 if(player.reloading>0){
  player.reloading-=dt;
  if(player.reloading<=0){player.reloading=0;player.ammo=12;updateAmmo();note('CHARGEUR RECHARGÉ',1.4)}
 }
 for(let i=effects.length-1;i>=0;i--){
  const fx=effects[i];fx.life-=dt;
  if(fx.mesh){
   fx.mesh.material.opacity=Math.max(0,fx.life/fx.max)*.96;
   if(fx.mesh.isSprite)fx.mesh.scale.multiplyScalar(1+dt*3);
  }
  if(fx.light)fx.light.intensity=Math.max(0,fx.life/fx.max)*10;
  if(fx.life<=0){
   if(fx.mesh){scene.remove(fx.mesh);fx.mesh.geometry?.dispose();fx.mesh.material.dispose()}
   if(fx.light)scene.remove(fx.light);effects.splice(i,1);
  }
 }
 immersiveCamera.update(dt,{
  moving:player.moving,running:player.running,
  arrowLeft:keys.has('arrowleft'),arrowRight:keys.has('arrowright'),
  arrowUp:keys.has('arrowup'),arrowDown:keys.has('arrowdown')
 });
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
