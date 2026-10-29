/* ZONE ZÉRO · Un salon entièrement modélisé en 3D.
   Pièce unique 12x10m, mobilier, fenêtres, parquet, moisissures,
   objets, architecture abîmée, jardin au-dehors et collisions. */
import {createRoomMaterials} from './room-materials.js';
export function buildAbandonedRoom(T,scene){
 const {m,rnd,pick,matte}=createRoomMaterials(T);
 const root=new T.Group();scene.add(root);
 const obstacles=[],interactions=[],living=[];
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 const group=(parent=root)=>{const g=new T.Group();parent.add(g);return g};
 const mesh=(parent,geo,mat,x=0,y=0,z=0,cast=true)=>{
  const o=new T.Mesh(geo,mat);o.position.set(x,y,z);
  o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o
 };
 const box=(p,x,y,z,w,h,d,mat)=>mesh(p,new T.BoxGeometry(w,h,d),mat,x,y,z);
 const cyl=(p,x,y,z,r1,r2,h,mat,seg=12)=>mesh(p,new T.CylinderGeometry(r1,r2,h,seg),mat,x,y,z);
 function rounded(p,x,y,z,w,h,d,mat,r=.1){
  // Bevel réellement géométrique, moins cubique que les prototypes précédents.
  const sh=new T.Shape();sh.moveTo(-w/2+r,-h/2);
  sh.lineTo(w/2-r,-h/2);sh.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  sh.lineTo(w/2,h/2-r);sh.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  sh.lineTo(-w/2+r,h/2);sh.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
  sh.lineTo(-w/2,-h/2+r);sh.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const geo=new T.ExtrudeGeometry(sh,{depth:Math.max(.02,d-2*r),bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:2,steps:1,curveSegments:4});
  return mesh(p,geo,mat,x,y,z-d/2+r);
 }
 function collider(x,z,w,d){obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}
 function addTarget(id,label,x,y,z,onUse,description=''){
  const marker=mesh(root,new T.SphereGeometry(.28,10,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),x,y,z,false);
  marker.userData.action=id;
  const t={id,label,marker,onUse,description};interactions.push(t);return t
 }
 // PARQUET : ~500 vraies lames séparées, veinées, aux joints irréguliers.
 const parquet=new T.InstancedMesh(new T.BoxGeometry(1,.046,1),m.plank,600);
 const dummy=new T.Object3D();let count=0;
 for(let z=-4.90,row=0;z<4.92;z+=.285,row++){
  let x=-6.08+(row%3)*-.18;
  while(x<6.10&&count<600){
   const length=.78+rnd()*.34;
   dummy.position.set(x+length/2,.027,z);dummy.rotation.set(0,0,0);
   dummy.scale.set(length-.013,1,.268+rnd()*.009);dummy.updateMatrix();
   parquet.setMatrixAt(count,dummy.matrix);
   const shade=.73+rnd()*.27;
   parquet.setColorAt(count,new T.Color().setRGB(shade,shade*.92,shade*.83));
   count++;x+=length;
  }
 }
 parquet.count=count;parquet.instanceMatrix.needsUpdate=true;
 if(parquet.instanceColor)parquet.instanceColor.needsUpdate=true;
 parquet.receiveShadow=true;parquet.castShadow=false;root.add(parquet);
 box(root,0,-.065,0,12.0,.12,10,m.black);
 // Murs : les fenêtres ont de vraies ouvertures, pas de vitre collée à un cube.
 box(root,-6,2.04,0,.27,4.08,10,m.plaster);
 box(root,6,2.04,0,.27,4.08,10,m.plaster);
 const wallZones=[[-5.12,1.75],[-1.67,1.7],[1.67,1.7],[5.12,1.75]];
 for(const [cx,w]of wallZones)box(root,cx,2.02,-5,w,4.04,.30,m.plaster);
 for(const wx of [-3.35,0,3.35]){
  box(root,wx,.56,-5,1.7,1.12,.30,m.plaster);
  box(root,wx,3.89,-5,1.7,.3,.30,m.plaster);
  // Vieilles menuiseries, impostes et vitres survivantes.
  box(root,wx,2.36,-4.86,1.90,.105,.25,m.darkWood);
  box(root,wx,1.14,-4.86,1.90,.1,.25,m.darkWood);
  for(const side of [-1,1])box(root,wx+side*.88,2.39,-4.85,.115,2.66,.27,m.darkWood);
  box(root,wx,2.43,-4.845,.095,2.56,.20,m.darkWood);
  box(root,wx,3.0,-4.84,1.75,.07,.19,m.trim);
  box(root,wx,1.16,-4.70,1.95,.18,.4,m.darkWood);
  for(const side of [-1,1]){
   if(rnd()>.42){
    const pane=mesh(root,new T.PlaneGeometry(.72,1.13),m.glass,wx+side*.42,2.48,-4.91,false);
    pane.material=m.glass;
   }
  }
  // Rideaux déchirés et froissés, générés comme une vraie surface ondulée.
  for(const side of [-1,1]){
   const width=.62,height=2.3;
   const g=new T.PlaneGeometry(width,height,15,25),pos=g.attributes.position;
   for(let i=0;i<pos.count;i++){
    const px=pos.getX(i),py=pos.getY(i);
    const rag=.09*Math.sin(py*7+wx)+.044*Math.sin(px*26);
    pos.setZ(i,.10*Math.sin(px*24+py*.7)+rag);
    if(py<-.8)pos.setY(i,py+(rnd()-.5)*.065);
   }g.computeVertexNormals();
   const curtain=mesh(root,g,m.windowShade,wx+side*.69,2.25,-4.53,false);
   curtain.rotation.y=side*.15;
  }
  // Radiateurs anciens.
  box(root,wx,.55,-4.56,1.56,.58,.29,m.rust);
  for(let i=0;i<12;i++)rounded(root,wx-.68+i*.122,.57,-4.36,.085,.46,.12,m.metal,.022);
 }
 // Mur de l'entrée avec porte entrouverte et peinture écaillée.
 box(root,-5.0,2.04,5,2.0,4.08,.28,m.plaster);
 box(root,1.7,2.04,5,8.6,4.08,.28,m.plaster);
 box(root,-3.3,3.56,5,1.4,1.0,.28,m.plaster);
 box(root,-3.38,2.05,5.09,.11,2.95,.20,m.darkWood);
 const entrance=group();entrance.position.set(-3.98,0,5);entrance.rotation.y=.18;
 rounded(entrance,.60,1.45,0,1.19,2.84,.11,m.darkWood,.045);
 for(let i=0;i<3;i++)box(entrance,.60,.65+i*.76,-.09,.81,.05,.055,m.trim);
 cyl(entrance,1.00,1.42,-.14,.055,.055,.09,m.gold);
 // Plinthes, corniches, trous et goulottes.
 for(const z of [-4.83,4.85]){
  box(root,0,.14,z,11.8,.28,.09,m.darkWood);
  box(root,0,3.98,z,11.8,.14,.14,m.trim);
 }
 for(const x of [-5.87,5.87]){box(root,x,.15,0,.11,.3,9.7,m.darkWood);box(root,x,3.96,0,.16,.12,9.7,m.trim)}
 // Plafond à 4.18m, fissures, isolant et poutres apparentes.
 box(root,-1.78,4.18,0,8.4,.15,9.96,m.ceiling);
 box(root,4.89,4.18,0,2.16,.15,9.96,m.ceiling);
 box(root,3.45,4.17,3.33,.8,.16,3.24,m.ceiling);
 box(root,3.45,4.17,-3.28,.8,.16,3.3,m.ceiling);
 for(let i=0;i<5;i++){
  const z=-4.65+i*2.25;
  box(root,3.30,4.23,z,3.75,.24,.18,m.darkWood);
  box(root,3.28,4.42,z,.85,.12,.13,m.rust);
 }
 for(let i=0;i<13;i++){
  const x=-5.75+rnd()*11.25,z=-4.6+rnd()*9.2;
  const shape=new T.BufferGeometry().setFromPoints([
   V(x,4.082,z),V(x+.12,4.08,z-.18),V(x+.22,4.075,z-.24),
   V(x+.20,4.075,z-.5),V(x+.42,4.075,z-.75)
  ]);
  const line=new T.Line(shape,new T.LineBasicMaterial({color:'#33352f',transparent:true,opacity:.24}));
  root.add(line);
 }
 // Ripped wallpaper / damp patches in corners.
 for(let i=0;i<30;i++){
  const x=(rnd()>.5?5.84:-5.84),z=-4.5+rnd()*9,y=.3+rnd()*2.2;
  const stain=mesh(root,new T.PlaneGeometry(.4+rnd()*1.3,.3+rnd()*1.9),
   new T.MeshStandardMaterial({color:'#3d4a3b',roughness:1,transparent:true,opacity:.1+rnd()*.19,side:T.DoubleSide,depthWrite:false}),x,y,z,false);
  stain.rotation.y=Math.PI/2;
 }
 // Cheminée et manteau de bois, véritable renfoncement visuel.
 const fireplace=group();fireplace.position.set(5.59,0,1.65);fireplace.rotation.y=-Math.PI/2;
 box(fireplace,0,1.18,.12,2.5,2.28,.46,m.stone2);
 box(fireplace,0,.62,-.18,1.5,1.25,.12,m.soot);
 for(let i=0;i<5;i++){
  const p=box(fireplace,-1.1+i*.54,1.46,-.16,.045,.6,.05,m.brick);p.rotation.z=(i%2?.03:-.02)
 }
 box(fireplace,0,2.42,-.14,2.94,.19,.91,m.darkWood);
 box(fireplace,0,.27,-.42,2.52,.21,.80,m.stone2);
 for(let i=0;i<11;i++){
  const a=i*2.399,rad=.17+rnd()*.30;
  const log=cyl(fireplace,Math.cos(a)*rad,.26,Math.sin(a)*rad-.30,.06,.08,.65,m.darkWood,8);
  log.rotation.z=1.45;log.rotation.y=a;
 }
 // Traces d'occupants.
 for(let i=0;i<7;i++){
  const x=pick([-5.68,5.69]),y=1.3+rnd()*1.5,z=-3.5+rnd()*6;
  const frame=group();frame.position.set(x,y,z);frame.rotation.y=Math.PI/2;
  box(frame,0,0,0,.48+rnd()*.36,.70+rnd()*.2,.045,m.darkWood);
  box(frame,0,0,-.038,.35,.50,.015,i%2?m.paper:m.soot);
  frame.rotation.z=(rnd()-.5)*.16;
 }
 // CANAPÉ : coussins bombés, accoudoirs, coutures, affaissement et tissus déchirés.
 const sofa=group();sofa.position.set(-4.28,0,-.40);sofa.rotation.y=-Math.PI/2;
 rounded(sofa,0,.47,.08,3.45,.40,1.29,m.sofa,.16);
 rounded(sofa,0,.89,.55,3.28,.86,.36,m.sofa,.13);
 for(const side of [-1,1]){
  rounded(sofa,side*1.66,.70,.06,.36,.76,1.39,m.sofa,.11);
  box(sofa,side*1.36,.16,.52,.12,.22,.13,m.darkWood);
  box(sofa,side*1.36,.16,-.45,.12,.22,.13,m.darkWood);
 }
 for(let i=0;i<3;i++){
  const x=-1.13+i*1.13;
  const cushion=rounded(sofa,x,.77,-.20,1.09,.29,.95,i===2?m.chair:m.sofa,.105);
  cushion.rotation.z=(rnd()-.5)*.07;
  const back=rounded(sofa,x,1.05,.39,1.08,.53,.24,m.sofa,.1);
  back.rotation.x=-.13;
  if(i===0||i===2){
   const pillow=rounded(sofa,x+(i===0?.24:-.18),1.15,-.08,.49,.48,.16,m.chair,.07);
   pillow.rotation.z=.15*(i===0?1:-1);pillow.rotation.y=.3;
  }
 }
 for(let i=0;i<16;i++){
  const x=-1.5+rnd()*3.0,z=-.5+rnd()*.9;
  const tear=box(sofa,x,.91,z,.02+rnd()*.14,.004,.012,m.black);tear.rotation.y=rnd()*6.28;
 }
 collider(-4.28,-.40,2.0,3.55);
 // Fauteuil face à la baie, incliné.
 const chair=group();chair.position.set(3.05,0,-2.02);chair.rotation.y=.55;
 rounded(chair,0,.53,.08,1.05,.32,1.05,m.chair,.13);
 rounded(chair,0,1.05,.51,1.03,1.30,.28,m.chair,.10);
 for(const x of [-.52,.52]){
  rounded(chair,x,.83,.08,.19,.65,1.14,m.chair,.075);
  box(chair,x,.20,-.3,.105,.38,.10,m.darkWood);
  box(chair,x,.20,.42,.105,.38,.10,m.darkWood);
 }
 rounded(chair,0,.80,-.12,.9,.20,.75,m.sofa,.06);
 collider(3.05,-2.02,1.85,1.85);
 // Tapis ancien et table basse, avec livres et objets 3D.
 const rug=mesh(root,new T.PlaneGeometry(4.8,3.45),m.rug,-.25,.066,-.55,false);rug.rotation.x=-Math.PI/2;
 for(let i=0;i<22;i++){
  const x=-2.56+i*.22;
  box(root,x,.069,-2.26,.014,.007,.09,m.paper);
  box(root,x,.069,1.17,.014,.007,.09,m.paper);
 }
 const table=group();table.position.set(-.15,0,-.50);table.rotation.y=-.045;
 rounded(table,0,.66,0,2.47,.13,1.21,m.furniture,.045);
 box(table,0,.19,0,2.28,.12,1.05,m.darkWood);
 for(const x of [-1.00,1.0])for(const z of [-.42,.42]){
  box(table,x,.33,z,.115,.65,.10,m.darkWood);
 }
 collider(-.15,-.50,2.8,1.65);
 // Livres empilés à plat, avec pages et reliure.
 for(let i=0;i<7;i++){
  const x=-.70+rnd()*.95,z=-.32+rnd()*.42,y=.78+i*.037;
  const book=group(table);book.position.set(x,y,z);book.rotation.y=(rnd()-.5)*.38;
  box(book,0,0,0,.4,.04,.26,i%3?m.darkWood:m.paper);
  box(book,0,.002,.014,.36,.025,.225,m.paper);
 }
 // Céramique, tasse, soucoupe, bouteille, journal et végétation.
 const cup=group(table);cup.position.set(.71,.80,-.18);
 cyl(cup,0,.055,0,.09,.065,.17,m.ceramic);
 const rim=mesh(cup,new T.TorusGeometry(.084,.015,8,19),m.ceramic,0,.155,0);rim.rotation.x=Math.PI/2;
 const handle=mesh(cup,new T.TorusGeometry(.075,.017,7,14,Math.PI*1.5),m.ceramic,.103,.07,0);handle.rotation.y=Math.PI/2;
 cyl(table,.73,.75,.2,.14,.14,.025,m.paper);
 cyl(table,.13,.93,.25,.075,.105,.48,m.darkGlass);
 cyl(table,.13,1.2,.25,.028,.028,.17,m.ceramic);
 box(table,-.16,.765,.12,.61,.012,.4,m.paper).rotation.y=.20;
 // Buffet / bibliothèque contre le mur droit : étagères et nombreux livres distincts.
 const shelf=group();shelf.position.set(5.17,0,-1.50);shelf.rotation.y=Math.PI/2;
 box(shelf,0,1.38,.04,3.15,2.72,.59,m.darkWood);
 box(shelf,0,1.38,-.30,2.92,2.52,.035,m.black);
 for(let y=.30;y<=2.58;y+=.43)box(shelf,0,y,-.16,3.12,.075,.62,m.furniture);
 for(const side of [-1,1])box(shelf,side*1.48,1.4,.0,.10,2.73,.63,m.darkWood);
 for(let row=0;row<5;row++){
  let x=-1.39;
  for(let j=0;j<21;j++){
   const w=.045+rnd()*.075,h=.23+rnd()*.13;
   const options=['#8d6c53','#635846','#45584d','#79755a','#998165','#454c47','#73594d'];
   const pageMat=matte(pick(options),{roughness:1});
   const book=box(shelf,x+w/2,.42+row*.43+h/2,-.22,w,h,.30+ rnd()*.07,pageMat);
   book.rotation.z=(rnd()-.5)*.11;x+=w+.007;
   if(x>1.35)break;
  }
 }
 for(let i=0;i<9;i++){
  const y=.30+(i%4)*.45,x=-1.3+(i*.55)%2.6;
  cyl(shelf,x,y+.13,-.03,.08,.11,.19,i%3?m.ceramic:m.rust);
 }
 collider(5.16,-1.50,1.36,3.6);
 // Table d'appoint et lampe sale.
 const side=group();side.position.set(-5.1,0,2.1);
 box(side,0,.64,0,.90,.08,.74,m.darkWood);
 for(const x of [-.34,.34])for(const z of [-.25,.25])box(side,x,.32,z,.07,.57,.07,m.darkWood);
 cyl(side,0,.82,0,.13,.17,.20,m.gold);
 cyl(side,0,1.27,0,.27,.14,.63,m.windowShade);
 collider(-5.1,2.1,1.18,.95);
 // Renversée : chaise sur le côté.
 const wreck=group();wreck.position.set(3.22,.16,2.34);wreck.rotation.z=1.21;wreck.rotation.y=.45;
 box(wreck,0,.57,0,.76,.16,.76,m.darkWood);
 box(wreck,0,1.19,.38,.77,.99,.105,m.darkWood);
 for(const x of [-.29,.29])for(const z of [-.30,.30])box(wreck,x,.28,z,.08,.58,.08,m.darkWood);
 collider(3.22,2.34,1.5,1.35);
 // Une porte de placard, une photo et un tiroir réellement interactifs.
 const cabinet=group();cabinet.position.set(-2.54,0,3.82);
 box(cabinet,0,.63,.0,1.58,1.20,.52,m.furniture);
 const drawer=group(cabinet);drawer.position.set(0,.87,-.30);
 rounded(drawer,0,0,0,1.32,.24,.06,m.darkWood,.02);
 cyl(drawer,0,0,-.07,.038,.038,.035,m.gold);
 box(cabinet,0,1.28,0,1.76,.10,.68,m.darkWood);
 const photo=box(cabinet,.42,1.43,-.08,.27,.27,.055,m.paper);
 photo.rotation.x=-.45;photo.rotation.z=.30;
 collider(-2.54,3.82,1.75,.88);
 let drawerOpen=false;
 addTarget('drawer','Ouvrir le tiroir',-2.55,1.04,3.44,()=>{
  drawerOpen=!drawerOpen;drawer.position.z=drawerOpen?-.65:-.30;
  return drawerOpen?'Un tiroir plein de poussière. Une petite photographie repose au fond.':'Vous refermez le tiroir.';
 });
 addTarget('photo','Examiner la photographie',-2.13,1.45,3.68,()=>{
  return 'Sur la photographie décolorée, une famille sourit devant cette même fenêtre, bien avant que la végétation n’envahisse le salon.';
 });
 addTarget('books','Examiner les livres',5.04,1.58,-1.38,()=>{
  return 'Des romans, des atlas, des carnets de voyage. L’humidité a gonflé leurs pages. Il reste parfois une odeur de papier ancien.';
 });
 addTarget('window','Observer la fenêtre',0,2.0,-4.52,()=>{
  return 'À travers les vitres brisées, des arbres ont presque englouti la cour. Des années semblent s’être écoulées.';
 });
 addTarget('lamp','Examiner la lampe',-5.12,1.35,2.05,()=>{
  return 'Le courant est coupé depuis longtemps. Il ne reste qu’une vieille ampoule sous un abat-jour taché.';
 });
 // Gravats, papier, feuilles et verre : détails fins mais légers.
 for(let i=0;i<340;i++){
  const x=-5.7+rnd()*11.4,z=-4.7+rnd()*9.4;
  if(Math.abs(x)<1.5&&Math.abs(z)<1.15&&rnd()>.3)continue;
  const p=mesh(root,new T.PlaneGeometry(.035+rnd()*.21,.025+rnd()*.16),
   pick([m.paper,m.dust,m.rust,m.darkWood]),x,.078+rnd()*.016,z,false);
  p.rotation.x=-Math.PI/2;p.rotation.z=rnd()*6.28;
 }
 for(let i=0;i<75;i++){
  const x=-5.4+rnd()*10.8,z=-4.4+rnd()*8.8;
  const shard=box(root,x,.09,z,.03+rnd()*.18,.008,.04+rnd()*.16,i%4?m.glass:m.rust);
  shard.rotation.y=rnd()*6.28;shard.castShadow=false;
 }
 // Collisions avec meubles et limites de pièce.
 function collides(x,z,r=.26){
  if(x<-5.68+r||x>5.70-r||z<-4.70+r||z>4.72-r)return true;
  for(const b of obstacles){
   const xx=Math.max(b.minX,Math.min(x,b.maxX)),zz=Math.max(b.minZ,Math.min(z,b.maxZ));
   if((xx-x)**2+(zz-z)**2<r*r)return true;
  }
  return false;
 }
 // Le plafond et les éclairages ne sont pas des cibles d'interaction.
 return{root,m,materials:m,collides,interactions,obstacles,rnd,pick,box,mesh,cyl,group,matte,V};
}
