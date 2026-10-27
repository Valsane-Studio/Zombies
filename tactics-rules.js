/* ZONE ZÉRO — LE CARREFOUR : règles pures, sans rendu. */
export const W=30,H=20;
export const START={x:2,z:10}, EXIT={x:28,z:9};
export const STYLES={
 sneak:{label:'SE FAUFILER',steps:2,noise:1,visibility:3},
 walk:{label:'MARCHER',steps:3,noise:3,visibility:5},
 sprint:{label:'COURIR',steps:5,noise:7,visibility:8}
};
export const WEAPONS={
 pistol:{label:'PISTOLET 9 MM',range:9,damage:1,noise:14},
 shotgun:{label:'FUSIL À POMPE',range:4,damage:2,noise:17}
};
export const FEATURES=[
 {kind:'building',x:1,z:1,w:9,h:6,color:0},
 {kind:'building',x:18,z:1,w:10,h:6,color:1},
 {kind:'building',x:1,z:14,w:8,h:5,color:2},
 {kind:'building',x:21,z:14,w:8,h:5,color:3},
 {kind:'building',x:12,z:1,w:4,h:3,color:1},
 {kind:'building',x:13,z:17,w:5,h:3,color:0},
 {kind:'bus',x:13,z:9,w:5,h:2},
 {kind:'car',x:8,z:9,w:2,h:1,rotation:0},
 {kind:'car',x:22,z:8,w:1,h:2,rotation:1},
 {kind:'car',x:4,z:13,w:2,h:1,rotation:0},
 {kind:'car',x:17,z:13,w:2,h:1,rotation:0},
 {kind:'dumpster',x:10,z:11,w:1,h:1},
 {kind:'dumpster',x:24,z:11,w:1,h:1},
 {kind:'barrier',x:19,z:11,w:2,h:1},
 {kind:'barrier',x:6,z:7,w:2,h:1},
 {kind:'wreck',x:25,z:13,w:2,h:1}
];
export const STASHES=[
 {id:'s1',x:10,z:13,type:'ammo',amount:4},
 {id:'s2',x:15,z:7,type:'bottle',amount:1},
 {id:'s3',x:19,z:7,type:'shotgun',amount:2},
 {id:'s4',x:20,z:12,type:'heal',amount:1},
 {id:'s5',x:25,z:7,type:'ammo',amount:3}
];
export const ZOMBIE_STARTS=[
 {x:7,z:11,patrol:[{x:7,z:11},{x:6,z:12},{x:7,z:12}]},
 {x:12,z:7,patrol:[{x:12,z:7},{x:12,z:8},{x:11,z:8}]},
 {x:19,z:9,patrol:[{x:19,z:9},{x:19,z:10},{x:20,z:10}]},
 {x:23,z:12,patrol:[{x:23,z:12},{x:23,z:13},{x:22,z:13}]},
 {x:10,z:16,patrol:[{x:10,z:16},{x:11,z:16},{x:11,z:15}]},
 {x:22,z:6,patrol:[{x:22,z:6},{x:23,z:6},{x:23,z:7}]},
 {x:27,z:11,patrol:[{x:27,z:11},{x:28,z:11},{x:28,z:10}]}
];
export const key=(x,z)=>z*W+x;
export const inside=(x,z)=>x>=0&&x<W&&z>=0&&z<H;
const solid=new Set(),obscure=new Set(),cover=new Set();
for(const f of FEATURES)for(let z=f.z;z<f.z+f.h;z++)for(let x=f.x;x<f.x+f.w;x++){
 const k=key(x,z);solid.add(k);cover.add(k);
 if(f.kind==='building'||f.kind==='bus'||f.kind==='wreck')obscure.add(k);
}
export const passable=(x,z)=>inside(x,z)&&!solid.has(key(x,z));
export const coverAt=(x,z)=>cover.has(key(x,z));
export const sightBlocking=(x,z)=>obscure.has(key(x,z));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
export const adjacent=(x,z)=>[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>({x:x+dx,z:z+dz})).filter(p=>passable(p.x,p.z));
export function rayCells(a,b){
 const out=[];let x=a.x,z=a.z;
 const dx=Math.abs(b.x-x),dz=Math.abs(b.z-z),sx=x<b.x?1:-1,sz=z<b.z?1:-1;
 let err=dx-dz;
 for(let i=0;i<W+H+2;i++){
  out.push({x,z});if(x===b.x&&z===b.z)break;
  const e2=err*2;if(e2>-dz){err-=dz;x+=sx}if(e2<dx){err+=dx;z+=sz}
 }return out;
}
export function hasLOS(a,b){
 const cells=rayCells(a,b);
 for(let i=1;i<cells.length-1;i++)if(sightBlocking(cells[i].x,cells[i].z))return false;
 return true;
}
export function isInCover(p){
 return adjacent(p.x,p.z).some(c=>coverAt(c.x,c.z))||
  [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>coverAt(p.x+dx,p.z+dz));
}
export function pathfind(a,b,allowed=null,avoid=null){
 if(!passable(b.x,b.z))return [];
 if(a.x===b.x&&a.z===b.z)return [{x:a.x,z:a.z}];
 const prev=new Int32Array(W*H);prev.fill(-1);
 const origin=key(a.x,a.z),goal=key(b.x,b.z),q=[origin];
 prev[origin]=origin;
 for(let index=0;index<q.length;index++){
  const i=q[index],x=i%W,z=Math.floor(i/W);
  if(i===goal)break;
  for(const p of adjacent(x,z)){
   const k=key(p.x,p.z);
   if(prev[k]!==-1||(allowed&&!allowed.has(k)&&k!==goal)||(avoid&&avoid.has(k)&&k!==goal))continue;
   prev[k]=i;q.push(k);
  }
 }
 if(prev[goal]===-1)return [];
 const output=[];let at=goal;
 for(let limit=0;at!==origin&&limit<W*H;limit++){
  output.push({x:at%W,z:Math.floor(at/W)});at=prev[at];
 }
 return [{x:a.x,z:a.z},...output.reverse()];
}
function computeVision(state){
 const p=state.player;state.visible=new Set();
 const r=7;
 for(let z=Math.max(0,p.z-r);z<=Math.min(H-1,p.z+r);z++)for(let x=Math.max(0,p.x-r);x<=Math.min(W-1,p.x+r);x++){
  if(distance(p,{x,z})>r+.25)continue;
  if(hasLOS(p,{x,z})||sightBlocking(x,z)){
   // Building facades can be seen on the edge, but not through the block.
   if(hasLOS(p,{x,z})||rayCells(p,{x,z}).slice(1,-1).every(t=>!sightBlocking(t.x,t.z))){
    state.visible.add(key(x,z));state.explored.add(key(x,z));
   }
  }
 }
}
export function createState(){
 const s={turn:0,phase:'playing',mode:'walk',weapon:'pistol',tool:'move',
  player:{...START,hp:3,maxHp:3,mag:4,reserve:4,shells:0,bottles:2,medkits:1,shotgun:false},
  zombies:ZOMBIE_STARTS.map((p,id)=>({...p,id,hp:2,alive:true,brain:'errant',target:null,memory:0,patrolIndex:0})),
  stashes:STASHES.map(p=>({...p,looted:false})),visible:new Set(),explored:new Set(),
  noise:null,events:[{type:'intro',text:'Traversez le carrefour. Le bruit peut vous sauver… ou vous condamner.'}],
  lastAction:null,kills:0};
 computeVision(s);return s;
}
function canZombieSee(s,z){
 const p=s.player;
 if(!hasLOS(z,p))return false;
 let vision=STYLES[s.mode].visibility;
 if(s.mode==='sneak'&&isInCover(p))vision=2;
 return distance(z,p)<=vision;
}
function applyNoise(s,origin,radius,label){
 s.noise={x:origin.x,z:origin.z,radius,label};
 for(const z of s.zombies)if(z.alive&&distance(z,origin)<=radius){
  z.target={x:origin.x,z:origin.z};z.memory=3;z.brain='alerte';
 }
}
function moveZombies(s){
 const occupied=new Set(s.zombies.filter(z=>z.alive).map(z=>key(z.x,z.z)));
 for(const z of s.zombies){
  if(!z.alive)continue;
  occupied.delete(key(z.x,z.z));
  if(canZombieSee(s,z)){
   z.target={x:s.player.x,z:s.player.z};z.brain='poursuite';z.memory=3;
  }else if(z.memory>0){
   z.memory--;
   if(z.brain==='poursuite')z.brain='recherche';
  }else{z.target=null;z.brain='errant'}
  if(manhattan(z,s.player)===1){
   s.player.hp--;s.events.push({type:'hurt',text:'Un infecté vous atteint. -1 santé.'});
   occupied.add(key(z.x,z.z));continue;
  }
  let destination=z.target;
  if(!destination&&s.turn%2===0){
   z.patrolIndex=(z.patrolIndex+1)%z.patrol.length;
   destination=z.patrol[z.patrolIndex];
  }
  if(destination&&!(z.x===destination.x&&z.z===destination.z)){
   let path=pathfind(z,destination,null,occupied);
   if(!path.length)path=pathfind(z,destination);
   if(path.length>1){
    const next=path[1];
    if(passable(next.x,next.z)&&!occupied.has(key(next.x,next.z))&&!(next.x===s.player.x&&next.z===s.player.z)){
     z.x=next.x;z.z=next.z;
    }
   }
  }
  occupied.add(key(z.x,z.z));
 }
 if(s.player.hp<=0){s.player.hp=0;s.phase='lost';s.events.push({type:'end',text:'Vous êtes tombé au carrefour.'})}
}
export function preview(s,dest){
 const p=s.player;
 if(s.phase!=='playing')return{valid:false,reason:'La mission est terminée.'};
 if(!inside(dest.x,dest.z))return{valid:false,reason:'Hors du secteur.'};
 if(s.tool==='bottle'){
  if(p.bottles<=0)return{valid:false,reason:'Plus de bouteilles.'};
  if(distance(p,dest)>7)return{valid:false,reason:'Portée du lancer : 7 cases maximum.'};
  if(!s.visible.has(key(dest.x,dest.z)))return{valid:false,reason:'Il faut voir le point de chute.'};
  return{valid:true,kind:'bottle',end:dest,radius:9,steps:0,text:'BRIS DE VERRE · bruit sur 9 cases'};
 }
 if(s.tool==='shoot'){
  const zombie=s.zombies.find(z=>z.alive&&z.x===dest.x&&z.z===dest.z);
  if(!zombie||!s.visible.has(key(dest.x,dest.z)))return{valid:false,reason:'Sélectionnez un infecté visible.'};
  if(s.weapon==='pistol'&&p.mag===0)return{valid:false,reason:'Chargeur vide : recharger.'};
  if(s.weapon==='shotgun'&&p.shells===0)return{valid:false,reason:'Plus de cartouches.'};
  if(distance(p,dest)>WEAPONS[s.weapon].range||!hasLOS(p,dest))return{valid:false,reason:'Hors de portée ou ligne de tir bloquée.'};
  return{valid:true,kind:'shoot',zombie,end:dest,radius:WEAPONS[s.weapon].noise,text:'TIR · bruit très important'};
 }
 if(!s.explored.has(key(dest.x,dest.z)))return{valid:false,reason:'Zone inconnue. Explorez progressivement.'};
 if(!passable(dest.x,dest.z))return{valid:false,reason:'Obstacle : passage impossible.'};
 if(s.zombies.some(z=>z.alive&&z.x===dest.x&&z.z===dest.z))return{valid:false,reason:'Un infecté bloque cette case.'};
 const route=pathfind(p,dest,s.explored);
 if(route.length<2)return{valid:false,reason:'Déjà sur place ou passage bloqué.'};
 const steps=Math.min(STYLES[s.mode].steps,route.length-1);
 const end=route[steps];
 return{valid:true,kind:'move',route:route.slice(0,steps+1),end,steps,radius:STYLES[s.mode].noise,
  text:STYLES[s.mode].label+' · '+steps+' case'+(steps>1?'s':'')+(steps<route.length-1?' (trajet partiel)':'')};
}
function resolveTurn(s,event,action){
 s.lastAction=action;
 if(event)applyNoise(s,event.point,event.radius,event.label);
 else s.noise=null;
 s.turn++;
 computeVision(s);
 moveZombies(s);
 computeVision(s);
 if(s.phase==='playing'&&s.player.x===EXIT.x&&s.player.z===EXIT.z){
  s.phase='won';s.events.push({type:'end',text:'Vous avez traversé le carrefour.'});
 }
 return s;
}
export function act(s,action){
 if(s.phase!=='playing')return false;
 s.events=[];
 const p=s.player;
 if(action.type==='move'||action.type==='bottle'||action.type==='shoot'){
  s.tool=action.type==='move'?'move':action.type;
  const choice=preview(s,action.target);
  if(!choice.valid){s.events.push({type:'invalid',text:choice.reason});return false}
  if(action.type==='move'){
   p.x=choice.end.x;p.z=choice.end.z;
   s.events.push({type:'move',text:choice.text});
   resolveTurn(s,{point:{x:p.x,z:p.z},radius:choice.radius,label:s.mode},action);
  }else if(action.type==='bottle'){
   p.bottles--;s.events.push({type:'bottle',text:'Une bouteille se brise. La horde entend le bruit.'});
   resolveTurn(s,{point:choice.end,radius:9,label:'bouteille'},action);
  }else{
   if(s.weapon==='pistol')p.mag--;else p.shells--;
   choice.zombie.hp-=WEAPONS[s.weapon].damage;
   if(choice.zombie.hp<=0){choice.zombie.alive=false;s.kills++;s.events.push({type:'kill',text:'Infecté neutralisé.'})}
   else s.events.push({type:'shot',text:'Infecté touché : il tient encore debout.'});
   resolveTurn(s,{point:{x:p.x,z:p.z},radius:choice.radius,label:'détonation'},action);
  }
  return true;
 }
 if(action.type==='wait'){
  s.events.push({type:'wait',text:'Vous attendez et observez.'});resolveTurn(s,null,action);return true;
 }
 if(action.type==='reload'){
  if(p.mag>=6||p.reserve<=0){s.events.push({type:'invalid',text:'Pas de rechargement possible.'});return false}
  const amount=Math.min(6-p.mag,p.reserve);p.mag+=amount;p.reserve-=amount;
  s.events.push({type:'reload',text:'Chargeur rechargé : +'+amount+' balles.'});resolveTurn(s,{point:p,radius:2,label:'rechargement'},action);return true;
 }
 if(action.type==='heal'){
  if(p.medkits<=0||p.hp===p.maxHp){s.events.push({type:'invalid',text:'Pas de soins nécessaires ou disponibles.'});return false}
  p.medkits--;p.hp=Math.min(p.maxHp,p.hp+2);
  s.events.push({type:'heal',text:'Pansement appliqué : santé restaurée.'});resolveTurn(s,{point:p,radius:2,label:'soins'},action);return true;
 }
 if(action.type==='loot'){
  const stash=s.stashes.find(l=>!l.looted&&l.x===p.x&&l.z===p.z);
  if(!stash){s.events.push({type:'invalid',text:'Aucune cache sur cette position.'});return false}
  stash.looted=true;
  if(stash.type==='ammo')p.reserve+=stash.amount;
  if(stash.type==='heal')p.medkits+=stash.amount;
  if(stash.type==='bottle')p.bottles+=stash.amount;
  if(stash.type==='shotgun'){p.shotgun=true;p.shells+=stash.amount}
  s.events.push({type:'loot',text:stash.type==='shotgun'?'Vous trouvez un fusil à pompe et deux cartouches.':'Vous récupérez '+(stash.type==='ammo'?'des munitions':stash.type==='heal'?'un pansement':'une bouteille')+'.'});
  resolveTurn(s,{point:p,radius:2,label:'fouille'},action);return true;
 }
 return false;
}
export const visibleZombies=s=>s.zombies.filter(z=>z.alive&&s.visible.has(key(z.x,z.z)));
export const hereStash=s=>s.stashes.find(l=>!l.looted&&l.x===s.player.x&&l.z===s.player.z);
export function analysisOf(s){
 return {turn:s.turn,noise:s.noise,seen:visibleZombies(s).length,alive:s.zombies.filter(z=>z.alive).length,explored:s.explored.size,kills:s.kills,mode:s.mode,phase:s.phase};
}
