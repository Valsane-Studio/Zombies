/* ZONE ZÉRO · Étude d'un salon abandonné réellement explorable en 3D.
   Vue subjective, déplacement libre fluide, souris / tactile, interactions physiques.
   Aucun panorama 2D : objets, végétation et meubles sont tous géométriques. */
import * as T from 'three';
import {buildAbandonedRoom} from './room-world.js';
import {populateRoomNature} from './room-nature.js';
import {createImmersiveAmbience} from './immersive-ambience.js';

const $=id=>document.getElementById(id);
const scene=new T.Scene();
scene.background=new T.Color('#62756a');
scene.fog=new T.FogExp2('#77857a',.018);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<850?1.15:1.65));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.20;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.setClearColor('#62756a');
$('scene').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,.07,100);
camera.position.set(-3.14,1.61,3.60);
const hemi=new T.HemisphereLight(0xd8dfc8,0x4d463d,1.9);scene.add(hemi);
const ambient=new T.AmbientLight('#a7a292',.27);scene.add(ambient);
const sun=new T.DirectionalLight('#ffdbad',3.55);
sun.position.set(-3.1,9.1,-10.5);
sun.target.position.set(.2,.5,.8);scene.add(sun.target);
sun.castShadow=true;
sun.shadow.mapSize.set(innerWidth<850?1024:2048,innerWidth<850?1024:2048);
sun.shadow.bias=-.00020;sun.shadow.normalBias=.035;
Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:35});
scene.add(sun);
const warm=new T.PointLight('#f2d7af',14,10,2);
warm.position.set(-1.1,3.25,-4.25);scene.add(warm);
const fill=new T.PointLight('#c0cbb5',3.4,9,2);
fill.position.set(-5.05,2.85,2.8);scene.add(fill);
const room=buildAbandonedRoom(T,scene);
const nature=populateRoomNature(T,scene,room);
const sound=createImmersiveAmbience({host:window});
const player={pos:new T.Vector3(-3.14,0,3.6),yaw:-.14,pitch:-.075,
 velocity:new T.Vector3(),running:false,moving:false};
const keys=new Set();const pointerLocked=()=>document.pointerLockElement===renderer.domElement;
const state={started:false,paused:false,controls:'desktop',ambient:true,inspecting:false};
const targetVec=new T.Vector3(),forwardVec=new T.Vector3(),raycaster=new T.Raycaster();
const center=new T.Vector2(0,0);
let hovered=null,frameTime=performance.now(),worldTime=0,noticeExpires=0,lastStep=0;
const pickup=$('interact'),notice=$('storyNotice'),prompt=$('contextPrompt'),dot=$('reticle'),overlay=$('startOverlay');
const ui={setActive(v){
 state.started=v;
 overlay.hidden=v;document.body.classList.toggle('playing',v);
 $('cursorHint').textContent=v?'BOUGER LA SOURIS POUR REGARDER':'CLIQUER POUR ENTRER';
}};
function notify(msg,seconds=5){
 notice.textContent=msg;notice.hidden=false;noticeExpires=worldTime+seconds;
}
function start(){
 sound.activate();
 state.paused=false;
 ui.setActive(true);
 if(matchMedia('(pointer:fine)').matches && renderer.domElement.requestPointerLock){
  renderer.domElement.requestPointerLock().catch?.(()=>{});
 }
}
$('startButton').addEventListener('click',start);
overlay.addEventListener('click',e=>{if(e.target===overlay)start()});
renderer.domElement.addEventListener('click',()=>{
 if(!state.started){start();return}
 if(!pointerLocked()&&matchMedia('(pointer:fine)').matches){
  renderer.domElement.requestPointerLock?.().catch?.(()=>{});
  return;
 }
 if(hovered)interact();
});
document.addEventListener('pointerlockchange',()=>{
 if(!state.started)return;
 const locked=pointerLocked();
 $('lockHint').textContent=locked?'SOURIS ACTIVE':'CLIQUEZ DANS LA PIÈCE POUR REPRENDRE LE REGARD';
});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 keys.add(k);
 if(!state.started){
  if(k==='enter'){start()}return
 }
 if(k==='e'||k==='f')interact();
 if(k==='h'){document.body.classList.toggle('hide-chrome')}
 if(k==='m'){
  state.ambient=sound.setEnabled(!state.ambient);
  $('audioButton').textContent=state.ambient?'SON : ON':'SON : OFF';
 }
 if(k==='escape'&&!pointerLocked())state.paused=true;
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();state.paused=true});
document.addEventListener('focus',()=>{state.paused=false});
document.addEventListener('mousemove',e=>{
 if(!state.started||state.inspecting)return;
 if(pointerLocked()){
  player.yaw-=e.movementX*.0022;
  player.pitch=T.MathUtils.clamp(player.pitch-e.movementY*.0021,-1.17,1.16);
 }
});
let dragging=false,lastDrag={x:0,y:0};
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&pointerLocked())return;
 if(!state.started||e.pointerType==='mouse'&&matchMedia('(pointer:fine)').matches)return;
 dragging=true;lastDrag={x:e.clientX,y:e.clientY};
 renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!dragging||!state.started||pointerLocked())return;
 const dx=e.clientX-lastDrag.x,dy=e.clientY-lastDrag.y;
 player.yaw-=dx*.006;player.pitch=T.MathUtils.clamp(player.pitch-dy*.005,-1.17,1.16);
 lastDrag.x=e.clientX;lastDrag.y=e.clientY;
});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('wheel',e=>{
 if(!state.started)return;
 e.preventDefault();
 camera.fov=T.MathUtils.clamp(camera.fov+Math.sign(e.deltaY)*2,46,81);camera.updateProjectionMatrix();
},{passive:false});
const mobile={x:0,y:0};
const pad=$('touchPad'),stick=$('touchStick');
function touchMove(e){
 const r=pad.getBoundingClientRect();
 let x=(e.clientX-r.left-r.width/2)/(r.width*.5),y=(e.clientY-r.top-r.height/2)/(r.height*.5);
 const n=Math.hypot(x,y);if(n>1){x/=n;y/=n}
 mobile.x=x;mobile.y=y;
 stick.style.transform='translate(calc(-50% + '+(x*31)+'px),calc(-50% + '+(y*31)+'px))';
}
function touchReset(){mobile.x=0;mobile.y=0;stick.style.transform='translate(-50%,-50%)'}
pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);touchMove(e)});
pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))touchMove(e)});
pad.addEventListener('pointerup',touchReset);pad.addEventListener('pointercancel',touchReset);
pickup.addEventListener('click',interact);
$('audioButton').addEventListener('click',()=>{
 state.ambient=sound.setEnabled(!state.ambient);
 $('audioButton').textContent=state.ambient?'SON : ON':'SON : OFF';
});
$('closeNotice').addEventListener('click',()=>{notice.hidden=true;noticeExpires=0});
function interact(){
 if(!hovered||!state.started)return;
 const response=hovered.onUse();
 if(response)notify(response,7);
 sound.cue(hovered.id==='drawer'?'entrance':hovered.id==='photo'?'note':'paper');
}
function lookForInteraction(){
 raycaster.setFromCamera(center,camera);
 const intersections=raycaster.intersectObjects(room.interactions.map(t=>t.marker),false);
 hovered=null;
 for(const hit of intersections){
  if(hit.distance>3.5)break;
  hovered=room.interactions.find(t=>t.marker===hit.object);
  if(hovered)break;
 }
 prompt.hidden=!hovered;
 if(hovered)prompt.textContent='E  ·  '+hovered.label;
 dot.classList.toggle('active',!!hovered);
 pickup.hidden=!hovered;
}
function collisionMove(dx,dz){
 const x=player.pos.x,z=player.pos.z;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.13));
 for(let i=0;i<steps;i++){
  const mx=dx/steps,mz=dz/steps;
  if(!room.collides(player.pos.x+mx,player.pos.z,.26))player.pos.x+=mx;
  if(!room.collides(player.pos.x,player.pos.z+mz,.26))player.pos.z+=mz;
 }
 return Math.hypot(player.pos.x-x,player.pos.z-z);
}
function updatePlayer(dt){
 const front=(keys.has('w')||keys.has('z')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-mobile.y;
 const right=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('q')||keys.has('a')||keys.has('arrowleft')?1:0)+mobile.x;
 const len=Math.hypot(front,right),f=len>1?front/len:front,r=len>1?right/len:right;
 player.running=keys.has('shift')&&len>.01;
 const speed=player.running?3.55:2.13;
 // orientation 0 = regarder vers -Z
 const fwd=new T.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
 const rightward=new T.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
 targetVec.copy(fwd.multiplyScalar(f*speed)).add(rightward.multiplyScalar(r*speed));
 player.velocity.lerp(targetVec,1-Math.exp(-dt*(len>.01?13:11)));
 const dist=collisionMove(player.velocity.x*dt,player.velocity.z*dt);
 player.moving=dist>.0008;
 if(player.moving){lastStep+=dt;const threshold=player.running?.30:.48;if(lastStep>=threshold){lastStep=0;sound.cue('step')}}
 else lastStep=0;
 worldTime+=dt;
 const bob=player.moving?Math.sin(worldTime*(player.running?15:9))*(player.running?.029:.016):0;
 const swaying=player.moving?Math.sin(worldTime*4)*.005:0;
 camera.position.set(player.pos.x+swaying,1.63+bob,player.pos.z);
 camera.rotation.order='YXZ';
 camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
 sound.update(dt,{moving:false,inside:true});
}
function draw(now){
 requestAnimationFrame(draw);
 const dt=Math.min(.046,Math.max(0,(now-frameTime)/1000));frameTime=now;
 if(state.started&&!state.paused)updatePlayer(dt);
 nature.update(dt);
 if(state.started)lookForInteraction();
 if(noticeExpires>0&&worldTime>noticeExpires){noticeExpires=0;notice.hidden=true}
 renderer.render(scene,camera);
 if(!$('loading').hidden)$('loading').hidden=true;
}
function resize(){
 renderer.setSize(innerWidth,innerHeight);
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
camera.lookAt(-.2,1.6,-3.7);
requestAnimationFrame(draw);
