/* Valsane Studio — Zone Zéro, prototype 07 : survie tactique */
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import {createWorld} from './world.js';
import {createSoundscape} from './audio.js';
import {createEffects} from './effects.js';
import {createLoot} from './loot.js';
import {createVision} from './vision.js';
import {createStealth} from './stealth.js';
import {createWeather} from './weather.js';
import {WEAPONS,MODES,profile,canUseMedkit} from './survival-rules.js';
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
const vision=createVision(T,scene,world);
const stealth=createStealth(world,vision);
const weather=createWeather(T,scene,world);
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
const p={idx:0,x:start.x,z:start.z,hp:100,maxHp:100,alive:true,actor:createActor(start.x,start.z,0),path:[],destination:null,walking:false,heading:0,animation:0,kills:0,
  weapon:'pistol',magazine:12,ammo:12,reserve:30,inventory:{
    pistol:{magazine:12,ammo:12,reserve:30},carbine:{magazine:25,ammo:0,reserve:0},shotgun:{magazine:6,ammo:0,reserve:0}
  },unlocked:{pistol:true,carbine:false,shotgun:false},medkits:1,
  stamina:100,mode:'walk',autoFire:false,flashlight:false,action:null,footstep:0,cooldown:0,reload:0,hitWarning:0,nearCover:false,buff:null};
squad.push(p);
let selected=0,credits=0,kills=0,pickupsCollected=0,paused=false,ended=false,rate=1,time=0,notifyExpiry=0,lastHud=-1,focusInput=false;
let lastVisionUpdate=-1,lastMiniTime=-1,lastThreat='CALME',lastPickupLabel='';
const torch=new T.SpotLight(0xffe8b0,0,20,Math.PI/6,.35,1.2);
torch.castShadow=false;scene.add(torch);scene.add(torch.target);
const beamGeometry=new T.ConeGeometry(4,13,22,1,true);
const beam=new T.Mesh(beamGeometry,new T.MeshBasicMaterial({color:0xffebaf,transparent:true,opacity:.024,depthWrite:false,side:T.DoubleSide}));
beam.visible=false;beam.rotation.x=Math.PI/2;scene.add(beam);
function note(message,duration=3.5){const n=$('notice');n.textContent=message;n.classList.add('visible');notifyExpiry=time+duration}
function setMode(mode){
  if(!MODES[mode]||!p.alive)return;
  if(mode==='sprint'&&p.stamina<12){note('TROP FATIGUÉ POUR COURIR');return}
  p.mode=mode;updateHud(true);
}
function isBoosted(q){
  if(!q.alive||q.walking||q.path.length)return null;
  return world.spots.find(s=>Math.hypot(q.x-s.x,q.z-s.z)<1.04&&Math.abs(world.heightAt(q.x,q.z)-s.y)<.38)||null;
}
function hasCover(q){
  return !!q.buff||(q.mode==='sneak'&&stealth.coverNear(q));
}
function combatStats(q){
  const s=profile(q,world,hasCover(q));return{accuracy:s.accuracy,range:s.range,cadence:s.rate,cover:s.cover,damage:s.damage,noise:s.noise,reload:s.reload,falloff:s.falloff};
}
function switchWeapon(type){
  if(!p.alive)return;
  if(!p.unlocked[type]){note('ARME NON TROUVÉE : EXPLOREZ LES CACHES');return}
  if(p.action){note('ACTION EN COURS · ATTENDEZ');return}
  if(p.weapon===type)return;
  p.inventory[p.weapon].ammo=p.ammo;p.inventory[p.weapon].reserve=p.reserve;
  p.weapon=type;p.magazine=WEAPONS[type].magazine;
  p.ammo=p.inventory[type].ammo;p.reserve=p.inventory[type].reserve;
  p.reload=0;p.cooldown=.25;updateHud(true);note(WEAPONS[type].name+' ÉQUIPÉ');
}
function startReload(){
  if(p.action||!p.alive||p.reload>0||p.reserve<=0||p.ammo>=p.magazine)return;
  p.reload=WEAPONS[p.weapon].reload;sound.reload();
  note('RECHARGEMENT · '+WEAPONS[p.weapon].caliber,1.6);
}
function startLoot(){
  if(!p.alive||p.action)return;
  const item=loot.nearest(p);
  if(!item){note('AUCUNE CACHE À PORTÉE. APPROCHEZ-VOUS.',2.5);return}
  p.path=[];p.action={type:'loot',item,remaining:1.6,total:1.6};
  stealth.noise(p.x,p.z,3.5,'rummage',time);
  updateHud(true);
}
function startHeal(){
  if(!canUseMedkit(p)){note('SOINS INDISPONIBLES · KIT OU PV MAX.');return}
  p.path=[];p.action={type:'heal',remaining:2.7,total:2.7};updateHud(true);
  note('UTILISATION DU KIT : RESTEZ IMMOBILE',2.5);
}
function createZombies(){
  let variant=0;
  for(let k=0;k<world.mission.infestations.length;k++){
    const zone=world.mission.infestations[k];
    for(let i=0;i<Math.max(2,Math.ceil(zone.count*.72));i++){
      const theta=i*Math.PI*2/Math.max(2,Math.ceil(zone.count*.72))+k*.67;
      const dist=3+(i%3)*2.4;
      const q=world.snap(zone.x+Math.cos(theta)*dist,zone.z+Math.sin(theta)*dist);
      if(!q)continue;
      const hp=93+(i%3)*23+(k%2)*12;
      const actor=createActor(q.x,q.z,variant++,true);
      zombies.push({x:q.x,z:q.z,hp,maxHp:hp,actor,cd:Math.random()*2,
        speed:1.03+Math.random()*.25,damage:11+(k%3)*3,
        state:'idle',alert:false,lastSeen:null,lastSighting:0,think:Math.random()*1.3,
        path:[],target:-1,walking:false,heading:Math.random()*Math.PI*2,animation:Math.random()*5,
        origin:{x:q.x,z:q.z},group:k,bounty:120+(k*9)});
    }
  }
}
createZombies();
function end(success){
  if(ended)return;ended=true;paused=true;
  $('endTitle').textContent=success?'VOUS AVEZ SURVÉCU':'FIN DE PARCOURS';
  $('endText').textContent=success
    ?'La zone d’extraction est atteinte. '+kills+' infectés éliminés, '+pickupsCollected+' caches fouillées, '+vision.explorationPercent()+' % du secteur exploré.'
    :'Le survivant n’a pas réussi à traverser la zone contaminée. Explorez les couverts, économisez les munitions et évitez les groupes.';
  $('endOverlay').hidden=false;
}
function bloodMark(x,z,y){
  const mark=new T.Mesh(new T.CircleGeometry(.19+Math.random()*.25,16),new T.MeshBasicMaterial({color:0x502d29,transparent:true,opacity:.43,depthWrite:false,side:T.DoubleSide}));
  mark.rotation.x=-Math.PI/2;mark.position.set(x,y+.035,z);scene.add(mark);corpses.push(mark);
  if(corpses.length>80){const old=corpses.shift();scene.remove(old);old.geometry.dispose();old.material.dispose()}
}
function tracer(ax,ay,az,bx,by,bz,hit){
  const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(ax,ay,az),new T.Vector3(bx,by,bz)]);
  const line=new T.Line(geo,new T.LineBasicMaterial({color:hit?0xffdfad:0xbdae9b,transparent:true,opacity:.8,depthWrite:false}));
  scene.add(line);effects.push({mesh:line,life:.09,max:.09});
}
function shoot(q,target){
  const w=combatStats(q);q.ammo--;q.inventory[q.weapon].ammo=q.ammo;q.cooldown=1/w.cadence;
  q.actor.group.rotation.y=Math.atan2(-(target.x-q.x),-(target.z-q.z));
  const d=Math.hypot(target.x-q.x,target.z-q.z);
  const chance=Math.min(.985,Math.max(.22,w.accuracy-Math.max(0,d-4)*w.falloff));
  const hit=Math.random()<chance;
  const tx=target.x+(hit?0:(Math.random()-.5)*2.6);
  const tz=target.z+(hit?0:(Math.random()-.5)*2.6);
  const ay=world.heightAt(q.x,q.z)+1.35,by=world.heightAt(target.x,target.z)+1.2;
  sound.shoot(q.weapon);fx.muzzle(q,target);
  stealth.noise(q.x,q.z,w.noise,'gunshot',time);
  q.hitWarning=.6;
  tracer(q.x,ay,q.z,tx,by,tz,hit);
  if(hit){
    let damage=w.damage;
    if(q.weapon==='shotgun')damage*=Math.max(.45,1-d*.042);
    fx.hit(target);sound.impact();target.hp-=damage;
    target.actor.hpGroup.visible=true;
    if(target.hp<=0){
      bloodMark(target.x,target.z,world.heightAt(target.x,target.z));
      fx.kill(target);sound.death();
      credits+=target.bounty;kills++;q.kills++;
    }
  }
}
function nearestTarget(q){
  const w=combatStats(q);let target=null,best=w.range;
  for(const z of zombies)if(z.hp>0){
    const d=Math.hypot(q.x-z.x,q.z-z.z);
    if(d<best&&vision.canSee(z.x,z.z)&&vision.hasLineOfSight(q,z)){target=z;best=d}
  }
  return target;
}
function moveAlong(q,dt){
  q.walking=false;
  if(!q.path.length)return;
  const node=q.path[0],dx=node.x-q.x,dz=node.z-q.z,dist=Math.hypot(dx,dz);
  if(dist<.18){q.path.shift();return}
  const speed=q===p?MODES[q.mode].speed*(q.stamina<8?.73:1):q.speed;
  const step=Math.min(dist,speed*dt);
  q.x+=dx/dist*step;q.z+=dz/dist*step;q.heading=Math.atan2(-dx,-dz);q.walking=true;
}
function updatePlayer(dt){
  if(!p.alive)return;
  p.buff=isBoosted(p);
  if(p.action){
    p.path=[];p.action.remaining-=dt;
    if(p.action.remaining<=0){
      const action=p.action;p.action=null;
      if(action.type==='heal'){
        p.medkits--;p.hp=Math.min(p.maxHp,p.hp+48);sound.pickup();note('SOINS TERMINÉS · +48 PV MAX.');
      }else if(action.type==='loot'){
        const got=loot.collect(p,action.item);
        if(got){pickupsCollected++;sound.pickup();note(got,4)}
      }
    }
  }else moveAlong(p,dt);
  const breathing=p.mode==='sprint'&&p.walking?-16:p.mode==='sneak'?8:10;
  p.stamina=Math.max(0,Math.min(100,p.stamina+dt*breathing));
  if(p.mode==='sprint'&&p.stamina<=1){p.mode='walk';note('ESSOUFFLÉ · PASSAGE EN MARCHE')}
  p.nearCover=stealth.coverNear(p);p.buff=isBoosted(p);
  p.actor.group.position.set(p.x,world.heightAt(p.x,p.z),p.z);
  const s=p.mode==='sneak'?.66:1;
  p.actor.torso.scale.y+=(s-p.actor.torso.scale.y)*Math.min(1,dt*10);
  p.actor.head.position.y+=((p.mode==='sneak'?1.52:1.98)-p.actor.head.position.y)*Math.min(1,dt*8);
  p.actor.selection.material.color.set(p.mode==='sneak'?0xe9c77c:0x9dd3b6);
  p.cooldown=Math.max(0,p.cooldown-dt);p.hitWarning=Math.max(0,p.hitWarning-dt);
  if(p.reload>0){
    p.reload-=dt;
    if(p.reload<=0){
      const qty=Math.min(p.magazine-p.ammo,p.reserve);
      p.ammo+=qty;p.reserve-=qty;
      p.inventory[p.weapon].ammo=p.ammo;p.inventory[p.weapon].reserve=p.reserve;
    }
  }else if(!p.action&&p.ammo<=0&&p.reserve>0)startReload();
  else if(p.autoFire&&!p.action&&p.cooldown<=0&&p.ammo>0){
    const z=nearestTarget(p);if(z)shoot(p,z);
  }
  p.footstep-=dt;
  if(p.walking&&p.footstep<=0){
    stealth.noise(p.x,p.z,MODES[p.mode].footstep,'footstep',time);
    sound.step(p.mode);
    p.footstep=p.mode==='sprint'?.4:p.mode==='sneak'?.86:.6;
  }
  if(p.walking){
    p.animation+=dt*(p.mode==='sprint'?12:p.mode==='sneak'?5.5:8.6);
    p.actor.legs[0].rotation.x=Math.sin(p.animation)*(p.mode==='sneak'?.18:.36);
    p.actor.legs[1].rotation.x=-Math.sin(p.animation)*(p.mode==='sneak'?.18:.36);
    p.actor.group.rotation.y=p.heading;
  }else{p.actor.legs[0].rotation.x*=.7;p.actor.legs[1].rotation.x*=.7}
  p.actor.hpBar.scale.x=Math.max(.02,p.hp/p.maxHp);p.actor.hpBar.position.x=-(1-p.hp/p.maxHp)*.47;
  p.actor.hpGroup.quaternion.copy(camera.quaternion);
  torch.intensity=p.flashlight?11:0;
  torch.position.set(p.x,world.heightAt(p.x,p.z)+1.8,p.z);
  torch.target.position.set(p.x-Math.sin(p.heading)*9,world.heightAt(p.x,p.z)+.3,p.z-Math.cos(p.heading)*9);
  torch.target.updateMatrixWorld();
  beam.visible=p.flashlight;
  if(p.flashlight){beam.position.set(p.x-Math.sin(p.heading)*4,world.heightAt(p.x,p.z)+1.1,p.z-Math.cos(p.heading)*4);beam.rotation.y=p.heading}
}
function updateInfected(dt){
  for(let i=zombies.length-1;i>=0;i--){
    const z=zombies[i];
    if(z.hp<=0){zombies.splice(i,1);continue}
    z.think-=dt;z.cd-=dt;
    const distance=Math.hypot(p.x-z.x,p.z-z.z);
    const sees=stealth.visibleTo(z,p);
    if(z.think<=0){
      const decision=stealth.updateZombie(z,p,time);
      if(decision.state==='chase'||decision.state==='search'||decision.state==='investigate'){
        const target=decision.destination;
        if(target&&Math.hypot(target.x-z.x,target.z-z.z)>.85)z.path=world.pathfind(z,target);
      }else{
        if(!z.path.length&&Math.random()<.32){
          const home=z.origin,d=Math.random()*3.2,angle=Math.random()*Math.PI*2;
          const target={x:home.x+Math.cos(angle)*d,z:home.z+Math.sin(angle)*d};
          if(!world.obstruction(target.x,target.z,.4))z.path=world.pathfind(z,target);
        }
      }
      z.think=(sees?.52:1.3)+Math.random()*.42;
    }
    if(distance<.89&&p.alive&&Math.abs(world.heightAt(p.x,p.z)-world.heightAt(z.x,z.z))<.75){
      if(z.cd<=0){
        const protection=p.mode==='sneak'&&hasCover(p)?.18:0;
        p.hp=Math.max(0,p.hp-z.damage*(1-protection));z.cd=1.55;
        p.hitWarning=1.1;note('CONTACT · -'+Math.ceil(z.damage*(1-protection))+' PV',1.2);
        if(!p.hp){p.alive=false;p.actor.group.rotation.z=-.9;end(false)}
      }
    }else moveAlong(z,dt);
    z.actor.group.position.set(z.x,world.heightAt(z.x,z.z),z.z);
    z.actor.group.rotation.y=z.heading;
    z.actor.group.visible=vision.canSee(z.x,z.z);
    z.actor.hpGroup.visible=z.actor.group.visible&&(z.alert||z.hp<z.maxHp);
    z.actor.hpBar.scale.x=Math.max(.01,z.hp/z.maxHp);
    z.actor.hpBar.position.x=-(1-z.hp/z.maxHp)*.47;
    z.actor.hpGroup.quaternion.copy(camera.quaternion);
    z.animation+=dt*(z.walking?5.2:1.4);
    z.actor.legs[0].rotation.x=Math.sin(z.animation)*.25;
    z.actor.legs[1].rotation.x=-Math.sin(z.animation)*.25;
  }
}
function updateLoot(dt){
  loot.update(time,vision);
  const item=loot.nearest(p);
  lastPickupLabel=item?loot.meta[item.type].name:'';
}
function checkExtraction(){
  if(p.alive&&Math.hypot(p.x-extraction.x,p.z-extraction.z)<extraction.radius)end(true);
}
function missionHud(){
  const dist=Math.hypot(p.x-extraction.x,p.z-extraction.z),full=Math.hypot(start.x-extraction.x,start.z-extraction.z);
  $('wave').textContent='EXTRACTION · '+Math.round(dist)+' M';
  $('progress').style.width=Math.round(Math.max(0,Math.min(1,1-dist/full))*100)+'%';
  $('progressText').textContent=vision.explorationPercent()+' % DE LA VILLE EXPLORÉE';
  $('waveState').textContent=p.hp>0?'SURVIE · '+Math.round(p.hp)+' PV':'HORS COMBAT';
  $('infected').textContent='??';$('kills').textContent=String(kills).padStart(2,'0');
  $('money').textContent=credits.toLocaleString('fr-FR')+' €';
}
function updateHud(force=false){
  if(!force&&time-lastHud<.18)return;lastHud=time;
  const weapon=WEAPONS[p.weapon],stats=combatStats(p),cover=hasCover(p);
  $('currentAgent').textContent='SURVIVANT';
  $('place').textContent=p.action?(p.action.type==='heal'?'SOINS EN COURS':'FOUILLE EN COURS'):cover?'POSITION À COUVERT':p.mode==='sneak'?'PROGRESSION DISCRÈTE':p.mode==='sprint'?'EN COURSE':'EN DÉPLACEMENT LIBRE';
  $('accuracy').textContent=Math.round(stats.accuracy*100)+' %';
  $('firerate').textContent=stats.cadence.toFixed(1)+' /s';$('range').textContent=stats.range+' M';
  $('buff').textContent=cover?'COUVERT / STABILITÉ · PRÉCISION AMÉLIORÉE':'UTILISEZ MURS, VOITURES ET MURETS';
  $('buff').classList.toggle('on',cover);
  $('ammoStatus').textContent=weapon.name+' · '+p.ammo+' / '+p.reserve+' '+weapon.caliber;
  $('lootStatus').textContent=pickupsCollected+' CACHES FOUILLÉES';
  $('healthVal').textContent=Math.ceil(p.hp)+' / 100';
  $('healthBar').style.width=p.hp+'%';
  $('staminaVal').textContent=Math.round(p.stamina)+' / 100';
  $('staminaBar').style.width=p.stamina+'%';
  $('threatLabel').textContent=stealth.threat(p,zombies);
  $('threatLabel').dataset.level=$('threatLabel').textContent;
  $('searchHint').textContent=p.action?'ACTION · '+Math.ceil(p.action.remaining)+' S':lastPickupLabel?'[ E ] FOUILLER · '+lastPickupLabel:'APPROCHEZ-VOUS DES CACHES POUR FOUILLER';
  $('medkitCount').textContent='SOINS × '+p.medkits;
  $('autoFire').textContent=p.autoFire?'TIR AUTO : ON':'TIR AUTO : OFF';
  $('autoFire').classList.toggle('active',p.autoFire);
  $('flashlight').textContent=p.flashlight?'LAMPE : ON':'LAMPE : OFF';
  $('flashlight').classList.toggle('active',p.flashlight);
  $('actionProgress').style.width=p.action?Math.round((1-p.action.remaining/p.action.total)*100)+'%':'0%';
  for(const mode of ['sneak','walk','sprint'])$('mode-'+mode).classList.toggle('active',p.mode===mode);
  for(const key of ['pistol','carbine','shotgun']){
    const el=$('weapon-'+key);el.disabled=!p.unlocked[key];el.classList.toggle('active',p.weapon===key);
  }
  $('medkit').disabled=p.medkits<=0||p.hp>=100;
  $('scavenge').disabled=!lastPickupLabel;
  missionHud();
}
function tick(dt){
  time+=dt;
  updatePlayer(dt);
  if(time-lastVisionUpdate>.16){
    const radius=(p.mode==='sneak'?15:19)+(p.flashlight?7:0)+(world.heightAt(p.x,p.z)>1.5?5:0);
    vision.update(p,radius);lastVisionUpdate=time;
  }
  updateInfected(dt);updateLoot(dt);fx.update(dt);checkExtraction();
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/e.max);
    if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}
  }
  if(notifyExpiry<time)$('notice').classList.remove('visible');
  updateHud();
}
function drawMiniMap(){
  const canvas=$('minimap'),g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  const {minX,maxX,minZ,maxZ}=world.bounds,wx=maxX-minX,wz=maxZ-minZ,sx=w/wx,sz=h/wz;
  const px=x=>(x-minX)*sx,pz=z=>(z-minZ)*sz;
  g.fillStyle='#0a1417';g.fillRect(0,0,w,h);
  // La carte ne révèle jamais les rues et les obstacles non explorés.
  const cells=83,rows=60,cellX=wx/cells,cellZ=wz/rows;
  for(let zi=0;zi<rows;zi++)for(let xi=0;xi<cells;xi++){
    const x=minX+(xi+.5)*cellX,z=minZ+(zi+.5)*cellZ;
    if(!vision.discovered(x,z))continue;
    let fill='#455750';
    if(world.footprints.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2))fill='#202b2c';
    else if(world.roadX.some(a=>Math.abs(x-a)<4.7)||world.roadZ.some(a=>Math.abs(z-a)<4.7))fill='#5a665e';
    if(!vision.canSee(x,z))fill=fill==='#202b2c'?'#182425':'#354640';
    g.fillStyle=fill;g.fillRect(xi*w/cells,zi*h/rows,Math.ceil(w/cells)+.3,Math.ceil(h/rows)+.3);
  }
  for(const item of loot.items)if(!item.found&&vision.discovered(item.x,item.z)){
    g.fillStyle=item.type==='medkit'?'#a0dcb4':'#d4bb81';g.fillRect(px(item.x)-1,pz(item.z)-1,3,3);
  }
  for(const z of zombies)if(z.hp>0&&vision.canSee(z.x,z.z)){
    g.fillStyle='#cf8777';g.beginPath();g.arc(px(z.x),pz(z.z),2.1,0,Math.PI*2);g.fill();
  }
  // L'emplacement du point B est donné par le scénario, pas sa topographie.
  g.strokeStyle='#8ddbb2';g.lineWidth=1.7;g.beginPath();g.arc(px(extraction.x),pz(extraction.z),4.2,0,Math.PI*2);g.stroke();
  g.fillStyle='#cefde5';g.font='bold 10px sans-serif';g.fillText('B',px(extraction.x)-3,pz(extraction.z)-6);
  g.fillStyle='#f7d78d';g.beginPath();g.arc(px(p.x),pz(p.z),4,0,Math.PI*2);g.fill();
  g.strokeStyle='#bbd4c4';g.lineWidth=1;g.beginPath();g.moveTo(px(cameraCenter.x)-5,pz(cameraCenter.z));g.lineTo(px(cameraCenter.x)+5,pz(cameraCenter.z));
  g.moveTo(px(cameraCenter.x),pz(cameraCenter.z)-5);g.lineTo(px(cameraCenter.x),pz(cameraCenter.z)+5);g.stroke();
}

let zoom=.89,azimuth=-.74,cameraCenter=new T.Vector3(start.x,0,start.z);
function cameraUpdate(){
 const d=44,a=1.02;
 camera.position.set(cameraCenter.x+d*Math.sin(azimuth)*Math.cos(a),cameraCenter.y+d*Math.sin(a),cameraCenter.z+d*Math.cos(azimuth)*Math.cos(a));
 camera.lookAt(cameraCenter);
 sun.position.set(cameraCenter.x-18,31,cameraCenter.z+16);
 sun.target.position.set(cameraCenter.x,0,cameraCenter.z);sun.target.updateMatrixWorld();
}
function resize(){
 const w=innerWidth,h=innerHeight,k=(w<700?20:17.6)*zoom;
 camera.left=-k*w/h;camera.right=k*w/h;camera.top=k;camera.bottom=-k;camera.updateProjectionMatrix();
 renderer.setSize(w,h);cameraUpdate();
}
window.addEventListener('resize',resize);resize();
const canvas=renderer.domElement;let drag=null;
function clickGround(e){
 const r=canvas.getBoundingClientRect();
 mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 pickCircle.setFromCamera(mouse,camera);
 return world.clickPoint(pickCircle);
}
function commandMove(point){
 if(!p.alive)return;
 if(world.obstruction(point.x,point.z,.4)){note('PASSAGE BOUCHÉ');return}
 const path=world.pathfind(p,point);
 if(!path.length){note('ITINÉRAIRE INACCESSIBLE');return}
 p.path=path;p.destination=point;
 if(p.action){p.action=null;note('ACTION INTERROMPUE')}
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.button!==2)return;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,center:cameraCenter.clone(),moved:false,button:e.button};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(dx,dy)>6)drag.moved=true;
 if(drag.moved){
  const k=.039*zoom,hor=new T.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),ver=new T.Vector3(-Math.sin(azimuth),0,-Math.cos(azimuth));
  cameraCenter.copy(drag.center).addScaledVector(hor,-dx*k).addScaledVector(ver,dy*k);
  cameraUpdate();
 }
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const old=drag;drag=null;
 if(ended||old.moved||old.button===2)return;
 const point=clickGround(e);if(point)commandMove(point);
});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.54,Math.min(2.1,zoom*(e.deltaY>0?1.075:.93)));resize()},{passive:false});
function recenter(){cameraCenter.set(p.x,0,p.z);cameraUpdate();note('CAMÉRA RECENTRÉE · SANS SUIVI',1.6)}
$('locate').onclick=recenter;
$('minimap').onclick=e=>{
 const r=e.currentTarget.getBoundingClientRect(),u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;
 cameraCenter.set(world.bounds.minX+u*(world.bounds.maxX-world.bounds.minX),0,world.bounds.minZ+v*(world.bounds.maxZ-world.bounds.minZ));cameraUpdate();
};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ REPRENDRE':'Ⅱ PAUSE'};
$('speed').onclick=()=>{rate=rate===1?2:1;$('speed').textContent=rate+'×'};
$('sound').onclick=()=>{sound.unlock();const muted=sound.setMuted(!sound.muted);$('sound').textContent=muted?'SON OFF':'♫ SON ON'};
$('newGame').onclick=()=>location.reload();$('restartButton').onclick=()=>location.reload();
for(const mode of ['sneak','walk','sprint'])$('mode-'+mode).onclick=()=>setMode(mode);
for(const key of ['pistol','carbine','shotgun'])$('weapon-'+key).onclick=()=>switchWeapon(key);
$('autoFire').onclick=()=>{p.autoFire=!p.autoFire;updateHud(true);note(p.autoFire?'TIR AUTO ON · LES TIRS FONT DU BRUIT':'TIR AUTO OFF · DISCRÉTION',2)};
$('flashlight').onclick=()=>{p.flashlight=!p.flashlight;updateHud(true);note(p.flashlight?'LAMPE ALLUMÉE · VISIBILITÉ MAIS DÉTECTION ACCRUE':'LAMPE ÉTEINTE',2)};
$('reload').onclick=startReload;$('medkit').onclick=startHeal;$('scavenge').onclick=startLoot;
window.addEventListener('keydown',e=>{
 if(['input','textarea','select'].includes(document.activeElement?.tagName?.toLowerCase()))return;
 const key=e.key.toLowerCase();sound.unlock();
 if(key==='1')switchWeapon('pistol');if(key==='2')switchWeapon('carbine');if(key==='3')switchWeapon('shotgun');
 if(key==='z')setMode('sneak');if(key==='x')setMode('walk');if(key==='v')setMode('sprint');
 if(key==='f')$('autoFire').click();if(key==='l')$('flashlight').click();
 if(key==='r')startReload();if(key==='h')startHeal();if(key==='e')startLoot();if(key==='c')recenter();
 if(e.code==='Space'){e.preventDefault();$('pause').click()}
 if(key==='escape'&&paused)$('pause').click();
});
vision.update(p,19);loot.update(0,vision);updateHud(true);
note('SURVIE TACTIQUE · FOUILLEZ, CONTOURNEZ, RESTEZ DISCRET',5);
let previous=performance.now(),lastMapDraw=-999;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.042,(now-previous)/1000);previous=now;
 if(!paused&&!ended)tick(dt*rate);
 world.updateVisuals(now/1000);weather.update(dt,cameraCenter);
 if(now-lastMapDraw>280){drawMiniMap();lastMapDraw=now}
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
