/* ZONE ZÉRO — LA PHARMACIE : moteur de stratégie déterministe et testable */
export const W=24,H=16;
export const START={x:2,y:10}, EXIT={x:2,y:12}, MED={x:13,y:6};
export const PANEL={x:4,y:9}, ALARM={x:19,y:10};
export const DOORS=[{id:"front",x:12,y:9,name:"Entrée principale",noise:3},{id:"rear",x:10,y:4,name:"Grille arrière",noise:2},{id:"alley",x:8,y:6,name:"Portillon nord",noise:2}];
export const BUILDINGS=[
{x:0,y:0,w:7,h:6,type:"residential",name:"RÉSIDENCES"},
{x:18,y:0,w:6,h:6,type:"industrial",name:"ATELIERS"},
{x:0,y:13,w:8,h:3,type:"residential",name:"HABITATIONS"},
{x:19,y:13,w:5,h:3,type:"industrial",name:"ENTREPÔT"},
{x:9,y:4,w:8,h:6,type:"pharmacy",name:"PHARMACIE"},
{x:10,y:0,w:5,h:2,type:"residential",name:"ANCIEN HÔTEL"}];
export const OBSTACLES=[
{x:13,y:12,w:3,h:1,type:"bus"}, {x:7,y:10,w:2,h:1,type:"car"},
{x:17,y:11,w:1,h:2,type:"car"}, {x:20,y:7,w:2,h:1,type:"car"},
{x:6,y:7,w:1,h:2,type:"rubble"}, {x:10,y:11,w:1,h:1,type:"dumpster"},
{x:16,y:12,w:1,h:1,type:"barrier"}, {x:7,y:4,w:1,h:1,type:"barrier"},
{x:17,y:8,w:1,h:1,type:"dumpster"}];
export const SPAWNS=[
{x:11,y:10,patrol:[[11,10],[12,10],[11,11]]},
{x:14,y:10,patrol:[[14,10],[15,10],[14,11]]},
{x:18,y:8,patrol:[[18,8],[18,7],[19,8]]},
{x:18,y:9,patrol:[[18,9],[18,10],[19,9]]},
{x:21,y:10,patrol:[[21,10],[20,10],[21,11]]},
{x:17,y:6,patrol:[[17,6],[17,7],[18,7]]},
{x:11,y:3,patrol:[[11,3],[12,3],[11,2]]},
{x:8,y:8,patrol:[[8,8],[8,7],[8,9]]},
{x:9,y:12,patrol:[[9,12],[9,11],[8,12]]},
{x:22,y:7,patrol:[[22,7],[22,8],[23,8]]}];
export const MODES={sneak:{name:"Se faufiler",steps:2,noise:0,view:2},walk:{name:"Marcher",steps:3,noise:2,view:4},sprint:{name:"Courir",steps:5,noise:6,view:6}};
export const inside=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const near=(a,b)=>manhattan(a,b)<=1;
export const doorAt=(x,y)=>DOORS.find(d=>d.x===x&&d.y===y);
export const obstacleAt=(x,y)=>OBSTACLES.find(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h);
const block=new Set(),wall=new Set(),pharmacy=new Set(),K=(x,y)=>y*W+x;
for(const b of BUILDINGS)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){
 if(b.type==="pharmacy"){
  pharmacy.add(K(x,y));
  if(x===b.x||x===b.x+b.w-1||y===b.y||y===b.y+b.h-1)wall.add(K(x,y));
 }else block.add(K(x,y));
}
for(const d of DOORS)wall.delete(K(d.x,d.y));
for(const o of OBSTACLES)for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)block.add(K(x,y));
export const isPharmacy=(x,y)=>pharmacy.has(K(x,y));
export function passable(s,x,y){
 if(!inside(x,y)||block.has(K(x,y))||wall.has(K(x,y)))return false;
 const d=doorAt(x,y);return !d||s.doors[d.id];
}
export function opaque(s,x,y){return !passable(s,x,y)}
export function lineOfSight(s,a,b){
 let x=a.x,y=a.y,dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=x<b.x?1:-1,sy=y<b.y?1:-1,err=dx-dy;
 for(let i=0;i<W+H;i++){
  if(x===b.x&&y===b.y)return true;
  if(!(x===a.x&&y===a.y)&&opaque(s,x,y))return false;
  const e2=2*err;
  if(e2>-dy){err-=dy;x+=sx}
  if(e2<dx){err+=dx;y+=sy}
 }return false;
}
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const occupied=(s,x,y,exclude=-1)=>s.zombies.some(z=>z.hp>0&&z.id!==exclude&&z.x===x&&z.y===y);
export function route(s,from,to,exclude=-1,avoidZombies=true){
 if(!inside(from.x,from.y)||!passable(s,to.x,to.y))return [];
 const src=K(from.x,from.y),goal=K(to.x,to.y);if(src===goal)return[{...from}];
 const pred=new Int32Array(W*H).fill(-1),q=[src];pred[src]=src;
 for(let i=0;i<q.length;i++){
  const value=q[i],x=value%W,y=Math.floor(value/W);
  if(value===goal)break;
  for(const [dx,dy] of DIRS){
   const nx=x+dx,ny=y+dy,j=K(nx,ny);
   if(!passable(s,nx,ny)||pred[j]>=0||(avoidZombies&&occupied(s,nx,ny,exclude)&&j!==goal))continue;
   pred[j]=value;q.push(j);
  }
 }
 if(pred[goal]<0)return[];
 const reversed=[];let curr=goal;
 while(curr!==src){reversed.push({x:curr%W,y:Math.floor(curr/W)});curr=pred[curr]}
 return[{...from},...reversed.reverse()];
}
export function createState(){
 return {turn:0,status:"playing",mode:"sneak",tool:"move",player:{...START,hp:3,stamina:4,ammo:3,reserve:2,medkits:1,bottles:2,medicine:false},
  doors:{front:false,rear:false,alley:false},alarm:{active:0,used:false},kills:0,
  zombies:SPAWNS.map((z,id)=>({...z,id,hp:2,alert:0,target:null,phase:"errant",patrolIndex:0})),
  events:["Récupérez les médicaments puis revenez au point d'extraction."],lastNoise:null};
}
export const clone=s=>JSON.parse(JSON.stringify(s));
function hear(s,at,radius,name){
 s.lastNoise={...at,radius,name};
 for(const z of s.zombies)if(z.hp>0&&dist(z,at)<=radius){
  z.target={...at};z.alert=name==="alarme"?5:3;z.phase="attiré";
 }
}
function zombiesTurn(s){
 const p=s.player,occupiedNext=new Set();let attacked=false;
 for(const z of s.zombies){
  if(z.hp<=0)continue;
  const sees=lineOfSight(s,z,p)&&dist(z,p)<=MODES[s.mode].view;
  if(sees){z.target={x:p.x,y:p.y};z.alert=3;z.phase="poursuit"}
  else if(z.alert>0){z.alert--;if(z.phase==="poursuit")z.phase="cherche"}
  else{z.target=null;z.phase="errant"}
  // Chaque infecté est lent : une seule case de déplacement par tour.
  if(near(z,p)){if(!attacked){p.hp--;attacked=true;s.events.push("Un infecté vous blesse : −1 santé.");}occupiedNext.add(K(z.x,z.y));continue}
  let target=z.target;
  if(!target&&s.turn%2===0){
   z.patrolIndex=(z.patrolIndex+1)%z.patrol.length;
   const pt=z.patrol[z.patrolIndex];target={x:pt[0],y:pt[1]};
  }
  if(target){
   let path=route(s,z,target,z.id,true);
   if(path.length<2)path=route(s,z,target,z.id,false);
   if(path.length>1){
    const next=path[1],key=K(next.x,next.y);
    if(!occupiedNext.has(key)&&!(next.x===p.x&&next.y===p.y)&&!occupied(s,next.x,next.y,z.id)){
     z.x=next.x;z.y=next.y;
    }
   }
  }
  occupiedNext.add(K(z.x,z.y));
 }
 if(p.hp<=0){p.hp=0;s.status="lost";s.events.push("Vous êtes tombé sous les coups des infectés.")}
}
function endTurn(s,actionNoise){
 s.turn++;s.lastNoise=null;
 if(s.alarm.active>0){hear(s,ALARM,11,"alarme");s.alarm.active--}
 if(actionNoise)hear(s,actionNoise,actionNoise.radius,actionNoise.name);
 zombiesTurn(s);
 if(s.status==="playing"&&s.player.medicine&&near(s.player,EXIT)){
  s.status="won";s.events.push("Extraction réussie : les médicaments sont récupérés.")
 }
 return s;
}
export function plannedPath(s,to){
 if(!to||!passable(s,to.x,to.y))return null;
 const full=route(s,s.player,to,-1,false);
 if(full.length<2)return null;
 let count=Math.min(MODES[s.mode].steps,full.length-1);
 if(s.mode==="sprint"){
  const dx=full[1].x-full[0].x,dy=full[1].y-full[0].y;
  for(let i=2;i<=count;i++)if(full[i].x-full[i-1].x!==dx||full[i].y-full[i-1].y!==dy){count=i-1;break}
 }
 return full.slice(0,count+1);
}
export function nearby(s){
 const p=s.player;return [
  ...DOORS.filter(d=>!s.doors[d.id]&&near(p,d)).map(d=>({type:"interact",at:{x:d.x,y:d.y},label:"Ouvrir · "+d.name})),
  ...(!s.alarm.used&&near(p,PANEL)?[{type:"interact",at:PANEL,label:"Déclencher l'alarme"}]:[]),
  ...(!p.medicine&&near(p,MED)?[{type:"interact",at:MED,label:"Récupérer les médicaments"}]:[])
 ];
}
export function apply(s,action){
 if(s.status!=="playing")return false;
 const p=s.player;s.events=[];
 if(action.type==="move"){
  const path=plannedPath(s,action.to);
  if(!path){s.events=["Aucun chemin accessible."];return false}
  if(s.mode==="sprint"&&p.stamina<2){s.events=["Trop fatigué pour courir : marchez ou attendez."];return false}
  let reached=0;for(let i=1;i<path.length;i++){
   if(occupied(s,path[i].x,path[i].y))break;
   p.x=path[i].x;p.y=path[i].y;reached++;
  }
  p.stamina=Math.min(4,Math.max(0,p.stamina+(s.mode==="sprint"?-2:1)));
  s.events.push(reached===0?"Un infecté bloque le passage.":MODES[s.mode].name+" : "+reached+" case(s).");
  endTurn(s,{x:p.x,y:p.y,radius:MODES[s.mode].noise,name:s.mode});return true;
 }
 if(action.type==="interact"){
  const at=action.at;
  if(!at||!near(p,at)){s.events=["Approchez-vous pour interagir."];return false}
  const door=doorAt(at.x,at.y);
  if(door){
   if(s.doors[door.id]){s.events=["Cette porte est déjà ouverte."];return false}
   s.doors[door.id]=true;s.events.push(door.name+" ouverte.");
   endTurn(s,{...at,radius:door.noise,name:"porte"});return true;
  }
  if(at.x===PANEL.x&&at.y===PANEL.y){
   if(s.alarm.used){s.events=["Alarme déjà déclenchée."];return false}
   s.alarm.used=true;s.alarm.active=8;s.events.push("L'alarme du véhicule retentit pendant huit tours.");
   endTurn(s);return true;
  }
  if(at.x===MED.x&&at.y===MED.y){
   if(p.medicine){s.events=["Vous avez déjà les médicaments."];return false}
   p.medicine=true;s.events.push("Médicaments récupérés. Rejoignez l'extraction !");
   endTurn(s,{x:p.x,y:p.y,radius:1,name:"fouille"});return true;
  }
  s.events=["Rien à activer ici."];return false;
 }
 if(action.type==="bottle"){
  if(p.bottles<=0){s.events=["Vous n'avez plus de bouteilles."];return false}
  if(!action.to||!inside(action.to.x,action.to.y)||dist(p,action.to)>6){s.events=["Portée du lancer : six cases."];return false}
  p.bottles--;s.events=["La bouteille se brise. Des infectés se dirigent vers le bruit."];
  endTurn(s,{...action.to,radius:8,name:"bouteille"});return true;
 }
 if(action.type==="shoot"){
  if(p.ammo<=0){s.events=["Chargeur vide."];return false}
  const to=action.to;
  if(!to||dist(p,to)>7||!lineOfSight(s,p,to)){s.events=["Cible masquée ou hors de portée."];return false}
  const z=s.zombies.find(z=>z.hp>0&&z.x===to.x&&z.y===to.y);
  if(!z){s.events=["Aucun infecté à viser ici."];return false}
  p.ammo--;z.hp--;s.events=[z.hp>0?"Infecté touché.":"Infecté éliminé."];
  if(z.hp===0)s.kills++;
  endTurn(s,{...p,radius:13,name:"tir"});return true;
 }
 if(action.type==="reload"){
  if(p.ammo>=4||p.reserve===0){s.events=["Rechargement impossible."];return false}
  const n=Math.min(4-p.ammo,p.reserve);p.ammo+=n;p.reserve-=n;s.events=["Chargeur rechargé (+"+n+")."];
  endTurn(s,{...p,radius:1,name:"recharge"});return true;
 }
 if(action.type==="heal"){
  if(p.hp===3||p.medkits<=0){s.events=["Pansement indisponible ou inutile."];return false}
  p.medkits--;p.hp=Math.min(3,p.hp+2);s.events=["Pansement utilisé."];
  endTurn(s,{...p,radius:1,name:"soins"});return true;
 }
 if(action.type==="wait"){
  p.stamina=Math.min(4,p.stamina+2);s.events=["Vous reprenez votre souffle."];
  endTurn(s);return true;
 }
 s.events=["Action inconnue."];return false;
}
export function simulate(s,action){
 const next=clone(s),valid=apply(next,action);
 return {valid,next,events:next.events,noise:next.lastNoise};
}
