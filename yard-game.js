/* ZONE ZÉRO — Étude 06. Exploration 3D libre, cadrage 2.5D cinématographique. */
import * as T from 'three';
import {createIndustrialYard} from './yard-world.js';
import {findYardPath} from './yard-nav.js';
import {createImmersiveAmbience} from './immersive-ambience.js';

const $=id=>document.getElementById(id);
const scene=new T.Scene();
scene.background=new T.Color(0x6b8088);
scene.fog=new T.FogExp2(0x657b85,.0205);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.25:1.65));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
$('stage').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,190);
const sky=new T.HemisphereLight(0xb7c7ce,0x313e43,2.15);scene.add(sky);
const ambient=new T.AmbientLight(0xc7d1cc,.36);scene.add(ambient);
const sun=new T.DirectionalLight(0xe2e2cf,3.25);
sun.position.set(-29,38,-9);sun.target.position.set(0,0,0);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:95});
sun.shadow.bias=-.00035;sun.shadow.normalBias=.045;scene.add(sun);
const world=createIndustrialYard(T,scene);
const sound=createImmersiveAmbience({host:window});
let showHints=true;

function createRunner(){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const cloth=new T.MeshStandardMaterial({color:0x854e4b,roughness:.98}),
  dark=new T.MeshStandardMaterial({color:0x30383d,roughness:.96}),
  skin=new T.MeshStandardMaterial({color:0xb6a091,roughness:.93}),
  hair=new T.MeshStandardMaterial({color:0x22292c,roughness:.98}),
  shoes=new T.MeshStandardMaterial({color:0x262b2b,roughness:.88});
 function object(geo,mat,x,y,z,parent=body){
  const ob=new T.Mesh(geo,mat);ob.position.set(x,y,z);ob.castShadow=true;ob.receiveShadow=true;parent.add(ob);return ob;
 }
 function capsule(parent,x,y,z,r,length,material){
  return object(new T.CapsuleGeometry(r,length,5,10),material,x,y,z,parent);
 }
 const hips=capsule(body,0,.88,0,.17,.08,dark);
 const torso=capsule(body,0,1.28,0,.225,.37,cloth);torso.scale.z=.78;
 const neck=object(new T.CylinderGeometry(.085,.085,.10,10),skin,0,1.63,0);
 const face=object(new T.SphereGeometry(.142,14,12),skin,0,1.8,-.02);face.scale.set(.92,1.07,.95);
 const hairCap=object(new T.SphereGeometry(.146,14,9,0,Math.PI*2,0,Math.PI*.60),hair,0,1.87,-.007);
 const legs=[],arms=[];
 for(const sign of [-1,1]){
  const leg=new T.Group();leg.position.set(sign*.12,.90,0);body.add(leg);
  capsule(leg,0,-.31,0,.105,.53,dark);
  const shoe=object(new T.BoxGeometry(.205,.13,.31),shoes,0,-.76,-.11,leg);
  legs.push(leg);
  const arm=new T.Group();arm.position.set(sign*.23,1.51,0);body.add(arm);
  const sleeve=capsule(arm,sign*.005,-.115,0,.113,.12,cloth);
  const fore=capsule(arm,sign*.015,-.35,-.025,.076,.31,skin);
  arms.push(arm);
 }
 body.scale.setScalar(.92);
 scene.add(root);
 function animate(dt,time,velocity,grounded){
  const moving=velocity>.15,run=Math.min(1,velocity/5.3),cadence=time*(7.8+run*5.5);
  const stride=moving?Math.sin(cadence)*(.30+.30*run):0;
  const ease=Math.min(1,dt*12);
  legs[0].rotation.x+=(stride-legs[0].rotation.x)*ease;
  legs[1].rotation.x+=(-stride-legs[1].rotation.x)*ease;
  arms[0].rotation.x+=(-stride*.74-arms[0].rotation.x)*ease;
  arms[1].rotation.x+=(stride*.74-arms[1].rotation.x)*ease;
  body.position.y+=((moving&&grounded?Math.abs(Math.sin(cadence))*.022:0)-body.position.y)*ease;
  body.rotation.z+=((!grounded?.05:0)-body.rotation.z)*ease;
 }
 return {root,animate};
}
const runner=createRunner();
const player={position:new T.Vector3(-19,0,10),vY:0,velocity:new T.Vector3(),grounded:true,
 heading:-.70,stepTime:0,travelTime:0};
runner.root.position.copy(player.position);
const keys=new Set(),mobile={x:0,y:0},pointer={x:0,y:0,drag:false,button:0,downX:0,downY:0,hasMoved:false};
let cameraAngle=-.67,cameraZoom=1,cameraTilt=1,follow=new T.Vector3(-19,0,10);
let targetPath=[],destination=null,tipExpires=0,storyTriggered=false;
const moveRay=new T.Raycaster(),cursor=new T.Vector2(),surfacePlane=new T.Plane(new T.Vector3(0,1,0),0);
const goalIndicator=new T.Mesh(new T.RingGeometry(.32,.43,36),new T.MeshBasicMaterial({
 color:0xe1e4c6,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide
}));
goalIndicator.rotation.x=-Math.PI/2;goalIndicator.visible=false;scene.add(goalIndicator);
const viewForward=new T.Vector3(),viewRight=new T.Vector3(),wish=new T.Vector3();
const mobileMode=matchMedia('(pointer:coarse)').matches;
const toggleUI=()=>{showHints=!showHints;document.body.classList.toggle('ui-hidden',!showHints)};
function message(s,duration=4){
 const el=$('message');el.textContent=s;el.hidden=false;tipExpires=performance.now()/1000+duration;
}
function resetPlayer(){
 player.position.set(-19,0,10);player.velocity.set(0,0,0);player.vY=0;player.grounded=true;
 targetPath=[];goalIndicator.visible=false;follow.copy(player.position);
 runner.root.position.copy(player.position);message('Retour au point de départ',2);
}
function setRoute(point){
 if(!point)return;
 const route=findYardPath(T,world,player.position,point);
 if(!route||!route.length){
  message('Aucun passage praticable jusqu’à cet endroit.',2.8);
  return;
 }
 targetPath=route;
 destination=point.clone();
 const dest=route[route.length-1];
 goalIndicator.position.set(dest.x,world.heightAt(dest.x,dest.z)+.13,dest.z);
 goalIndicator.visible=true;
}
function clickGround(x,y){
 const bounds=renderer.domElement.getBoundingClientRect();
 cursor.set((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1);
 moveRay.setFromCamera(cursor,camera);
 const ground=moveRay.ray.intersectPlane(surfacePlane,new T.Vector3());
 if(!ground)return null;
 // Priorité aux surfaces réelles (platelage, rampe), puis au sol.
 const hits=moveRay.intersectObjects(world.walkableMeshes,false);
 for(const h of hits){
  if(!Number.isFinite(h.point.x))continue;
  if(world.isBlocked(h.point.x,h.point.z,.45))continue;
  const point=h.point.clone();point.y=world.heightAt(point.x,point.z);return point;
 }
 if(world.isBlocked(ground.x,ground.z,.4))return null;
 ground.y=world.heightAt(ground.x,ground.z);return ground;
}
function jump(){
 if(player.grounded){
  player.vY=5.25;player.grounded=false;player.position.y+=.015;
 }
}
function resize(){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();
 keys.add(k);
 if(e.repeat)return;
 if(k===' ')jump();
 if(k==='r')resetPlayer();
 if(k==='c'){cameraAngle=-.67;cameraZoom=1;cameraTilt=1}
 if(k==='h')toggleUI();
 if(k==='e'&&player.position.distanceTo(new T.Vector3(32,player.position.y,-10.1))<3){
  message('Une ancienne radio grésille encore. La cour n’est peut-être pas totalement déserte.',5);
  sound.cue('metal');
 }
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();cameraZoom=T.MathUtils.clamp(cameraZoom*(e.deltaY>0?1.08:.92),.56,1.7);
},{passive:false});
renderer.domElement.addEventListener('pointerdown',e=>{
 pointer.downX=e.clientX;pointer.downY=e.clientY;pointer.x=e.clientX;pointer.y=e.clientY;
 pointer.button=e.button;pointer.drag=true;pointer.hasMoved=false;
 if(e.button===2||e.button===1)renderer.domElement.setPointerCapture?.(e.pointerId);
 sound.activate();
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!pointer.drag)return;
 const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
 pointer.x=e.clientX;pointer.y=e.clientY;
 if(Math.abs(e.clientX-pointer.downX)+Math.abs(e.clientY-pointer.downY)>8)pointer.hasMoved=true;
 if(pointer.button!==0){
  cameraAngle-=dx*.007;cameraTilt=T.MathUtils.clamp(cameraTilt+dy*.003,.55,1.38);
 }
});
renderer.domElement.addEventListener('pointerup',e=>{
 if(pointer.drag&&pointer.button===0&&!pointer.hasMoved&&!mobileMode){
  const point=clickGround(e.clientX,e.clientY);if(point)setRoute(point);
 }
 pointer.drag=false;
});
renderer.domElement.addEventListener('pointercancel',()=>pointer.drag=false);
const pad=$('pad'),knob=$('knob');
function padMove(e){
 const b=pad.getBoundingClientRect(),dx=(e.clientX-(b.left+b.width*.5))/(b.width*.4),dy=(e.clientY-(b.top+b.height*.5))/(b.height*.4);
 const dist=Math.max(1,Math.hypot(dx,dy));
 mobile.x=dx/dist;mobile.y=dy/dist;
 knob.style.transform='translate(calc(-50% + '+(mobile.x*34)+'px),calc(-50% + '+(mobile.y*34)+'px))';
}
function padReset(){mobile.x=0;mobile.y=0;knob.style.transform='translate(-50%,-50%)'}
pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);padMove(e);sound.activate()});
pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))padMove(e)});
pad.addEventListener('pointerup',padReset);pad.addEventListener('pointercancel',padReset);
$('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();sound.activate()});
$('reset').addEventListener('click',resetPlayer);
$('mute').addEventListener('click',e=>{const enabled=sound.setEnabled(!sound.enabled);$('mute').textContent=enabled?'SON : ON':'SON : OFF'});
const fwd=()=>new T.Vector3(-Math.sin(cameraAngle),0,-Math.cos(cameraAngle));
function tryHorizontal(dx,dz){
 const pos=player.position,r=.30;
 let hit=false;
 function axis(x,z){
  const elevation=world.heightAt(x,z),diff=elevation-pos.y;
  if(world.isBlocked(x,z,r)||diff>.47)return false;
  return true;
 }
 if(tryHorizontal.counter++>20)tryHorizontal.counter=0;
 const x=pos.x+dx,z=pos.z+dz;
 if(axis(x,pos.z))pos.x=x;else hit=true;
 if(axis(pos.x,z))pos.z=z;else hit=true;
 return !hit;
}
tryHorizontal.counter=0;
function move(dt){
 const w=(keys.has('z')||keys.has('w')?1:0)-(keys.has('s')?1:0)-mobile.y;
 const a=(keys.has('d')?1:0)-(keys.has('q')||keys.has('a')?1:0)+mobile.x;
 const inputSize=Math.hypot(w,a);
 const isDirect=inputSize>.10;
 const direction=fwd(),right=new T.Vector3(-direction.z,0,direction.x);
 wish.set(0,0,0);
 let desiredSpeed=(keys.has('shift')?5.35:3.35);
 if(isDirect){
  targetPath=[];destination=null;goalIndicator.visible=false;
  wish.addScaledVector(direction,w).addScaledVector(right,a).normalize();
 }else if(targetPath.length){
  const next=targetPath[0],dx=next.x-player.position.x,dz=next.z-player.position.z;
  if(Math.hypot(dx,dz)<.52){
   targetPath.shift();if(!targetPath.length)goalIndicator.visible=false;
  }else{wish.set(dx,0,dz).normalize();desiredSpeed=3.55}
 }
 const target=wish.multiplyScalar(desiredSpeed);
 player.velocity.lerp(target,1-Math.exp(-dt*10));
 const xmove=player.velocity.x*dt,zmove=player.velocity.z*dt;
 const before=player.position.clone();
 const steps=Math.max(1,Math.ceil(Math.hypot(xmove,zmove)/.20));
 for(let i=0;i<steps;i++)tryHorizontal(xmove/steps,zmove/steps);
 const ground=world.heightAt(player.position.x,player.position.z);
 if(player.grounded){
  if(ground<player.position.y-.21)player.grounded=false;
  else if(player.vY<=0)player.position.y=ground;
 }
 if(!player.grounded){
  player.vY-=14.7*dt;
  player.position.y+=player.vY*dt;
  if(player.position.y<=ground&&player.vY<=0){
   player.position.y=ground;player.vY=0;player.grounded=true;
  }
 }
 const horizontal=Math.hypot(player.position.x-before.x,player.position.z-before.z)/Math.max(dt,.001);
 if(horizontal>.12){
  const wanted=Math.atan2(-(player.position.x-before.x),-(player.position.z-before.z));
  player.heading+=Math.atan2(Math.sin(wanted-player.heading),Math.cos(wanted-player.heading))*(1-Math.exp(-dt*12));
 }
 runner.root.position.copy(player.position);runner.root.rotation.y=player.heading;
 runner.animate(dt,performance.now()*.001,horizontal,player.grounded);
 if(horizontal>.22&&player.grounded){
  player.stepTime+=dt;
 }else player.stepTime=0;
 sound.update(dt,{moving:horizontal>.22&&player.grounded,running:horizontal>4,inside:false});
 if(!storyTriggered&&player.position.y>2.6&&player.position.x>18){
  storyTriggered=true;message('Une passerelle surplombe la cour. Le paysage s’ouvre derrière les structures.',5);
 }
 if(player.position.x>29.4&&player.position.z<-6&&player.position.z>-13&&player.position.y>2.6)
   $('status').textContent='PASSERELLE · 3,2 M';
 else if(player.position.y>.3)$('status').textContent='RAMPE · EN HAUTEUR';
 else $('status').textContent='COUR INDUSTRIELLE';
}
function updateCamera(dt,force=false){
 const offset=new T.Vector3(Math.sin(cameraAngle)*21*cameraZoom,17.3*cameraZoom*cameraTilt,Math.cos(cameraAngle)*21*cameraZoom);
 // Approche fixe à 3/4, légère avance dans la direction du mouvement.
 const lookAhead=new T.Vector3(player.velocity.x,0,player.velocity.z).multiplyScalar(.52);
 const target=player.position.clone().add(new T.Vector3(0,1.12,0)).add(lookAhead);
 follow.lerp(target,force?1:1-Math.exp(-dt*3.35));
 const cameraGoal=follow.clone().add(offset);
 camera.position.lerp(cameraGoal,force?1:1-Math.exp(-dt*4.3));
 camera.lookAt(follow);
 sun.target.position.copy(follow);
 sun.position.copy(follow).add(new T.Vector3(-29,38,-9));
 sun.target.updateMatrixWorld();
}
const notice=$('message');let prev=performance.now();let clock=0;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(.0001,(now-prev)/1000));prev=now;clock+=dt;
 if(keys.has('arrowleft'))cameraAngle-=dt*.85;
 if(keys.has('arrowright'))cameraAngle+=dt*.85;
 if(keys.has('arrowup'))cameraTilt=T.MathUtils.clamp(cameraTilt-dt*.58,.55,1.38);
 if(keys.has('arrowdown'))cameraTilt=T.MathUtils.clamp(cameraTilt+dt*.58,.55,1.38);
 move(dt);world.update(dt);updateCamera(dt);
 if(tipExpires&&now/1000>tipExpires){notice.hidden=true;tipExpires=0}
 renderer.render(scene,camera);
 $('loading').hidden=true;
}
updateCamera(.016,true);requestAnimationFrame(frame);
