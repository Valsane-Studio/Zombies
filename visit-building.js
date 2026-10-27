/* ZONE ZÉRO — un seul immeuble réellement explorable.
  Architecture 3D, porte, hall, escalier, appartement, toit, fenêtre arrière.
  La visite est indépendante du système de zombies/inventaire. */
export function createVisitBuilding(T,scene){
 const root=new T.Group();scene.add(root);
 const shader=(color,roughness=.9)=>new T.MeshStandardMaterial({color,roughness,metalness:.03});
 const m={
  stone:shader('#8c948b'),edge:shader('#b3ada0'),plaster:shader('#bbb7a7'),
  stain:shader('#5e645b'),brick:shader('#896b62'),wood:shader('#725b48'),
  wood2:shader('#9f8770'),metal:new T.MeshStandardMaterial({color:'#65716e',metalness:.56,roughness:.6}),
  glass:new T.MeshPhysicalMaterial({color:'#7f9292',transparent:true,opacity:.32,roughness:.24,metalness:.2,depthWrite:false}),
  roof:shader('#555e57'),floor:shader('#9a917b'),dark:shader('#273431'),
  dust:shader('#a5a08f'),fabric:shader('#62766d'),rust:shader('#986b55'),paper:shader('#c5b8a0'),
  green:shader('#647751')
 };
 const group=(parent=root)=>{const g=new T.Group();parent.add(g);return g};
 const mesh=(parent,geo,material,x,y,z,cast=true)=>{
  const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o
 };
 const box=(p,x,y,z,w,h,d,mat)=>mesh(p,new T.BoxGeometry(w,h,d),mat,x,y,z);
 const tube=(p,x,y,z,r,h,mat)=>mesh(p,new T.CylinderGeometry(r,r,h,10),mat,x,y,z);
 // Plan de masse : x=-27..-7, z=-37..-23, hauteur 6.6m.
 const PX=-17,PZ=-30,X0=-27,X1=-7,Z0=-37,Z1=-23,Y0=.16,Y1=3.42,Y2=6.70;
 const ground=group(),upper=group(),roof=group(),trim=group(),furnishing=group();
 function wall(p,x,y,z,w,h,d,mat=m.plaster){
  box(p,x,y,z,w,h,d,mat);
  if(h>2.5)box(p,x,y-h/2+.18,z,w,.12,d+.06,m.stain);
 }
 // Rez-de-chaussée : devanture en partie éventrée, mais vraie porte au centre.
 box(ground,PX,Y0-.09,PZ,20,.18,14,m.floor);
 wall(ground,X0+.15,1.65,PZ,.32,3.1,14,m.brick);
 wall(ground,X1-.15,1.65,PZ,.32,3.1,14,m.brick);
 wall(ground,-22.5,1.65,Z1,9,3.1,.34,m.brick);
 wall(ground,-11.5,1.65,Z1,9,3.1,.34,m.brick);
 wall(ground,-22.05,1.65,Z0,10.1,3.1,.34,m.brick);
 wall(ground,-13.6,1.65,Z0,6.8,3.1,.34,m.brick);
 // L'encadrement de la vraie entrée.
 box(ground,-18.25,1.75,Z1-.12,.23,3.45,.45,m.edge);
 box(ground,-15.75,1.75,Z1-.12,.23,3.45,.45,m.edge);
 box(ground,-17,3.34,Z1-.15,2.8,.36,.5,m.edge);
 const entranceDoor=group(ground);entranceDoor.position.set(-18.18,0,-22.87);
 const doorLeaf=box(entranceDoor,1.10,1.49,0,2.20,2.98,.12,m.wood);
 tube(entranceDoor,2.01,1.38,-.13,.04,.13,m.metal);
 // Fenêtre arrière : traversée possible après avoir atteint l'arrière-cour.
 wall(ground,-7.93,1.65,Z0,1.84,3.1,.34,m.brick);
 const rearFrame=group(ground);
 box(rearFrame,-9.24,2.7,-37,.21,.65,.45,m.edge);
 box(rearFrame,-10.3,2.7,-37,.20,.65,.45,m.edge);
 box(rearFrame,-9.75,3.01,-37,1.25,.12,.45,m.edge);
 box(rearFrame,-9.75,2.39,-37,1.25,.12,.45,m.edge);
 // Porte condamnée à gauche, visible mais impossible à ouvrir.
 box(ground,-24.3,1.27,-22.79,1.95,2.50,.12,m.metal);
 for(let i=0;i<4;i++){const plank=box(ground,-24.3,1.0+i*.45,-22.6,2.7,.16,.23,m.wood2);plank.rotation.z=i%2?.18:-.13}
 box(ground,-24.2,3.14,-22.65,2.7,.26,.3,m.rust);
 // Deux panneaux crevés et autres éléments de ruine.
 for(let i=0;i<7;i++){
  const x=-26+((i*7)%17),z=-25-(i%3)*4;
  box(ground,x,.18,z,.4,.12,.65,i%2?m.brick:m.edge).rotation.y=i*.35;
 }
 // Hall au sol : carrelage, comptoir abandonné, réception.
 for(let k=0;k<15;k++){
  box(ground,-25.2+k*.8,.075,-25.5, .78,.02,1.8,k%5===0?m.wood2:m.floor);
 }
 box(ground,-10.8,.82,-28.25,3.6,1.64,.68,m.wood);
 box(ground,-10.8,1.7,-28.25,3.7,.12,.82,m.wood2);
 box(ground,-10.1,2.32,-27.85,.34,1.22,.27,m.rust);
 // Vieille table, deux chaises et affiche déchirée.
 box(ground,-16.3,.74,-33.2,2.1,.12,1.18,m.wood2);
 for(const dx of [-.73,.73])for(const dz of [-.37,.37])box(ground,-16.3+dx,.36,-33.2+dz,.12,.66,.12,m.wood);
 for(const z of [-32.0,-34.25]){
  box(ground,-13.8,.55,z,.52,.11,.45,m.wood2);box(ground,-13.8,.31,z,.1,.51,.13,m.wood);
 }
 // Escalier réel : douze marches montantes dans la cage à gauche.
 const stairs=group();
 for(let i=0;i<13;i++){
  const yy=.18+i*.25,zz=-35.85+i*.38;
  box(stairs,-24.25,yy,zz,2.60,.16,.45,m.stone);
 }
 box(stairs,-25.7,1.8,-32.8,.13,3.35,6.0,m.metal);
 for(let i=0;i<8;i++)tube(stairs,-25.7,.2+i*.44,-35.5+i*.52,.032,.75,m.metal);
 // Premier étage : palier + appartement à explorer, véritable plancher.
 box(upper,PX,Y1-.08,PZ,19.8,.16,13.8,m.floor);
 for(const x of [-24,-21,-18,-15,-12,-9])for(const z of [-35,-32,-29,-26]){
  box(upper,x,Y1+.009,z,2.65,.014,2.6,(Math.round(x+z)%3===0)?m.wood2:m.floor);
 }
 wall(upper,-26.85,Y1+1.55,PZ,.28,3.1,13.7,m.plaster);
 wall(upper,-7.15,Y1+1.55,PZ,.28,3.1,13.7,m.plaster);
 wall(upper,PX,Y1+1.55,Z0+.14,19.7,3.1,.28,m.plaster);
 wall(upper,-21.9,Y1+1.55,Z1-.14,10.0,3.1,.28,m.plaster);
 wall(upper,-12.3,Y1+1.55,Z1-.14,9.2,3.1,.28,m.plaster);
 // Cloison séparation appartement / palier, avec ouverture au centre.
 const partitionZ=-29.65;
 wall(upper,-23.8,Y1+1.55,partitionZ,6.0,3.1,.16,m.plaster);
 wall(upper,-10.25,Y1+1.55,partitionZ,6.1,3.1,.16,m.plaster);
 // Deux morceaux de cloison de part et d'autre de la porte, jamais un mur invisible à traverser.
 const aptHinge=new T.Group();aptHinge.position.set(-18.5,Y1,partitionZ);upper.add(aptHinge);
 box(aptHinge,.93,1.45,0,1.86,2.85,.10,m.wood);
 box(aptHinge,1.64,1.32,-.11,.075,.075,.16,m.metal);
 // Appartement : bibliothèque, matelas, table, radiateur, bureau poussiéreux.
 box(upper,-12.0,Y1+.56,-34.65,3.4,1.07,.65,m.wood);
 for(let i=0;i<15;i++)box(upper,-13.40+i*.2,Y1+1.22,-34.50,.12,.9,.36,i%3?m.paper:m.fabric);
 box(upper,-16,Y1+.29,-34.0,3.2,.43,1.55,m.fabric);
 box(upper,-16,Y1+.54,-34.8,3.4,.25,.35,m.paper);
 box(upper,-11.9,Y1+.73,-31.95,2.05,.12,1.1,m.wood2);
 for(const dx of [-.8,.8])for(const dz of [-.34,.34])box(upper,-11.9+dx,Y1+.36,-31.95+dz,.12,.62,.13,m.wood);
 box(upper,-8.2,Y1+1.2,-32.9,.35,1.4,1.9,m.edge);
 // Fenêtres avec vues depuis l'étage, plutôt que murs pleins opaques.
 for(const x of [-23,-13]){
  box(upper,x,Y1+1.62,Z1-.33,2.2,1.65,.10,m.dark);
  box(upper,x,Y1+1.62,Z1-.43,1.9,1.35,.045,m.glass);
 }
 // Couronnement : toit accessible avec parapet et ventilation.
 box(roof,PX,Y2-.12,PZ,20.2,.25,14.2,m.roof);
 for(const [x,z,w,d] of [[PX,Z0,20,.38],[PX,Z1,20,.38],[X0,PZ,.38,14],[X1,PZ,.38,14]])
  box(roof,x,Y2+.35,z,w,.9,d,m.edge);
 box(roof,-15.2,Y2+.58,-33.3,2.3,1.18,1.7,m.metal);
 box(roof,-15.2,Y2+1.25,-33.3,2.55,.14,2,m.rust);
 for(let i=0;i<9;i++){
  const x=-25+i*1.7;
  const weed=tube(roof,x,Y2+.14,-36.2,.038,.45,m.green);
  weed.rotation.z=i%2?.22:-.3;
 }
 const hatch=box(roof,-24.1,Y2+.07,-31.8,2.3,.15,2.1,m.wood2);
 // Éclairages intérieurs chaleureux et discrets.
 const light=new T.PointLight('#f2d8ac',4.4,18,2);light.position.set(-17,2.9,-28.2);root.add(light);
 const topLight=new T.PointLight('#e7d5b8',3.7,17,2);topLight.position.set(-16,Y1+2.6,-32.4);root.add(topLight);
 // Hotspots nommés. Un clic déclenche un vrai déplacement puis une interaction.
 const hotspots=[],hitMeshes=[];
 function hotspot(id,label,x,y,z,level,approachX,approachZ,color='#d7c398'){
  const shell=new T.Group();shell.position.set(x,y,z);scene.add(shell);
  const ring=mesh(shell,new T.RingGeometry(.43,.56,32),
   new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.86,depthWrite:false}),0,.09,0,false);
  ring.rotation.x=-Math.PI/2;ring.renderOrder=9;
  const halo=mesh(shell,new T.SphereGeometry(.27,12,9),
   new T.MeshBasicMaterial({color,transparent:true,opacity:.57,depthWrite:false}),0,.60,0,false);
  const hit=mesh(shell,new T.SphereGeometry(.85,12,9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),
   0,.55,0,false);
  hit.userData.hotspot=id;hitMeshes.push(hit);
  const marker={id,label,x,y,z,level,approachX:approachX??x,approachZ:approachZ??z,group:shell,ring,halo,hit};
  hotspots.push(marker);return marker;
 }
 hotspot('entrance','Ouvrir et entrer',-17,0,-23,0,-17,-21.3);
 hotspot('blocked','Porte condamnée',-24.3,0,-23,0,-24.3,-21.4,'#ad746b');
 hotspot('stairsUp','Monter au premier étage',-24.1,.1,-33.4,0,-22.7,-32.15);
 hotspot('window','Passer par la fenêtre arrière',-9.75,0,-37,0,-9.5,-35.1);
 hotspot('aptDoor','Ouvrir l’appartement',-17.45,Y1,-29.65,1,-17.5,-28.2);
 hotspot('roofUp','Accéder au toit',-24.1,Y1,-33.0,1,-23.5,-33.0);
 hotspot('stairsDown','Redescendre au hall',-22.6,Y1,-26.4,1,-22.6,-27.0);
 hotspot('roofDown','Redescendre du toit',-24.1,Y2,-32.0,2,-23.5,-32.0);
 hotspot('note','Observer les lieux',-11.85,Y1,-31.9,1,-12.7,-32.0,'#a7c7af');
 let level=0,entranceOpen=false,apartmentOpen=false,transition=null,currentInside=false;
 const now={x:-17,z:-30};
 const inside=(x,z)=>x>X0+.15&&x<X1-.15&&z>Z0+.15&&z<Z1-.15;
 const collisionRect=(x,z,r,cx,cz,w,d)=>{
  const dx=Math.max(cx-w/2,Math.min(x,cx+w/2))-x;
  const dz=Math.max(cz-d/2,Math.min(z,cz+d/2))-z;
  return dx*dx+dz*dz<r*r;
 };
 const hitWall=(x,z,r,lev)=>{
  if(lev===2)return !inside(x,z);
  if(lev===1){
   if(!inside(x,z))return true;
   // Cloison de l'appartement, passage central uniquement si la porte est ouverte.
   if(collisionRect(x,z,r,-23.75,partitionZ,6.15,.30))return true;
   if(collisionRect(x,z,r,-10.25,partitionZ,6.15,.30))return true;
   if(!apartmentOpen&&collisionRect(x,z,r,-17.48,partitionZ,2.1,.3))return true;
   // Bibliothèque et lit restent des obstacles matériels.
   if(collisionRect(x,z,r,-12,-34.65,3.2,.9))return true;
   if(collisionRect(x,z,r,-16,-34,3,1.45))return true;
   return false;
  }
  // Niveau rue : façades bloquées à l'exception des passages réellement ouverts.
  if(x<X0-.25||x>X1+.25||z<Z0-.25||z>Z1+.25)return false;
  if(collisionRect(x,z,r,X0,PZ,.38,14.3)||collisionRect(x,z,r,X1,PZ,.38,14.3))return true;
  if(collisionRect(x,z,r,-22.5,Z1,9.1,.45)||collisionRect(x,z,r,-11.5,Z1,9.1,.45))return true;
  if(!entranceOpen&&collisionRect(x,z,r,-17,Z1,2.4,.45))return true;
  if(collisionRect(x,z,r,-22.05,Z0,10.1,.44)||collisionRect(x,z,r,-13.6,Z0,6.8,.44)||collisionRect(x,z,r,-7.93,Z0,1.84,.44))return true;
  // Fenêtre basse franchissable seulement par une interaction : pas de passage à pied automatique.
  if(collisionRect(x,z,r,-9.75,Z0,1.5,.44))return true;
  if(collisionRect(x,z,r,-10.8,-28.25,3.65,.8))return true;
  if(collisionRect(x,z,r,-16.3,-33.2,2.15,1.2))return true;
  return false;
 };
 function updateVisibility(player){
  currentInside=inside(player.position.x,player.position.z)||level!==0;
  roof.visible=!currentInside||level===2;
  upper.visible=!currentInside||level>=1;
  // La cloison avant est visuellement pleine dehors et cesse de masquer le hall dedans.
  // Les éléments de décor du hall sont visibles uniquement au niveau rue.
  upper.traverse?.(o=>{if(o.isMesh)o.material?.needsUpdate&&(o.material.needsUpdate=true)});
  for(const h of hotspots){
   let visible=h.level===level&&!transition;
   if(h.id==='entrance')visible=level===0&&!currentInside&&!entranceOpen;
   if(h.id==='stairsUp')visible=level===0&&currentInside;
   if(h.id==='window')visible=level===0&&Math.abs(player.position.x-h.x)<24;
   if(h.id==='blocked')visible=level===0&&!currentInside;
   if(h.id==='aptDoor')visible=level===1&&!apartmentOpen;
   h.group.visible=!!visible;
  }
 }
 function getHotspot(raycaster){
  const results=raycaster.intersectObjects(hitMeshes.filter(x=>x.parent?.visible),false);
  if(!results.length)return null;
  return hotspots.find(h=>h.id===results[0].object.userData.hotspot&&h.group.visible)||null;
 }
 function animateTransition(player,where,lev,duration=1.42){
  transition={elapsed:0,duration,from:player.position.clone(),to:new T.Vector3(where[0],where[1],where[2]),level:lev};
  return 'Passage en cours…';
 }
 function activate(id,player){
  if(transition)return '';
  if(id==='blocked')return 'Cette porte est déformée et condamnée : impossible d’entrer.';
  if(id==='entrance'){
   entranceOpen=true;
   entranceDoor.rotation.y=-1.44;
   return 'La porte du hall s’ouvre. Vous pouvez entrer.';
  }
  if(id==='window'){
   const fromInside=inside(player.position.x,player.position.z);
   return animateTransition(player,[-9.75,.12,fromInside?-39.0:-35.4],0,1.05);
  }
  if(id==='stairsUp'&&level===0)return animateTransition(player,[-22.7,Y1+.03,-32.5],1,1.55);
  if(id==='stairsDown'&&level===1)return animateTransition(player,[-22.8,.12,-32.2],0,1.45);
  if(id==='roofUp'&&level===1)return animateTransition(player,[-23.8,Y2+.04,-32.5],2,1.55);
  if(id==='roofDown'&&level===2)return animateTransition(player,[-23.5,Y1+.03,-32.7],1,1.55);
  if(id==='aptDoor'&&level===1){
   apartmentOpen=true;aptHinge.rotation.y=-1.5;
   return 'La porte de l’appartement s’ouvre sur une pièce abandonnée.';
  }
  if(id==='note')return 'Une table couverte de poussière. Un carnet et des photographies ont été laissés derrière.';
  return '';
 }
 function update(dt,player){
  if(transition){
   transition.elapsed+=dt;
   const t=Math.min(1,transition.elapsed/transition.duration);
   const eased=t*t*(3-2*t);
   player.position.copy(transition.from).lerp(transition.to,eased);
   if(t>=1){level=transition.level;transition=null;}
  }
  updateVisibility(player);
 }
 function approachFor(h,player){
  if(h.id==='window'&&!inside(player.position.x,player.position.z))return new T.Vector3(-9.75,.12,-38.55);
  return new T.Vector3(h.approachX,level===1?Y1+.03:level===2?Y2+.04:.12,h.approachZ);
 }
 return {get level(){return level},get transitioning(){return !!transition}, get inside(){return currentInside},
  collides:hitWall,getHotspot,approachFor,activate,update,insideBounds:inside,world:root,
  get markers(){return hotspots},get entranceOpen(){return entranceOpen},get apartmentOpen(){return apartmentOpen}
 };
}
