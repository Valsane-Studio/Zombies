/* Valsane Studio — Zone Zéro, prototype 06 : survie solo */
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {createWorld} from './world.js';
import {createSoundscape} from './audio.js';
import {createEffects} from './effects.js';
import {createLoot} from './loot.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#495c58');scene.fog=new T.FogExp2('#516660',.0085);
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
const camera=new T.OrthographicCamera(-27,27,17,-17,.1,440);
const world=createWorld(T,scene);
const sound=createSoundscape();
const fx=createEffects(T,scene,world);
const loot=createLoot(T,scene,world);
// Les navigateurs autorisent le son après un premier geste du joueur.
document.addEventListener('pointerdown',()=>sound.unlock(),{passive:true});
const basic=(color)=>new T.MeshStandardMaterial({color,roughness:.85});
const skin=[basic('#bf9c81'),basic('#b58c75'),basic('#99725c'),basic('#d3ab8c')];
const teamColors=['#628c7b','#778da4','#a18a65','#8581a0'].map(c=>basic(c));
const infectedClothes=['#74796d','#606c68','#7c7166','#6a645f'].map(c=>basic(c));
const dark=basic('#2d3535'),boots=basic('#252f30'),gunMat=new T.MeshStandardMaterial({color:'#222b2e',roughness:.48,metalness:.6});
const skinSick=basic('#a2a48b'),blood=basic('#7b4440'),eye=basic('#c8c4a8');
const pickCircle=new T.Raycaster(),mouse=new T.Vector2();
const squad=[],zombies=[],effects=[],corpses=[];const names=['SURVIVANT'];
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
  {
    hpGroup=new T.Group();hpGroup.position.y=isZombie?2.4:2.62;group.add(hpGroup);
    const back=addMesh(hpGroup,box(.96,.085,.025),basic('#432e2b'));
    back.castShadow=false;hpBar=addMesh(hpGroup,box(.95,.077,.03),basic(isZombie?'#b76c5a':'#8ac2a0'),0,0,.03);
    hpBar.castShadow=false;hpGroup.visible=!isZombie;
  }
  group.position.set(x,world.heightAt(x,z),z);
  return{group,legs,arms,selection,hpBar,hpGroup,torso,head};
}
// Mission de traversée : atteindre le point B avec tous les agents encore vivants.
const start=world.mission.start,extraction=world.mission.exit;
const starts=[[start.x,start.z]];
starts.forEach(([x,z],i)=>{
  const actor=createActor(x,z,i);
  actor.selection.material.color.set(i===0?0xe3edbd:0x70aaa0);
  squad.push({x,z,idx:i,actor,hp:100,maxHp:100,speed:4.65,ammo:12,magazine:12,reserve:36,reload:0,weapon:'pistol',unlocked:{pistol:true,carbine:false},inventory:{pistol:{ammo:12,reserve:36},carbine:{ammo:0,reserve:0}},cooldown:Math.random()*.25,path:[],destination:null,alive:true,kills:0,walking:false,buff:null,heading:0,animation:0});
});
let selected=0,credits=0,kills=0;
let pickupsCollected=0;
const selectedAgents=new Set([0]);
let paused=false,ended=false,rate=1,time=0,notifyExpiry=0,lastHud=-1,activeSectors=new Set();
let mapUpdated=-1,nearExitMessage=false,followSelected=false;
function note(message,duration=3.5){const n=$('notice');n.textContent=message;n.classList.add('visible');notifyExpiry=time+duration}
function isBoosted(p){
  if(!p.alive||p.path.length||p.walking)return null;
  return world.spots.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<1.04&&Math.abs(world.heightAt(p.x,p.z)-s.y)<.38)||null;
}
function combatStats(p){
  const high=world.heightAt(p.x,p.z)>1.4,boost=!!p.buff,walking=p.walking,carbine=p.weapon==='carbine';
  return{accuracy:Math.min(.985,(carbine?.73:.78)+(high?.07:0)+(boost?.15:0)-(walking?.24:0)),
    range:(carbine?24:16)+(high?4:0),cadence:carbine?(boost?4:2.8):(boost?2.85:2),cover:boost?.42:0,damage:carbine?33:28};
}
function select(i,add=false){
  if(!squad[i]?.alive)return;
  if(!add)selectedAgents.clear();
  if(add&&selectedAgents.has(i)&&selectedAgents.size>1)selectedAgents.delete(i);
  else selectedAgents.add(i);
  selected=[...selectedAgents][0]??i;
  renderSquad(true);
}
function selectLasso(indices){
  const valid=indices.filter(i=>squad[i]?.alive);
  if(!valid.length){note('AUCUN AGENT DANS LA SÉLECTION',2);return}
  selectedAgents.clear();valid.forEach(i=>selectedAgents.add(i));
  selected=valid[0];
  renderSquad(true);note(valid.length+' AGENT'+(valid.length>1?'S':'')+' SÉLECTIONNÉ'+(valid.length>1?'S':''),2.3);
}
function recenterCamera(immediate=false){
  const members=squad.filter(p=>p.alive&&selectedAgents.has(p.idx));
  if(!members.length)return;
  const x=members.reduce((sum,p)=>sum+p.x,0)/members.length,z=members.reduce((sum,p)=>sum+p.z,0)/members.length;
  if(immediate)cameraCenter.set(x,0,z);
}
function renderSquad(force=false){
  if(!force&&time-lastHud<.2)return;lastHud=time;
  $('squadList').innerHTML=squad.map((p,i)=>{
    const hp=Math.max(0,Math.ceil(p.hp));
    return '<button data-agent="'+i+'" class="agent '+(selectedAgents.has(i)?'selected ':'')+(!p.alive?'dead':'')+'"><span class="tag">'+(i+1)+' · '+names[i]+'</span><span class="weapon">'+(p.weapon==='carbine'?'CARABINE / 5,56':'PISTOLET / 9 MM')+'</span><span class="hp"><i style="width:'+hp+'%"></i></span><span class="ammo">'+(p.alive?'PV '+hp+' · '+(p.reload>0?'RECHARGE':p.ammo+'/'+p.reserve):'HORS COMBAT')+'</span></button>';
  }).join('');
  $('squadList').querySelectorAll('[data-agent]').forEach(el=>el.onclick=()=>select(Number(el.dataset.agent)));
  const p=squad[selected];if(!p)return;
  p.buff=isBoosted(p);const stat=combatStats(p);
  $('currentAgent').textContent=selectedAgents.size>1?'GROUPE ('+selectedAgents.size+')':names[selected];
  if($('selectedCount'))$('selectedCount').textContent='01 SURVIVANT';
  if($('ammoStatus'))$('ammoStatus').textContent=(p.weapon==='carbine'?'CARABINE':'PISTOLET')+' · '+p.ammo+' / '+p.reserve+' CART.';
  if($('lootStatus'))$('lootStatus').textContent=pickupsCollected+' RAVITAILLEMENTS';
  $('accuracy').textContent=Math.round(stat.accuracy*100)+' %';
  $('firerate').textContent=stat.cadence.toFixed(1)+' /s';
  $('range').textContent=stat.range+' m';
  $('place').textContent=p.buff?p.buff.name:world.heightAt(p.x,p.z)>1.5?'EN HAUTEUR':p.walking?'EN DÉPLACEMENT':'POSITION LIBRE';
  $('buff').textContent=p.buff?'APPUI ACTIF · +15 % PRÉCISION · +43 % CADENCE':'REJOIGNEZ UN CERCLE JAUNE';
  $('buff').classList.toggle('on',!!p.buff);
}
function initializeInfected(){
  let variant=0;
  for(let k=0;k<world.mission.infestations.length;k++){
    const c=world.mission.infestations[k];
    for(let i=0;i<Math.max(1,Math.ceil(c.count/2));i++){
      const a=(i/c.count)*Math.PI*2+.43*k;
      const d=2.5+(i%3)*2.1;
      const p=world.snap(c.x+Math.cos(a)*d,c.z+Math.sin(a)*d);
      if(!p)continue;
      const actor=createActor(p.x,p.z,variant++,true);
      const hp=92+(i%3)*20+(k%2)*12;
      zombies.push({x:p.x,z:p.z,actor,hp,maxHp:hp,speed:1.10+Math.random()*.3,
        path:[],target:-1,think:Math.random()*1.8,cd:0,animation:Math.random()*5,
        heading:0,damage:12+(k%3)*2,walking:false,alert:false,
        group:k,origin:{x:p.x,z:p.z},bounty:160+Math.floor((hp-200)*.65)});
    }
  }
}
initializeInfected();
function end(success){
  if(ended)return;ended=true;paused=true;
  $('endTitle').textContent=success?'EXTRACTION RÉUSSIE':'ESCOUADE PERDUE';
  const saved=squad.filter(p=>p.alive).length;
  $('endText').textContent=(success?'Le point B est atteint. Vous avez survécu à la traversée.':'Votre survivant n’a pas atteint le point B.')+
    ' '+kills+' infectés éliminés ; '+credits.toLocaleString('fr-FR')+' € de recherche.';
  $('endOverlay').hidden=false;
}
function bloodMark(x,z,y){
  const mark=new T.Mesh(new T.CircleGeometry(.18+Math.random()*.27,16),new T.MeshBasicMaterial({color:0x5e2929,transparent:true,opacity:.37,depthWrite:false,side:T.DoubleSide}));
  mark.rotation.x=-Math.PI/2;mark.position.set(x,y+.03,z);scene.add(mark);corpses.push(mark);
  if(corpses.length>100){const old=corpses.shift();scene.remove(old);old.geometry.dispose();old.material.dispose()}
}
function tracer(ax,ay,az,bx,by,bz,hit){
  const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(ax,ay,az),new T.Vector3(bx,by,bz)]);
  const line=new T.Line(geo,new T.LineBasicMaterial({color:hit?0xffe4a7:0xffba83,transparent:true,opacity:.95,depthWrite:false}));
  scene.add(line);effects.push({mesh:line,life:.105,max:.105});
}
function shoot(p,target){
  const stats=combatStats(p);p.ammo--;p.cooldown=1/stats.cadence;
  const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
  p.actor.group.rotation.y=Math.atan2(-dx,-dz);
  const chance=Math.max(.2,Math.min(.985,stats.accuracy-Math.max(0,dist-5)*.017));
  const hit=Math.random()<chance;
  let bx=target.x,bz=target.z;
  const ay=world.heightAt(p.x,p.z)+1.38,by=world.heightAt(target.x,target.z)+1.1;
  sound.shoot();fx.muzzle(p,target);
  if(!hit){bx+=(Math.random()-.5)*2.7;bz+=(Math.random()-.5)*2.7}
  tracer(p.x,ay,p.z,bx,by,bz,hit);
  if(hit){
    fx.hit(target);sound.impact();target.hp-=stats.damage;
    target.actor.hpGroup.visible=true;
    if(target.hp<=0){
      bloodMark(target.x,target.z,world.heightAt(target.x,target.z));
      fx.kill(target);sound.death();
      credits+=target.bounty;kills++;p.kills++;
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
  const node=p.path[0],dx=node.x-p.x,dz=node.z-p.z,d=Math.hypot(dx,dz);
  if(d<.19){p.path.shift();if(!p.path.length)p.destination=null;return}
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
    p.actor.selection.material.opacity=selectedAgents.has(p.idx)?.95:.2;
    p.actor.selection.material.color.set(p.buff?0xf6cb5c:selectedAgents.has(p.idx)?0xa9e4d2:0x7bafa4);
    p.cooldown=Math.max(0,p.cooldown-dt);
    if(p.reload>0){p.reload-=dt;if(p.reload<=0){const n=Math.min(p.magazine-p.ammo,p.reserve);p.ammo+=n;p.reserve-=n}}
    else if(p.ammo<=0&&p.reserve>0)p.reload=p.weapon==='carbine'?2.1:1.65;
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
    let closest=null,best=Infinity;
    for(const p of squad)if(p.alive){
      const distance=Math.hypot(p.x-z.x,p.z-z.z);
      if(distance<best){best=distance;closest=p}
    }
    if(!z.alert&&best<25){
      z.alert=true;z.think=.04;
      if(!activeSectors.has(z.group)){
        activeSectors.add(z.group);
        note('ALERTE · SECTEUR INFESTÉ : '+world.mission.infestations[z.group].name,3.3);
      }
    }
    z.think-=dt;z.cd-=dt;
    if(z.alert&&closest){
      if(z.think<=0){
        // Zombies volontairement stupides : priorité absolue au survivant le plus proche.
        z.target=closest.idx;
        z.path=world.pathfind(z,closest);
        z.think=1.15+Math.random()*.5;
      }
      const p=squad[z.target]?.alive?squad[z.target]:closest;
      const distance=Math.hypot(p.x-z.x,p.z-z.z);
      const diff=Math.abs(world.heightAt(p.x,p.z)-world.heightAt(z.x,z.z));
      if(distance<.92&&diff<.72){
        if(z.cd<=0){
          p.hp=Math.max(0,p.hp-z.damage*(1-(p.buff?.42:0)));z.cd=1.4;
          if(p.hp<=0){
            p.alive=false;p.actor.selection.material.color.set(0x645b58);
            p.actor.group.rotation.z=-.85;note(names[p.idx]+' HORS COMBAT',3.2);
            selectedAgents.delete(p.idx);
            if(selected===p.idx){const next=squad.find(q=>q.alive);if(next){selected=next.idx;selectedAgents.add(next.idx)}}
            if(squad.every(q=>!q.alive))end(false);
          }
        }
      }else moveAlong(z,dt);
    }
    z.actor.group.position.set(z.x,world.heightAt(z.x,z.z),z.z);
    z.actor.group.rotation.y=z.heading;
    z.animation+=dt*(z.walking?5.5:1.6);
    z.actor.legs[0].rotation.x=Math.sin(z.animation)*.24;
    z.actor.legs[1].rotation.x=-Math.sin(z.animation)*.22;
    z.actor.torso.rotation.z=.16+Math.sin(z.animation*.7)*.03;
    z.actor.hpGroup.visible=z.alert||z.hp<z.maxHp;
    z.actor.hpBar.scale.x=Math.max(.02,z.hp/z.maxHp);
    z.actor.hpBar.position.x=-(1-z.hp/z.maxHp)*.47;
    z.actor.hpGroup.quaternion.copy(camera.quaternion);
  }
}
function checkExtraction(){
  const alive=squad.filter(p=>p.alive);
  if(!alive.length)return;
  const n=alive.filter(p=>Math.hypot(p.x-extraction.x,p.z-extraction.z)<extraction.radius).length;
  if(n===alive.length){end(true);return}
  if(n>0&&!nearExitMessage){
    nearExitMessage=true;note('EXTRACTION : REGROUPEZ TOUS LES AGENTS SURVIVANTS AU POINT B',4.2);
  }
  if(!n)nearExitMessage=false;
}
function updatePickups(dt){
  loot.update(time);
  const p=squad[0];if(!p.alive)return;
  const found=loot.collect(p);
  for(const message of found){pickupsCollected++;note(message,4.2);renderSquad(true)}
}
function switchWeapon(type){
  const p=squad[0];if(!p?.alive)return;
  if(!p.unlocked[type]){note('CARABINE À DÉCOUVRIR DANS LA VILLE',2.5);return}
  if(p.weapon===type)return;
  p.inventory[p.weapon]={ammo:p.ammo,reserve:p.reserve};
  p.weapon=type;p.magazine=type==='carbine'?20:12;
  p.ammo=p.inventory[type].ammo;p.reserve=p.inventory[type].reserve;
  p.reload=0;p.cooldown=.25;renderSquad(true);
  note('ARME ÉQUIPÉE : '+(type==='carbine'?'CARABINE':'PISTOLET'),2);
}
function missionHud(){
  const alive=squad.filter(p=>p.alive);
  const mean=alive.length?alive.reduce((s,p)=>s+Math.hypot(p.x-extraction.x,p.z-extraction.z),0)/alive.length:0;
  const original=Math.hypot(start.x-extraction.x,start.z-extraction.z);
  const progress=Math.max(0,Math.min(1,1-mean/original));
  $('wave').textContent='POINT B · '+Math.round(mean)+' M';
  $('waveState').textContent='SURVIE · '+(alive[0]?Math.ceil(alive[0].hp):0)+' PV';
  $('infected').textContent=String(zombies.length).padStart(2,'0');
  $('kills').textContent=String(kills).padStart(2,'0');
  $('money').textContent=credits.toLocaleString('fr-FR')+' €';
  $('progress').style.width=Math.round(progress*100)+'%';
  $('progressText').textContent=Math.round(progress*100)+' % DU TRAJET';
}
function tick(dt){
  time+=dt;
  updateActors(dt);updateZombies(dt);updatePickups(dt);fx.update(dt);
  checkExtraction();
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/e.max);
    if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}
  }
  if(notifyExpiry<time)$('notice').classList.remove('visible');
  if(time-lastHud>.2){missionHud();renderSquad();}
}
function drawMiniMap(){
  const canvas=$('minimap'),g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const bounds=world.bounds,sx=w/(bounds.maxX-bounds.minX),sy=h/(bounds.maxZ-bounds.minZ);
  const tx=x=>(x-bounds.minX)*sx,tz=z=>(z-bounds.minZ)*sy;
  g.fillStyle='#23302e';g.fillRect(0,0,w,h);
  g.fillStyle='#52615b';
  for(const x of world.roadX)g.fillRect(tx(x-4.6),0,9.2*sx,h);
  for(const z of world.roadZ)g.fillRect(0,tz(z-4.6),w,9.2*sy);
  g.fillStyle='#121c1e';
  for(const b of world.footprints)g.fillRect(tx(b.x-b.w/2),tz(b.z-b.d/2),b.w*sx,b.d*sy);
  g.fillStyle='#9c705d';
  for(const b of world.roadblocks)g.fillRect(tx(b.x-b.w/2),tz(b.z-b.d/2),Math.max(2,b.w*sx),Math.max(2,b.d*sy));
  for(const c of world.mission.infestations){
    g.beginPath();g.arc(tx(c.x),tz(c.z),c.radius*sx,0,Math.PI*2);
    g.fillStyle='#b8575440';g.fill();g.strokeStyle='#d0756468';g.lineWidth=.8;g.stroke();
  }
  for(const s of world.spots){g.beginPath();g.arc(tx(s.x),tz(s.z),3,0,Math.PI*2);g.fillStyle='#f1cc67';g.fill()}
  for(const z of zombies){g.beginPath();g.arc(tx(z.x),tz(z.z),z.alert?2.3:1.5,0,Math.PI*2);g.fillStyle=z.alert?'#f4a19b':'#a96663';g.fill()}
  g.beginPath();g.arc(tx(start.x),tz(start.z),3,0,Math.PI*2);g.fillStyle='#dbece0';g.fill();
  g.beginPath();g.arc(tx(extraction.x),tz(extraction.z),5,0,Math.PI*2);g.strokeStyle='#8ce5ba';g.lineWidth=2;g.stroke();
  g.fillStyle='#9ee4c8';g.font='bold 10px sans-serif';g.fillText('B',tx(extraction.x)-3,tz(extraction.z)+3);
  for(const p of squad)if(p.alive){
    g.beginPath();g.arc(tx(p.x),tz(p.z),selectedAgents.has(p.idx)?4.3:3.1,0,Math.PI*2);
    g.fillStyle=selectedAgents.has(p.idx)?'#fcf0bf':'#83c5d9';g.fill();
    if(selectedAgents.has(p.idx)){g.strokeStyle='#fff';g.lineWidth=1.3;g.stroke()}
  }
  // Centre de vue, pour faciliter la traversée de la grande carte.
  g.strokeStyle='#d9eee385';g.lineWidth=1;g.beginPath();
  g.moveTo(tx(cameraCenter.x)-5,tz(cameraCenter.z));g.lineTo(tx(cameraCenter.x)+5,tz(cameraCenter.z));
  g.moveTo(tx(cameraCenter.x),tz(cameraCenter.z)-5);g.lineTo(tx(cameraCenter.x),tz(cameraCenter.z)+5);g.stroke();
}
// Caméra tactique : glisser = parcourir la carte ; Maj + glisser = lasso multi-agents.
// Angle fixe pour ne pas faire pivoter la carte involontairement.
let azimuth=-.74,zoom=.86,cameraCenter=new T.Vector3(start.x,0,start.z);
function cameraUpdate(){
  const distance=44,angle=1.02;
  camera.position.set(cameraCenter.x+distance*Math.sin(azimuth)*Math.cos(angle),
    cameraCenter.y+distance*Math.sin(angle),
    cameraCenter.z+distance*Math.cos(azimuth)*Math.cos(angle));
  camera.lookAt(cameraCenter);
  sun.position.set(cameraCenter.x-18,31,cameraCenter.z+16);
  sun.target.position.set(cameraCenter.x,0,cameraCenter.z);
  sun.target.updateMatrixWorld();
}
function resize(){
  const width=innerWidth,height=innerHeight,scale=(width<700?20:17.6)*zoom;
  camera.left=-scale*width/height;camera.right=scale*width/height;camera.top=scale;camera.bottom=-scale;camera.updateProjectionMatrix();
  renderer.setSize(width,height);cameraUpdate();
}
window.addEventListener('resize',resize);resize();
const canvas=renderer.domElement;
const lasso=$('lasso');
let down=null;
function setupPointer(e){
  const r=canvas.getBoundingClientRect();
  mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  pickCircle.setFromCamera(mouse,camera);
}
function updateLassoRect(x0,y0,x1,y1){
  const left=Math.min(x0,x1),top=Math.min(y0,y1);
  lasso.style.left=left+'px';lasso.style.top=top+'px';
  lasso.style.width=Math.abs(x1-x0)+'px';
  lasso.style.height=Math.abs(y1-y0)+'px';
}
function hitAgent(e){
  setupPointer(e);
  const agents=squad.filter(p=>p.alive);
  const hits=pickCircle.intersectObjects(agents.map(p=>p.actor.group),true);
  for(const h of hits){
    let g=h.object;
    while(g&&g.parent!==scene)g=g.parent;
    const player=agents.find(p=>p.actor.group===g);
    if(player)return player;
  }
  return null;
}
function groupMove(goal){
  if(world.obstruction(goal.x,goal.z,.35)){
    note('PASSAGE BOUCHÉ : CHOISISSEZ UN SOL ACCESSIBLE',2.2);return;
  }
  const members=squad.filter(p=>p.alive&&selectedAgents.has(p.idx));
  if(!members.length)return;
  // Petites formations distinctes : les agents n'occupent jamais tous le même point.
  const offsets={1:[[0,0]],2:[[-.8,0],[.8,0]],3:[[-.8,-.7],[.8,-.7],[0,.75]],
    4:[[-.85,-.85],[.85,-.85],[-.85,.85],[.85,.85]]}[members.length];
  let ordered=0;
  for(let i=0;i<members.length;i++){
    const p=members[i],[ox,oz]=offsets[i];let path=[];
    // En cas de couvert étroit, utiliser la case praticable la plus proche.
    const trial=[[ox,oz],[ox*.5,oz*.5],[0,0],[-ox,oz],[ox,-oz]];
    for(const [dx,dz] of trial){
      const destination={x:goal.x+dx,z:goal.z+dz};
      if(world.obstruction(destination.x,destination.z,.38))continue;
      path=world.pathfind(p,destination);
      if(path.length){p.destination=destination;break}
    }
    if(path.length){p.path=path;p.buff=null;ordered++}
  }
  if(ordered)note(ordered+' ORDRE'+(ordered>1?'S':'')+' DE DÉPLACEMENT',1.6);
  else note('AUCUN ITINÉRAIRE : PASSAGE INACCESSIBLE',2.4);
  renderSquad(true);
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.button!==2)return;
  const box=canvas.getBoundingClientRect();
  const mode=(e.shiftKey&&e.button===0)?'lasso':'pan';
  down={pointerId:e.pointerId,x:e.clientX,y:e.clientY,center:cameraCenter.clone(),mode,button:e.button,moved:false};
  if(mode==='lasso'){
    followSelected=false;
    lasso.hidden=false;
    updateLassoRect(e.clientX,e.clientY,e.clientX,e.clientY);
  }
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!down||e.pointerId!==down.pointerId)return;
  const dx=e.clientX-down.x,dy=e.clientY-down.y;
  if(Math.hypot(dx,dy)>5)down.moved=true;
  if(down.mode==='lasso'){
    updateLassoRect(down.x,down.y,e.clientX,e.clientY);
  }else if(down.moved){
    followSelected=false;
    const magnitude=.038*zoom;
    const horizontal=new T.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth));
    const vertical=new T.Vector3(-Math.sin(azimuth),0,-Math.cos(azimuth));
    cameraCenter.copy(down.center).addScaledVector(horizontal,-dx*magnitude).addScaledVector(vertical,dy*magnitude);
    cameraUpdate();
  }
});
canvas.addEventListener('pointerup',e=>{
  if(!down||e.pointerId!==down.pointerId)return;
  const state=down;down=null;
  lasso.hidden=true;
  if(ended)return;
  if(state.mode==='lasso'){
    if(state.moved){
      const rect=canvas.getBoundingClientRect(),left=Math.min(state.x,e.clientX),right=Math.max(state.x,e.clientX),
        top=Math.min(state.y,e.clientY),bottom=Math.max(state.y,e.clientY);
      const inside=squad.filter(p=>{
        if(!p.alive)return false;
        const worldPos=new T.Vector3(p.x,world.heightAt(p.x,p.z)+1.1,p.z).project(camera);
        const sx=rect.left+(worldPos.x+1)*rect.width/2,sy=rect.top+(1-worldPos.y)*rect.height/2;
        return sx>=left&&sx<=right&&sy>=top&&sy<=bottom;
      }).map(p=>p.idx);
      selectLasso(inside);
    }else{
      const player=hitAgent(e);if(player)select(player.idx,true);
    }
    return;
  }
  if(state.moved||state.button===2)return;
  const player=hitAgent(e);
  if(player){select(player.idx);return}
  setupPointer(e);
  const target=world.clickPoint(pickCircle);
  if(target)groupMove(target);
});
canvas.addEventListener('pointercancel',()=>{down=null;lasso.hidden=true});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.53,Math.min(2.15,zoom*(e.deltaY>0?1.075:.93)));resize()},{passive:false});
function togglePause(force){paused=typeof force==='boolean'?force:!paused;$('pause').textContent=paused?'▶ REPRENDRE':'Ⅱ PAUSE'}
$('locate').onclick=()=>{followSelected=false;recenterCamera(true);note('CAMÉRA RECENTRÉE',1.6)};
$('minimap').addEventListener('click',e=>{
  const r=$('minimap').getBoundingClientRect();
  const u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;
  const bounds=world.bounds;
  cameraCenter.set(bounds.minX+u*(bounds.maxX-bounds.minX),0,bounds.minZ+v*(bounds.maxZ-bounds.minZ));
  followSelected=false;cameraUpdate();
});
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
  if(e.key.toLowerCase()==='c'){followSelected=false;recenterCamera(true)}
  if(e.key==='1')switchWeapon('pistol');
  if(e.key==='2')switchWeapon('carbine');
});
renderSquad(true);missionHud();note('SURVIVEZ JUSQU’AU POINT B. RÉCUPÉREZ ARMES, MUNITIONS ET SOINS.',5.5);
let previous=performance.now(),lastMiniTime=-999;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.045,(now-previous)/1000);previous=now;
  if(!paused&&!ended)tick(dt*rate);
  cameraUpdate();world.updateVisuals(now/1000);
  if(now-lastMiniTime>170){drawMiniMap();lastMiniTime=now}
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
