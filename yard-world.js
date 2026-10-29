/* ZONE ZÉRO / COUR INDUSTRIELLE — étude 06.
   Vrai décor 3D, lisibilité cinématographique 2.5D.
   Géométrie décorative indépendante des collisions, sols praticables explicites.
*/
export function createIndustrialYard(T,scene){
 let rngState=790152;
 const rand=()=>((rngState=Math.imul(rngState,1664525)+1013904223>>>0)/4294967296);
 const range=(a,b)=>a+(b-a)*rand();
 const pick=a=>a[Math.floor(rand()*a.length)];
 const materials={
  asphalt:new T.MeshStandardMaterial({color:0x66777d,roughness:.96}),
  concrete:new T.MeshStandardMaterial({color:0x78888a,roughness:.94}),
  concreteLight:new T.MeshStandardMaterial({color:0x9eaaa7,roughness:.97}),
  concreteDark:new T.MeshStandardMaterial({color:0x4b5d63,roughness:.98}),
  steel:new T.MeshStandardMaterial({color:0x222b30,roughness:.67,metalness:.57}),
  steelLight:new T.MeshStandardMaterial({color:0x536369,roughness:.75,metalness:.44}),
  rust:new T.MeshStandardMaterial({color:0x5f514b,roughness:.91,metalness:.27}),
  shadow:new T.MeshStandardMaterial({color:0x35444a,roughness:.96}),
  glass:new T.MeshStandardMaterial({color:0x293d45,roughness:.35,metalness:.27}),
  leaf:new T.MeshStandardMaterial({color:0x526762,roughness:1,flatShading:true}),
  leafLight:new T.MeshStandardMaterial({color:0x708079,roughness:1,flatShading:true}),
  grass:new T.MeshStandardMaterial({color:0x71827a,roughness:1,side:T.DoubleSide,transparent:true,alphaTest:.13,depthWrite:false}),
  chalk:new T.MeshStandardMaterial({color:0xaaa99d,roughness:1}),
  glow:new T.MeshBasicMaterial({color:0xe3cfaa}),
  damp:new T.MeshStandardMaterial({color:0x3c545a,roughness:.32,metalness:.08,transparent:true,opacity:.52,depthWrite:false}),
 };
 function concreteMap(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const g=canvas.getContext('2d');
  g.fillStyle='#859093';g.fillRect(0,0,512,512);
  for(let i=0;i<22000;i++){
   const x=rand()*512,y=rand()*512,s=.4+rand()*3.6;
   g.globalAlpha=.035+rand()*.19;
   g.fillStyle=rand()>.47?'#d4d0bd':'#2b3c44';
   g.fillRect(x,y,s,s*(.2+rand()));
  }
  g.globalAlpha=1;
  for(let i=0;i<18;i++){
   let x=rand()*512,y=rand()*512;g.strokeStyle='#35454c';g.globalAlpha=.2+rand()*.25;g.lineWidth=.35+rand();
   g.beginPath();g.moveTo(x,y);
   for(let j=0;j<5;j++){x+=(rand()-.5)*37;y+=12+rand()*20;g.lineTo(x,y)}g.stroke();
  }g.globalAlpha=1;
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(14,10);tex.anisotropy=8;
  return tex;
 }
 const pavementTexture=concreteMap();
 materials.asphalt.map=pavementTexture;
 materials.asphalt.bumpMap=pavementTexture;materials.asphalt.bumpScale=.035;
 function mesh(geo,mat,x=0,y=0,z=0,parent=scene,shadow=true){
  const o=new T.Mesh(geo,mat);o.position.set(x,y,z);
  o.receiveShadow=true;o.castShadow=shadow;parent.add(o);return o;
 }
 function box(x,y,z,w,h,d,mat=materials.concrete,parent=scene,sh=true){
  return mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent,sh);
 }
 function pole(a,b,r,mat=materials.steel,parent=scene,segments=8){
  const aa=new T.Vector3(...a),bb=new T.Vector3(...b),v=bb.clone().sub(aa);
  const n=mesh(new T.CylinderGeometry(r,r,v.length(),segments),mat,
   (a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5,parent);
  n.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return n;
 }
 function path(x,y,z,w,d,mat){
  const t=mesh(new T.PlaneGeometry(w,d),mat,x,y,z,scene,false);t.rotation.x=-Math.PI/2;return t;
 }
 const colliders=[];
 const addCollider=(cx,cz,w,d,kind='solid')=>colliders.push({cx,cz,hx:w*.5,hz:d*.5,kind});
 // Cour et architecture : vraie échelle, personnage ~1.65m.
 box(0,-.48,0,88,.95,62,materials.concreteDark,scene,false);
 const mainGround=path(0,.015,0,84,58,materials.asphalt);
 mainGround.userData.walkable=true;
 path(-16,.025,-2,17,31,materials.concrete);
 path(24,.027,11,20,18,materials.concrete);
 // Dalles cassées, joints et flaques réfléchissantes, jamais bloquantes.
 for(let i=0;i<31;i++){
  const x=range(-36,37),z=range(-24,25);
  if(x>0&&x<18&&z>-15&&z<-7)continue;
  const slab=box(x,.05,z,range(.4,3),.035,range(.5,2.1),pick([materials.concrete,materials.concreteLight,materials.asphalt]),scene,false);
  slab.rotation.y=range(-.16,.16);
 }
 for(let i=0;i<35;i++){
  const p=path(range(-35,36),.066,range(-24,25),range(.3,2.2),range(.3,1.7),materials.damp);
  p.rotation.z=rand()*Math.PI;
 }
 // Entrepôt gauche : surfaces pleines, ouvertures factices, conduits.
 box(-33,10,-15,14,20,22,materials.concreteDark);
 box(-26,8.4,-15,.65,16.8,21,materials.concrete);
 box(-33,19.9,-15,14.8,.7,22.8,materials.concreteDark);
 box(-33,9.4,-26,14.4,18.8,.5,materials.concreteDark);
 addCollider(-33,-15,14,22);
 for(let iz=0;iz<5;iz++){
  const z=-24+iz*4.5;
  for(let floor=0;floor<3;floor++){
   const y=4+floor*5.1;
   box(-25.57,y,z,.09,2.7,1.75,materials.glass,scene,false);
   box(-25.49,y,z,.12,.16,1.85,materials.steel);
   box(-25.49,y,z,.12,2.85,.12,materials.steel);
  }
 }
 for(let i=0;i<5;i++){
  const y=4+i*2.9;
  pole([-25.4,y,-21],[-25.4,y,-8],.032,materials.steelLight);
 }
 // Grands volumes industriels en arrière-plan.
 for(const spec of [
  {x:-1,z:-35,w:17,d:10,h:28},
  {x:25,z:-34,w:22,d:12,h:37},
  {x:46,z:-18,w:13,d:21,h:26},
  {x:-45,z:15,w:12,d:30,h:23},
 ]){
  box(spec.x,spec.h*.5-.1,spec.z,spec.w,spec.h,spec.d,pick([materials.concrete,materials.concreteDark,materials.shadow]));
  for(let i=0;i<5;i++){
   const xx=spec.x-spec.w*.4+i*spec.w*.20;
   box(xx,Math.min(spec.h-5,10),spec.z+spec.d*.502,1.15,4.4,.06,materials.glass,scene,false);
  }
 }
 // Mur de fond, très haut, masse et perspective.
 box(0,7,-31.6,88,14,1.1,materials.shadow);
 for(let i=0;i<17;i++){
  const x=-40+i*5.0;
  box(x,4.0,-30.93,.18,8.0,.35,materials.concreteDark);
 }
 // La partie haute au premier plan donne de l'échelle, hors zone joueur.
 for(let i=0;i<6;i++){
  const z=-29+i*10.7;
  pole([41,0,z],[41,22,z],.17,materials.steelLight);
 }
 // Rampe réellement praticable de 0 à 3.25 m.
 const ramp={x0:2,x1:18,z0:-12.4,z1:-6.8,y1:3.24};
 const slope=Math.atan2(ramp.y1,ramp.x1-ramp.x0);
 const rampLen=Math.hypot(ramp.y1,ramp.x1-ramp.x0);
 const rampVisual=box(10,1.62,-9.6,rampLen,.24,5.58,materials.steelLight);
 rampVisual.rotation.z=slope;
 const rampPick=mesh(new T.PlaneGeometry(rampLen,5.45),materials.concreteLight,10,1.75,-9.6,scene,false);
 // surface ramp via plan: rotation X = -PI/2, puis rotation? mesh normal orientation quaternions.
 rampPick.rotation.set(-Math.PI/2,0,slope);
 rampPick.visible=false; // clic sur la rampe géré par plan de sol et mesure de hauteur.
 // Platelage de la passerelle.
 const deck={x0:18,x1:38,z0:-14.3,z1:-4.9,y:3.24};
 box(28,3.11,-9.6,20,.24,9.3,materials.steelLight);
 path(28,3.246,-9.6,20,9.25,materials.concreteLight).userData.walkable=true;
 for(let i=0;i<17;i++)box(18+i*1.16,3.27,-9.6,.046,.01,9.15,materials.steel,scene,false);
 // La passerelle et sa rampe sont visiblement soutenues.
 for(const x of [18.7,26,33.5,37.4])for(const z of [-13.5,-5.5]){
  pole([x,0,z],[x,3.1,z],.13,materials.steel);
  pole([x,1.3,z],[x+1.35,3.05,z],.045,materials.steelLight);
 }
 // Garde-corps et contreventements noirs, silhouette de l'image de référence.
 function railingLine(x0,z0,x1,z1,hasDiagonal=true){
  const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
  const intervals=Math.max(2,Math.ceil(len/2.7));
  for(let i=0;i<=intervals;i++){
   const t=i/intervals,x=x0+dx*t,z=z0+dz*t;
   pole([x,3.32,z],[x,5.05,z],.048,materials.steel);
  }
  for(const h of [3.88,4.58,5.06])pole([x0,h,z0],[x1,h,z1],.046,materials.steel);
  if(hasDiagonal)
   for(let i=0;i<intervals;i++){
    const a=i/intervals,b=(i+1)/intervals;
    pole([x0+dx*a,3.36,z0+dz*a],[x0+dx*b,5.02,z0+dz*b],.035,materials.steel);
   }
 }
 railingLine(18,-14.25,38,-14.25);
 railingLine(38,-14.25,38,-5);
 railingLine(18,-5,38,-5);
 // Rampes sur les deux longs bords, montants avec la pente.
 for(const z of [-12.4,-6.8]){
  for(let i=0;i<9;i++){
   const t=i/8,x=2+16*t,y=3.24*t;
   pole([x,y+.15,z],[x,y+1.6,z],.048,materials.steel);
  }
  for(const h of [.68,1.58]){
   pole([2,h,z],[18,3.24+h,z],.055,materials.steel);
  }
  for(let i=0;i<8;i++){
   const x=2+i*2,y=i*3.24/8;
   pole([x,y+.16,z],[x+2,y+3.24/8+1.54,z],.034,materials.steel);
  }
 }
 // Grande structure tombée, arche et bras mécaniques (visuels, sans collision piège).
 for(const [a,b] of [
  [[18,3.05,12],[24,12.0,12]],
  [[24,12.0,12],[34,9.4,12]],
  [[34,9.4,12],[38,3.0,12]],
  [[18,3.05,12],[37,3.05,12]],
 ])pole(a,b,.13,materials.steel);
 for(let i=0;i<5;i++){
  const x=21+i*3.25;
  pole([x,3.2,12],[x+4.3,9.3,12],.052,materials.steelLight);
 }
 // Câbles arqués et anneau industriel monumental.
 const hoop=mesh(new T.TorusGeometry(2.55,.40,12,48),materials.steelLight,15.5,7.0,-26);
 hoop.rotation.y=Math.PI/2;hoop.rotation.z=.22;
 pole([15.5,2.4,-26],[15.5,11.0,-26],.11,materials.steel);
 for(let i=0;i<4;i++){
  const pts=[];
  for(let j=0;j<=15;j++){
   const t=j/15;
   pts.push(new T.Vector3(-10+i*5+t*2.2,13.7-3*t*t+Math.sin(t*Math.PI)*.18,-26+i*.25));
  }
  const cable=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),30,.023,5,false),materials.steel);
  cable.castShadow=false;
 }
 // Épave sculptée, sans éléments qui transpercent la circulation.
 const car=new T.Group();car.position.set(-3.5,0,10.4);car.rotation.y=.23;scene.add(car);
 box(0,.70,0,4.9,1.12,2.35,materials.shadow,car);
 box(-.27,1.54,0,2.55,.67,1.95,materials.glass,car);
 box(1.65,1.45,0,1.1,.17,2.28,materials.steelLight,car);
 for(const x of [-1.65,1.58])for(const z of [-1.17,1.17]){
  const tire=mesh(new T.CylinderGeometry(.59,.59,.31,14),materials.steel,x,.48,z,car);
  tire.rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(.25,.25,.34,10),materials.steelLight,x,.48,z,car).rotation.x=Math.PI/2;
 }
 addCollider(-3.5,10.4,5.9,3.3);
 // Chariot renversé, palettes, caisses et armoires électriques.
 box(-18,.23,-3.6,4.0,.42,2.5,materials.rust);
 box(-18,.51,-3.6,4.2,.15,2.6,materials.steel);
 for(let i=0;i<5;i++)box(-19.7+i*.82,.62,-3.6,.21,.11,2.3,materials.rust);
 addCollider(-18,-3.6,4.4,2.9);
 for(const [x,z,w,d] of [[-12,18,2.4,2],[-9.6,17,1.6,1.7],[22,9,2.6,3.1]]){
  const h=range(1.0,2.0);box(x,h*.5,z,w,h,d,pick([materials.shadow,materials.rust,materials.steelLight]));
  box(x,h+.015,z,w+.08,.09,d+.08,materials.steel);
  addCollider(x,z,w+.2,d+.2);
 }
 // Éboulis décoratifs, toujours hors volumes de déplacement importants.
 const rubble=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),materials.concrete,220);
 const object=new T.Object3D();
 for(let i=0;i<220;i++){
  const side=rand(),x=side<.5?range(-41,-28):range(27,41),z=range(-26,26),s=range(.09,.66);
  object.position.set(x,s*.35,z);object.rotation.set(rand()*3,rand()*6.28,rand()*2);
  object.scale.set(s*1.3,s*.65,s*1.2);object.updateMatrix();rubble.setMatrixAt(i,object.matrix);
 }
 rubble.castShadow=true;scene.add(rubble);
 // Mousse, racines et touffes le long des structures, détail léger.
 const grassTexture=(()=>{
  const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');
  for(let i=0;i<38;i++){
   const bx=40+rand()*45,tip=bx+range(-54,54),h=range(55,238);
   g.globalAlpha=range(.28,.9);g.fillStyle=pick(['#506c65','#637f75','#96a391','#3d635c']);
   g.beginPath();g.moveTo(bx-3,256);g.quadraticCurveTo(bx+range(-30,30),256-h*.5,tip,256-h);
   g.quadraticCurveTo(tip+2,256-h*.58,bx+3,256);g.fill();
  }
  g.globalAlpha=1;const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
 })();
 const grassMat=new T.MeshStandardMaterial({map:grassTexture,transparent:true,alphaTest:.18,side:T.DoubleSide,depthWrite:false,roughness:1});
 const grasses=new T.InstancedMesh(new T.PlaneGeometry(.36,.73),grassMat,1250);
 for(let i=0;i<1250;i++){
  let x,z;const mode=rand();
  if(mode<.34){x=range(-40,40);z=rand()>.5?range(-28,-24):range(24,28)}
  else if(mode<.67){x=rand()>.5?range(-40,-29):range(30,40);z=range(-26,27)}
  else{x=range(-40,40);z=range(-27,27)}
  const s=range(.3,1.4);
  object.position.set(x,s*.24,z);object.rotation.set(0,rand()*6.28,range(-.16,.16));
  object.scale.set(s,s,s);object.updateMatrix();grasses.setMatrixAt(i,object.matrix);
 }
 grasses.instanceMatrix.needsUpdate=true;grasses.frustumCulled=false;scene.add(grasses);
 // Arbres lointains dans la brume, silhouettes, grandes masses.
 for(let i=0;i<32;i++){
  const x=rand()>.5?range(-49,-37):range(37,49),z=range(-30,35),h=range(3.8,8);
  pole([x,0,z],[x,h*.7,z],.16,materials.rust);
  const top=mesh(new T.IcosahedronGeometry(1,1),pick([materials.leaf,materials.leafLight]),x,h*.73,z);
  top.scale.set(range(1.3,2.6),range(1.5,2.6),range(1.3,2.6));top.castShadow=false;
 }
 // Radio lumineuse : destination visuelle, pas de mission ni inventaire.
 const beacon=new T.Group();beacon.position.set(32,3.27,-10.1);scene.add(beacon);
 box(0,.38,0,1.05,.76,.75,materials.steel,beacon);
 box(0,.83,-.31,.85,.48,.12,materials.glass,beacon);
 box(0,1.08,0,.58,.16,.42,materials.steelLight,beacon);
 const light=mesh(new T.SphereGeometry(.115,12,8),materials.glow,.23,1.08,-.25,beacon,false);
 const pulse=new T.PointLight('#e8d5a3',2.9,12);pulse.position.set(.2,1.24,-.20);beacon.add(pulse);
 const boundaries={minX:-40,maxX:40,minZ:-28,maxZ:28};
 function heightAt(x,z){
  if(x>=ramp.x0&&x<=ramp.x1&&z>=ramp.z0&&z<=ramp.z1)
   return (x-ramp.x0)/(ramp.x1-ramp.x0)*ramp.y1;
  if(x>=deck.x0&&x<=deck.x1&&z>=deck.z0&&z<=deck.z1)return deck.y;
  return 0;
 }
 function isBlocked(x,z,r=.33){
  if(x<boundaries.minX+r||x>boundaries.maxX-r||z<boundaries.minZ+r||z>boundaries.maxZ-r)return true;
  for(const c of colliders){
   const dx=Math.max(c.cx-c.hx,Math.min(x,c.cx+c.hx))-x;
   const dz=Math.max(c.cz-c.hz,Math.min(z,c.cz+c.hz))-z;
   if(dx*dx+dz*dz<r*r)return true;
  }
  return false;
 }
 let time=0;
 function update(dt){
  time+=dt;
  pulse.intensity=2.45+.7*Math.sin(time*2.7)+.35*Math.sin(time*8.5);
  light.scale.setScalar(.85+.16*Math.sin(time*3));
 }
 return{heightAt,isBlocked,update,walkableMeshes:[mainGround],ramp,deck,beacon:beacon.position,
  colliders,materials,box,scene};
}
