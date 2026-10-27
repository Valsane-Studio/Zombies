/* Valsane Studio — Zone Zéro, prototype 03 : impact, corps et ambiance */
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {createWorld} from './world.js';
import {createSoundscape} from './audio.js';
import {createEffects} from './effects.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#415350');scene.fog=new T.FogExp2('#485c59',.021);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.09;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xc8dcd8,0x283e3b,1.85));
const ambient=new T.AmbientLight(0x70888b,.34);scene.add(ambient);
const sun=new T.DirectionalLight(0xffd7b3,2.65);sun.position.set(-17,30,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;sun.shadow.normalBias=.032;scene.add(sun);
const camera=new T.OrthographicCamera(-27,27,17,-17,.1,190);
const world=createWorld(T,scene);
const sound=createSoundscape();
const fx=createEffects(T,scene,world);
// Les navigateurs autorisent le son après un premier geste du joueur.
document.addEventListener('pointerdown',()=>sound.unlock(),{passive:true});
const basic=(color)=>new T.MeshStandardMaterial({color,roughness:.85});
const skin=[basic('#bf9c81'),basic('#b58c75'),basic('#99725c'),basic('#d3ab8c')];
const teamColors=['#628c7b','#778da4','#a18a65','#8581a0'].map(c=>basic(c));
const infectedClothes=['#74796d','#606c68','#7c7166','#6a645f'].map(c=>basic(c));
const dark=basic('#2d3535'),boots=basic('#252f30'),gunMat=new T.MeshStandardMaterial({color:'#222b2e',roughness:.48,metalness:.6});
const skinSick=basic('#a2a48b'),blood=basic('#7b4440'),eye=basic('#c8c4a8');
const pickCircle=new T.Raycaster(),mouse=new T.Vector2();
const squad=[],zombies=[],effects=[],corpses=[];const names=['ALPHA','BRAVO','CHARLIE','DELTA'];
function addMesh(parent,geometry,material,x=0,y=0,z=0){
  const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
const box=(w,h,d)=>new T.BoxGeometry(w,h,d),ball=(r)=>new T.SphereGeometry(r,10,8);
function createActor(x,z,idx,isZombie=false){
  const group=new T.Group();scene.add(group);
  const palette=isZombie?infectedClothes[idx%infectedClothes.length]:teamColors[idx];
  const face=isZombie?skinSick:skin[idx%skin.length];
  const torso=addMesh(group,new T.CylinderGeometry(.31,.38,.87,9),palette,0,1.16,0);
  torso.rotation.z=isZombie?.17:0;
  const pelvis=addMesh(group,box(.64,.34,.35),dark,0,.73,0);
  const head=addMesh(group,ball(isZombie?.255:.238),face,0,1.98,-.035);
  addMesh(group,box(.26,.08,.25),isZombie?blood:dark,0,2.16,-.02);
  // Équipement et poches tactiques, mieux distinguables à la caméra oblique
  if(!isZombie){
    addMesh(group,box(.53,.56,.12),dark,0,1.21,-.32);
    addMesh(group,box(.24,.14,.16),palette,-.15,1.23,-.39);
    addMesh(group,box(.24,.14,.16),palette,.15,1.23,-.39);
    addMesh(group,box(.61,.12,.4),dark,0,1.03,0);
    addMesh(group,box(.43,.15,.43),dark,0,2.2,0);
    addMesh(group,box(.22,.12,.13),gunMat,.04,1.29,-.71);
    addMesh(group,box(.12,.14,.56),gunMat,.04,1.24,-.97);
    addMesh(group,box(.09,.23,.13),gunMat,.04,1.06,-.76);
  }else{
    addMesh(group,box(.19,.06,.05),blood,.11,1.96,-.26);
    addMesh(group,box(.09,.07,.05),eye,-.11,2.02,-.245);
  }
  const legs=[];
  for(let s of [-1,1]){
    const leg= new T.Group();leg.position.set(s*.2,.68,0);group.add(leg);
    addMesh(leg,box(.24,.6,.26),isZombie?palette:dark,0,-.28,0);
    addMesh(leg,box(.29,.17,.39),boots,0,-.61,-.07);
    legs.push(leg);
  }
  const arms=[];
  for(let s of [-1,1]){
    const arm=new T.Group();arm.position.set(s*.43,1.53,0);group.add(arm);
    addMesh(arm,new T.CylinderGeometry(.125,.12,.58,7),palette,0,-.29,0);
    addMesh(arm,box(.14,.18,.16),face,0,-.59,-.03);
    arm.rotation.x=isZombie?-.5:-.65;
    if(!isZombie){arm.rotation.z=s*.16;arm.rotation.x=-.9}
    arms.push(arm);
  }
  const selection= new T.Mesh(new T.RingGeometry(.52,.66,40),new T.MeshBasicMaterial({color:isZombie?0xba655e:0x99dbc7,transparent:true,opacity:isZombie?0:.8,side:T.DoubleSide,depthWrite:false}));
  selection.rotation.x=-Math.PI/2;selection.position.y=.08;group.add(selection);
  // Barre de vie au-dessus de la silhouette
  let hpGroup=null,hpBar=null;
  if(!isZombie){
    hpGroup=new T.Group();hpGroup.position.y=2.62;group.add(hpGroup);
    const back=addMesh(hpGroup,box(.96,.09,.025),basic('#432e2b'));
    back.castShadow=false;hpBar=addMesh(hpGroup,box(.95,.083,.03),basic('#8ac2a0'),0,0,.03);
    hpBar.castShadow=false;
  }
  group.position.set(x,world.heightAt(x,z),z);
  return{group,legs,arms,selection,hpBar,hpGroup,torso,head};
}
const starts=[[-6.8,-1.2],[-6.5,3.8],[8.6,1.9],[7.6,-5.8]];
starts.forEach(([x,z],i)=>{
  const actor=createActor(x,z,i);
  actor.selection.material.color.set(i===0?0xe3edbd:0x70aaa0);
  squad.push({x,z,idx:i,actor,hp:100,maxHp:100,speed:4.1,ammo:12,magazine:12,reload:0,cooldown:Math.random()*.3,path:[],destination:null,alive:true,kills:0,walking:false,buff:null,heading:0,animation:0});
});
let selected=0,credits=0,kills=0,wave=0,spawnRemain=0,spawnTotal=0,spawnCountdown=0,between=2.8;
let paused=false,ended=false,rate=1,time=0,notifyExpiry=0,lastHud=0,initialWave=true;
function note(message,duration=3.2){const n=$('notice');n.textContent=message;n.classList.add('visible');notifyExpiry=time+duration}
function isBoosted(p){
  if(!p.alive||p.path.length||p.walking)return null;
  return world.spots.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<.88&&Math.abs(world.heightAt(p.x,p.z)-s.y)<.37)||null;
}
function combatStats(p){
  const y=world.heightAt(p.x,p.z),high=y>1.5,boost=!!p.buff,walking=p.walking;
  return{accuracy:Math.min(.985,.78+(high?.07:0)+(boost?.15:0)-(walking?.24:0)),
    range:16+(high?4:0),cadence:boost?2.85:2,cover:boost?.42:0};
}
function select(i){if(!squad[i]?.alive)return;selected=i;renderSquad(true)}
function renderSquad(force=false){
  if(!force&&time-lastHud<.16)return;lastHud=time;
  const content=squad.map((p,i)=>{
    const hp=Math.max(0,Math.ceil(p.hp));
    return '<button data-agent="'+i+'" class="agent '+(i===selected?'selected ':'')+(!p.alive?'dead':'')+'"><span class="tag">'+(i+1)+' · '+names[i]+'</span><span class="weapon">PISTOLET / 9 MM</span><span class="hp"><i style="width:'+hp+'%"></i></span><span class="ammo">'+(p.alive?'PV '+hp+' · '+(p.reload>0?'RECHARGE':p.ammo+'/'+p.magazine):'HORS COMBAT')+'</span></button>';
  }).join('');
  $('squadList').innerHTML=content;
  $('squadList').querySelectorAll('[data-agent]').forEach(el=>el.onclick=()=>select(Number(el.dataset.agent)));
  const p=squad[selected];if(!p)return;
  p.buff=isBoosted(p);const stat=combatStats(p);
  $('currentAgent').textContent=names[selected];
  $('accuracy').textContent=Math.round(stat.accuracy*100)+' %';
  $('firerate').textContent=stat.cadence.toFixed(1)+' /s';
  $('range').textContent=stat.range+' m';
  $('place').textContent=p.buff?p.buff.name:world.heightAt(p.x,p.z)>1.5?'EN HAUTEUR':p.walking?'EN DÉPLACEMENT':'POSITION LIBRE';
  $('buff').textContent=p.buff?'APPUI ACTIF · +15 % PRÉCISION · +43 % CADENCE':'REJOIGNEZ UN CERCLE JAUNE';
  $('buff').classList.toggle('on',!!p.buff);
}
function spawnZombie(){
  let x,z,attempts=0;
  do{
    const side=Math.floor(Math.random()*4);
    if(side===0){x=-21;z=-14+Math.random()*28}
    if(side===1){x=21;z=-14+Math.random()*28}
    if(side===2){x=-20+Math.random()*40;z=-15}
    if(side===3){x=-20+Math.random()*40;z=15}
  }while(world.obstruction(x,z,.45)&&attempts++<40);
  const variant=Math.floor(Math.random()*4);
  const actor=createActor(x,z,variant,true);
  const hp=48+wave*10;
  zombies.push({x,z,actor,hp,maxHp:hp,speed:1.2+Math.random()*.35+wave*.065,path:[],target:-1,think:Math.random()*.9,cd:0,animation:Math.random()*5,heading:0,damage:9+wave*1.6});
}
function startWave(){
  wave++;
  sound.startWave();
  if(wave>5){end(true);return}
  spawnRemain=5+wave*4;spawnTotal=spawnRemain;spawnCountdown=.4;
  initialWave=false;
  note('VAGUE '+wave+' / 5 — '+spawnRemain+' INFECTÉS REPÉRÉS',4);
}
function end(success){
  if(ended)return;ended=true;paused=true;
  $('endTitle').textContent=success?'EXTRACTION RÉUSSIE':'ESCOUADE PERDUE';
  $('endText').textContent=(success?'Les cinq vagues ont été éliminées.':'Tous les membres de votre escouade sont hors combat.')+' '+kills+' infectés éliminés. '+credits.toLocaleString('fr-FR')+' € de crédits de recherche.';
  $('endOverlay').hidden=false;
}
function bloodMark(x,z,y){
  const mark=new T.Mesh(new T.CircleGeometry(.18+Math.random()*.27,16),new T.MeshBasicMaterial({color:0x5e2929,transparent:true,opacity:.37,depthWrite:false,side:T.DoubleSide}));
  mark.rotation.x=-Math.PI/2;mark.position.set(x,y+.03,z);scene.add(mark);corpses.push(mark);
  if(corpses.length>100){const old=corpses.shift();scene.remove(old);old.geometry.dispose();old.material.dispose()}
}
function tracer(ax,ay,az,bx,by,bz,hit){
  const points=[new T.Vector3(ax,ay,az),new T.Vector3(bx,by,bz)];
  const geo=new T.BufferGeometry().setFromPoints(points);
  const line=new T.Line(geo,new T.LineBasicMaterial({color:hit?0xffe4a7:0xffba83,transparent:true,opacity:.95,depthWrite:false}));
  scene.add(line);effects.push({mesh:line,life:.105,max:.105});
}
function shoot(p,target){
  const stats=combatStats(p);p.ammo--;p.cooldown=1/stats.cadence;
  const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
  p.actor.group.rotation.y=Math.atan2(-dx,-dz);
  const chance=Math.max(.2,Math.min(.985,stats.accuracy-Math.max(0,dist-5)*.017));
  const hit=Math.random()<chance;
  const ax=p.x,az=p.z,ay=world.heightAt(p.x,p.z)+1.38;
  let bx=target.x,bz=target.z,by=world.heightAt(target.x,target.z)+1.1;
  sound.shoot();
  fx.muzzle(p,target);
  if(!hit){bx+=(Math.random()-.5)*2.6;bz+=(Math.random()-.5)*2.6}
  tracer(ax,ay,az,bx,by,bz,hit);
  if(hit){
    // Chaque coup au but déclenche une réaction visuelle et sonore.
    fx.hit(target);
    sound.impact();
    target.hp-=28;
    if(target.hp<=0){
      bloodMark(target.x,target.z,world.heightAt(target.x,target.z));
      // Ne pas retirer immédiatement le modèle : il tombe et reste au sol 7,6 s.
      fx.kill(target);
      sound.death();
      credits+=100+Math.max(0,wave-1)*20;kills++;p.kills++;
    }
  }
}
function nearestTarget(p){
  let target=null,dist=Infinity;const maxRange=combatStats(p).range;
  for(const z of zombies){
    if(z.hp<=0)continue;
    const d=Math.hypot(p.x-z.x,p.z-z.z);
    if(d<dist&&d<=maxRange&&world.visible(p,z)){target=z;dist=d}
  }
  return target;
}
function moveAlong(p,dt){
  p.walking=false;
  if(!p.path.length)return;
  let node=p.path[0],dx=node.x-p.x,dz=node.z-p.z,d=Math.hypot(dx,dz);
  if(d<.12){p.path.shift();if(!p.path.length)p.destination=null;return}
  const step=Math.min(d,p.speed*dt);
  p.x+=dx/d*step;p.z+=dz/d*step;
  p.heading=Math.atan2(-dx,-dz);p.walking=true;
}
function updateActors(dt){
  for(const p of squad){
    if(!p.alive)continue;
    moveAlong(p,dt);
    p.buff=isBoosted(p);
    p.actor.group.position.set(p.x,world.heightAt(p.x,p.z),p.z);
    p.actor.selection.material.opacity=p.idx===selected?.95:.25;
    p.actor.selection.material.color.set(p.buff?0xf6cb5c:p.idx===selected?0xa9e4d2:0x7bafa4);
    p.cooldown=Math.max(0,p.cooldown-dt);
    if(p.reload>0){p.reload-=dt;if(p.reload<=0)p.ammo=p.magazine}
    else if(p.ammo<=0)p.reload=1.65;
    else if(p.cooldown<=0){const z=nearestTarget(p);if(z)shoot(p,z)}
    if(p.walking){
      p.animation+=dt*9;
      p.actor.legs[0].rotation.x=Math.sin(p.animation)*.4;
      p.actor.legs[1].rotation.x=-Math.sin(p.animation)*.4;
      p.actor.group.rotation.y=p.heading;
    }else{
      p.actor.legs[0].rotation.x*=.76;p.actor.legs[1].rotation.x*=.76;
    }
    p.actor.hpBar.scale.x=Math.max(.02,p.hp/p.maxHp);
    p.actor.hpBar.position.x=-(1-p.hp/p.maxHp)*.47;
    p.actor.hpGroup.quaternion.copy(camera.quaternion);
  }
}
function updateZombies(dt){
  for(let i=zombies.length-1;i>=0;i--){
    const z=zombies[i];
    if(z.hp<=0){zombies.splice(i,1);continue}
    z.think-=dt;z.cd-=dt;
    if(z.think<=0){
      // Aucune stratégie : seulement la personne la plus proche en distance horizontale.
      let best=Infinity,target=-1;
      for(let j=0;j<squad.length;j++){const p=squad[j];if(!p.alive)continue;
        const d=Math.hypot(p.x-z.x,p.z-z.z);if(d<best){best=d;target=j}
      }
      z.target=target;
      if(target>=0){z.path=world.pathfind(z,squad[target]);z.path.push({x:squad[target].x,z:squad[target].z})}
      z.think=.55+Math.random()*.65;
    }
    if(z.target>=0&&squad[z.target]?.alive){
      const p=squad[z.target],d=Math.hypot(p.x-z.x,p.z-z.z);
      const diff=Math.abs(world.heightAt(p.x,p.z)-world.heightAt(z.x,z.z));
      if(d<.86&&diff<.73){
        if(z.cd<=0){
          const block=p.buff?.42:0;
          p.hp=Math.max(0,p.hp-z.damage*(1-block));z.cd=1.3;
          if(p.hp<=0){
            p.alive=false;p.actor.selection.material.color.set(0x645b58);
            p.actor.group.rotation.z=-.6;note(names[p.idx]+' HORS COMBAT',3.5);
            if(selected===p.idx){let next=squad.find(q=>q.alive);if(next)selected=next.idx}
            if(squad.every(q=>!q.alive))end(false);
          }
        }
      }else{
        moveAlong(z,dt);
        if(!z.walking&&d>.85&&z.path.length===0)z.think=.1;
      }
    }
    z.actor.group.position.set(z.x,world.heightAt(z.x,z.z),z.z);
    z.actor.group.rotation.y=z.heading;
    z.animation+=dt*(z.walking?6:2);
    z.actor.legs[0].rotation.x=Math.sin(z.animation)*.29;
    z.actor.legs[1].rotation.x=-Math.sin(z.animation)*.27;
    z.actor.torso.rotation.z=.16+Math.sin(z.animation*.7)*.04;
  }
}
function tick(dt){
  time+=dt;
  if(wave===0){between-=dt;if(between<=0)startWave()}
  else if(spawnRemain>0){
    spawnCountdown-=dt;
    if(spawnCountdown<=0){spawnZombie();spawnRemain--;spawnCountdown=.52+Math.random()*.52}
  }else if(zombies.length===0){
    between-=dt;
    if(between<=0){between=4;startWave()}
  }
  updateActors(dt);updateZombies(dt);
  fx.update(dt);
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/e.max);
    if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}
  }
  if(notifyExpiry<time)$('notice').classList.remove('visible');
  $('wave').textContent='VAGUE '+String(Math.max(wave,1)).padStart(2,'0')+' / 05';
  $('waveState').textContent=spawnRemain>0?'SIGNATURES EN APPROCHE':zombies.length?'COMBAT EN COURS':'RECONFIGURATION';
  $('infected').textContent=String(zombies.length+spawnRemain).padStart(2,'0');
  $('kills').textContent=String(kills).padStart(2,'0');
  $('money').textContent=credits.toLocaleString('fr-FR')+' €';
  $('progress').style.width=wave?((spawnTotal-spawnRemain)/Math.max(1,spawnTotal)*100)+'%':'0%';
  renderSquad();
}
// Caméra orbitale tactique : glisser pour tourner ; Maj/secondaire pour déplacer ; molette zoom.
let azimuth=-.74,zoom=1,cameraCenter=new T.Vector3(0,0,0);
function cameraUpdate(){
  const distance=44,angle=1.02;
  camera.position.set(cameraCenter.x+distance*Math.sin(azimuth)*Math.cos(angle),
    cameraCenter.y+distance*Math.sin(angle),
    cameraCenter.z+distance*Math.cos(azimuth)*Math.cos(angle));
  camera.lookAt(cameraCenter);
}
function resize(){
  const width=innerWidth,height=innerHeight,scale=(width<700?20:17.6)*zoom;
  camera.left=-scale*width/height;camera.right=scale*width/height;camera.top=scale;camera.bottom=-scale;camera.updateProjectionMatrix();
  renderer.setSize(width,height);cameraUpdate();
}
window.addEventListener('resize',resize);resize();
const canvas=renderer.domElement;let down=null;
function setupPointer(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);pickCircle.setFromCamera(mouse,camera)}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  down={x:e.clientX,y:e.clientY,angle:azimuth,center:cameraCenter.clone(),button:e.button,pan:e.button===2||e.shiftKey};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!down)return;
  const dx=e.clientX-down.x,dy=e.clientY-down.y;
  if(down.pan){
    const magnitude=.038*zoom;
    const horizontal=new T.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));
    const vertical=new T.Vector3(-Math.sin(azimuth),0,-Math.cos(azimuth));
    cameraCenter.copy(down.center).addScaledVector(horizontal,-dx*magnitude).addScaledVector(vertical,dy*magnitude);
  }else azimuth=down.angle-dx*.007;
  cameraUpdate();
});
canvas.addEventListener('pointerup',e=>{
  if(!down)return;
  const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y)>8;const wasPan=down.pan;down=null;
  if(moved||wasPan||ended)return;
  setupPointer(e);
  const agents=squad.filter(p=>p.alive);
  const hits=pickCircle.intersectObjects(agents.map(p=>p.actor.group),true);
  for(const h of hits){
    let g=h.object;
    while(g&&g.parent!==scene)g=g.parent;
    const player=agents.find(p=>p.actor.group===g);
    if(player){select(player.idx);return}
  }
  const target=world.clickPoint(pickCircle);if(!target)return;
  if(world.obstruction(target.x,target.z,.35)){note('OBSTACLE : CHOISISSEZ UNE ZONE LIBRE',2);return}
  const p=squad[selected];if(!p?.alive)return;
  const path=world.pathfind(p,target);
  if(path.length){p.path=path;p.path.push({x:target.x,z:target.z});p.destination=target;p.buff=null;renderSquad(true)}
  else note('POSITION INACCESSIBLE : ESSAYEZ UN AUTRE POINT',2);
});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.63,Math.min(1.7,zoom*(e.deltaY>0?1.075:.93)));resize()},{passive:false});
function togglePause(force){paused=typeof force==='boolean'?force:!paused;$('pause').textContent=paused?'▶ REPRENDRE':'Ⅱ PAUSE'}
$('pause').onclick=()=>togglePause();$('speed').onclick=()=>{rate=rate===1?2:1;$('speed').textContent=rate+'×'};
$('sound').onclick=()=>{
  sound.unlock();const muted=sound.setMuted(!sound.muted);
  $('sound').textContent=muted?'SON OFF':'♫ SON ON';
  $('sound').setAttribute('aria-pressed',String(!muted));
};
$('newGame').onclick=()=>location.reload();$('restartButton').onclick=()=>location.reload();
window.addEventListener('keydown',e=>{
  sound.unlock();
  if(['1','2','3','4'].includes(e.key))select(Number(e.key)-1);
  if(e.code==='Space'){e.preventDefault();togglePause()}
  if(e.key==='Escape'&&paused)togglePause(false);
});
renderSquad(true);note('DÉPLACEZ VOTRE ESCOUADE — LES CERCLES JAUNES AUGMENTENT LA PRÉCISION',4.3);
let previous=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.045,(now-previous)/1000);previous=now;
  if(!paused&&!ended)tick(dt*rate);
  for(const s of world.spots)if(s.ring){s.ring.material.opacity=.68+.26*Math.sin(now*.0025+s.x)}
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
