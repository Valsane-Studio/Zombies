/* ZONE ZÉRO · Une seule rue à explorer en temps réel.
   Vue perspective en plongée, personnage 3D animé, pistolet, aucun ennemi. */
import * as T from 'three';
import {createCivilian} from './civilian.js';
import {createClickNavigation} from './click-navigation.js';
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
$('loadingText').textContent='Préparation des déplacements et des éclairages…';

const playerRoot=new T.Group();
playerRoot.position.set(-12,.12,0);
scene.add(playerRoot);
const player={root:playerRoot,velocity:new T.Vector3(),aim:new T.Vector3(0,0,-1),ammo:12,reloading:0,shootCD:0,moving:false,running:false,step:0,shots:0};
// Personnage civil, de taille inférieure aux voitures et toujours armé.
const character=createCivilian(T,playerRoot);
const pistolRig=character.pistol;

// Caméra perspective oblique. Clic gauche : déplacer ; clic droit : tirer.
const cameraTarget=new T.Vector3(playerRoot.position.x,0,playerRoot.position.z);
let heading=.42,pitch=.96,zoom=1;
function cameraOffset(){
 const d=36*zoom;
 return new T.Vector3(Math.sin(heading)*Math.cos(pitch)*d,Math.sin(pitch)*d,Math.cos(heading)*Math.cos(pitch)*d);
}
function updateCamera(dt,force=false){
 cameraTarget.lerp(new T.Vector3(playerRoot.position.x,0,playerRoot.position.z),force?1:1-Math.exp(-dt*3.7));
 camera.position.lerp(cameraTarget.clone().add(cameraOffset()),force?1:1-Math.exp(-dt*4.0));
 camera.lookAt(cameraTarget.clone().add(new T.Vector3(0,.65,0)));
 sun.target.position.copy(cameraTarget);sun.position.copy(cameraTarget).add(new T.Vector3(-23,39,-7));
 sun.target.updateMatrixWorld();
}
updateCamera(.016,true);
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
 if(k==='c'){cameraTarget.copy(playerRoot.position);updateCamera(.016,true);note('VUE RECENTRÉE',1)}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();zoom=T.MathUtils.clamp(zoom*(e.deltaY>0?1.07:.93),.66,1.55);
},{passive:false});
function fireTowards(point){
 if(!point)return;
 navigation.faceAt(point,true);
 player.aim.set(-Math.sin(playerRoot.rotation.y),0,-Math.cos(playerRoot.rotation.y));
 shoot();
}
const navigation=createClickNavigation(T,{
 world,scene,player:playerRoot,camera,canvas:renderer.domElement,onFire:fireTowards
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
// Compatible avec un premier essai sur écran tactile.
const touchStick={x:0,y:0};
const pad=$('movePad'),stick=$('stick');
function changeStick(e){
 const r=pad.getBoundingClientRect();
 let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);
 const d=Math.hypot(dx,dy);if(d>1){dx/=d;dy/=d}
 touchStick.x=dx;touchStick.y=dy;
 stick.style.transform='translate(calc(-50% + '+(dx*27)+'px),calc(-50% + '+(dy*27)+'px))';
}
function resetStick(){touchStick.x=touchStick.y=0;stick.style.transform='translate(-50%,-50%)'}
pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);changeStick(e)});
pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))changeStick(e)});
pad.addEventListener('pointerup',resetStick);pad.addEventListener('pointercancel',resetStick);
$('mobileFire').addEventListener('pointerdown',e=>{e.preventDefault();shootingHeld=true;shoot()});
$('mobileFire').addEventListener('pointerup',()=>shootingHeld=false);
let last=performance.now();let loadingDone=false;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.045,(now-last)/1000);last=now;worldClock+=dt;
 if(!loadingDone&&worldClock>.5){loadingDone=true;$('loading').hidden=true}
 if(noticeExpiry>0&&worldClock>noticeExpiry){$('notice').hidden=true;noticeExpiry=0}
 if(keys.has('arrowleft'))heading-=dt*1.2;
 if(keys.has('arrowright'))heading+=dt*1.2;
 if(keys.has('arrowup'))pitch=Math.min(1.22,pitch+dt*.7);
 if(keys.has('arrowdown'))pitch=Math.max(.62,pitch-dt*.7);
 const isUp=keys.has('w')||keys.has('z'),isDown=keys.has('s');
 const isLeft=keys.has('a')||keys.has('q'),isRight=keys.has('d');
 let mx=(isRight?1:0)-(isLeft?1:0)+touchStick.x;
 let my=(isDown?1:0)-(isUp?1:0)+touchStick.y;
 const length=Math.hypot(mx,my);
 if(length>1){mx/=length;my/=length}
 // Déplacement en coordonnées écran, indépendant de l'orientation de visée.
 const forward=new T.Vector3(-Math.sin(heading),0,-Math.cos(heading));
 const right=new T.Vector3(Math.cos(heading),0,-Math.sin(heading));
 const wish=new T.Vector3().addScaledVector(right,mx).addScaledVector(forward,-my);
 if(wish.lengthSq()>1)wish.normalize();
 player.moving=wish.lengthSq()>.002;
 player.running=player.moving&&(keys.has('shift')||keys.has('shiftleft'));
 const speed=player.running?6.65:4.05;
 const velocity=wish.multiplyScalar(speed);
 const oldX=playerRoot.position.x,oldZ=playerRoot.position.z;
 const nX=oldX+velocity.x*dt,nZ=oldZ+velocity.z*dt;
 // Glissement sur les obstacles et collisions simples, sans téléportation.
 if(!world.collides(nX,oldZ,.52))playerRoot.position.x=nX;
 if(!world.collides(playerRoot.position.x,nZ,.52))playerRoot.position.z=nZ;
 if(!pointer.active){
   aimPoint.set(playerRoot.position.x+2,0,playerRoot.position.z-4);
 }
 // Orientation du personnage vers la souris, l'arme suit exactement la même direction.
 const face=aimPoint.clone().sub(playerRoot.position);
 face.y=0;
 if(face.lengthSq()>.1)player.aim.lerp(face.normalize(),1-Math.exp(-dt*17));
 const rotation=Math.atan2(-player.aim.x,-player.aim.z);
 const difference=Math.atan2(Math.sin(rotation-playerRoot.rotation.y),Math.cos(rotation-playerRoot.rotation.y));
 playerRoot.rotation.y+=difference*Math.min(1,dt*13);
 if(oldFallback){
   const swing=player.moving?Math.sin(worldClock*(player.running?14.5:9))*(player.running?.48:.3):0;
   oldFallback.legs[0].rotation.x+=(swing-oldFallback.legs[0].rotation.x)*Math.min(1,dt*13);
   oldFallback.legs[1].rotation.x+=(-swing-oldFallback.legs[1].rotation.x)*Math.min(1,dt*13);
   oldFallback.arms[0].rotation.x*=Math.exp(-dt*5);
   oldFallback.arms[1].rotation.x*=Math.exp(-dt*5);
 }
 if(mixer){setAnimation(!player.moving?'idle':player.running?'run':'walk');mixer.update(dt)}
 player.shootCD=Math.max(0,player.shootCD-dt);
 if(player.reloading>0){
   player.reloading-=dt;
   if(player.reloading<=0){player.reloading=0;player.ammo=12;updateAmmo();note('CHARGEUR RECHARGÉ',1.4)}
 }
 if(shootingHeld&&player.shootCD===0)shoot();
 pistolRig.position.z+=( -.55-pistolRig.position.z)*Math.min(1,dt*23);
 for(let i=effects.length-1;i>=0;i--){
   const fx=effects[i];fx.life-=dt;
   if(fx.mesh){
     fx.mesh.material.opacity=Math.max(0,fx.life/fx.max)*(.96);
     if(fx.mesh.isSprite)fx.mesh.scale.multiplyScalar(1+dt*3);
   }
   if(fx.light)fx.light.intensity=Math.max(0,fx.life/fx.max)*10;
   if(fx.life<=0){
     if(fx.mesh){scene.remove(fx.mesh);fx.mesh.geometry?.dispose();fx.mesh.material.dispose()}
     if(fx.light)scene.remove(fx.light);
     effects.splice(i,1);
   }
 }
 updateCamera(dt);
 refreshAim();
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
