/* ZONE ZÉRO · La nature réinvestit le salon.
   Géométrie des plantes, lianes, feuilles, mousse, poussière et jardin 3D
   visibles depuis les fenêtres. Foliage en instances pour rester fluide. */
export function populateRoomNature(T,scene,room){
 const {m,rnd,pick,mesh,box,cyl,group}=room;
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 const dummy=new T.Object3D();
 const green=[m.leaf,room.matte('#5e704a'),room.matte('#89936b'),room.matte('#55684b')];
 const bark=room.matte('#484738',{roughness:1});
 const dirt=room.matte('#463c2d',{roughness:1});
 const patches=new T.InstancedMesh(new T.PlaneGeometry(1,1),m.moss,230);
 let mossCount=0;
 function patch(x,y,z,w,d,vertical=false){
  if(mossCount>=230)return;
  dummy.position.set(x,y,z);dummy.rotation.set(vertical?0:-Math.PI/2,vertical?Math.PI/2:0,rnd()*6.28);
  dummy.scale.set(w,d,1);dummy.updateMatrix();
  patches.setMatrixAt(mossCount++,dummy.matrix);
 }
 // Mousse dans les coins, près de l'eau et des fenêtres.
 for(let i=0;i<225;i++){
  let x,z;
  const k=rnd();
  if(k<.46){x=-5.75+rnd()*11.5;z=-4.1-rnd()*.55}
  else if(k<.72){x=(rnd()>.5?1:-1)*(4.9+rnd()*.76);z=-4.5+rnd()*9}
  else {x=-5.5+rnd()*11;z=-4.6+rnd()*9.2}
  patch(x,.07,z,.25+rnd()*1.34,.25+rnd()*.90);
 }
 patches.count=mossCount;patches.instanceMatrix.needsUpdate=true;patches.frustumCulled=false;scene.add(patches);
 // Carrés d'herbe translucides en deux pans croisés, 1100 instances.
 const grassGeo=new T.PlaneGeometry(.22,.65);
 const grass=new T.InstancedMesh(grassGeo,m.grass,1850);let grassCount=0;
 for(let i=0;i<925;i++){
  const k=rnd();let x,z;
  if(k<.57){x=-5.65+rnd()*11.3;z=-4.68+rnd()*.95}
  else if(k<.84){x=(rnd()>.5?1:-1)*(4.7+rnd()*.79);z=-4.6+rnd()*9.2}
  else{x=-5.4+rnd()*10.8;z=-4.4+rnd()*8.8}
  const height=.21+rnd()*.78;
  for(let a=0;a<2;a++){
   dummy.position.set(x,.072+height*.5,z);
   dummy.rotation.set(0,rnd()*Math.PI*2+a*Math.PI/2,(rnd()-.5)*.26);
   dummy.scale.set(.45+rnd()*.75,height/.65,.8);dummy.updateMatrix();
   grass.setMatrixAt(grassCount++,dummy.matrix);
  }
 }
 grass.count=grassCount;grass.instanceMatrix.needsUpdate=true;
 grass.frustumCulled=false;grass.castShadow=false;scene.add(grass);
 // Feuilles individuelles au lieu de cônes verts. Deux couches de teintes
 // pour introduire des variations plus naturelles.
 const leafGeo=new T.PlaneGeometry(.23,.33);
 const leaves=new T.InstancedMesh(leafGeo,m.leaf,2500);
 let leafCount=0;
 const branchMat=room.matte('#4c5840',{roughness:1});
 function leafAt(x,y,z,scale=.7){
  if(leafCount>=2500)return;
  dummy.position.set(x,y,z);
  dummy.rotation.set((rnd()-.5)*1.2,rnd()*Math.PI*2,(rnd()-.5)*1.5);
  dummy.scale.set(scale*(.5+rnd()),scale*(.62+rnd()*.7),1);
  dummy.updateMatrix();leaves.setMatrixAt(leafCount++,dummy.matrix);
  leaves.setColorAt(leafCount-1,new T.Color().setRGB(.73+rnd()*.23,.75+rnd()*.25,.63+rnd()*.27));
 }
 function vine(points,radius=.012,leafDensity=12){
  const spline=new T.CatmullRomCurve3(points.map(a=>V(...a)));
  const tube=new T.Mesh(new T.TubeGeometry(spline,Math.max(10,points.length*6),radius,4,false),branchMat);
  tube.castShadow=true;scene.add(tube);
  const n=Math.max(8,Math.floor(points.length*leafDensity));
  for(let i=0;i<n;i++){
   const t=i/(n-1),p=spline.getPointAt(t);
   leafAt(p.x+(rnd()-.5)*.13,p.y+(rnd()-.5)*.13,p.z+(rnd()-.5)*.13,.38+rnd()*.52);
  }
 }
 // Lierre continu grimpant des fenêtres, mur arrière et plafond.
 for(const xbase of [-5.75,-4.5,-3.35,-2.25,-1.0,.3,1.45,2.5,3.35,4.7,5.75]){
  for(let j=0;j<3;j++){
   const y0=rnd()*.65,phase=rnd()*6.28;
   const pts=[];
   for(let k=0;k<9;k++){
    const y=y0+k*.43,z=-4.85+.08*Math.sin(phase+k*.6);
    pts.push([xbase+Math.sin(k*.79+phase)*(.18+k*.034),y,z]);
   }
   vine(pts,.006+rnd()*.014,6);
  }
 }
 // Lianes suspendues au plafond et dans le meuble de la bibliothèque.
 for(let i=0;i<39;i++){
  const x=-5.65+rnd()*11.3,z=-4.7+rnd()*1.7;
  const pts=[[x,4.11,z],[x+.1,3.8,z+.1],[x+.14,3.45,z+.04],[x-.09,2.95-rnd()*.8,z+.24]];
  vine(pts,.006+rnd()*.008,9);
 }
 for(let i=0;i<14;i++){
  const x=4.88+rnd()*.47,z=-3.1+rnd()*3.05,y=1.5+rnd()*2;
  vine([[x,y,z],[x-.18,y-.28,z+.12],[x-.24,y-.63,z+.24],[x-.20,y-1.0,z+.26]],.009,7);
 }
 // Lianes au sol qui se rapprochent du mobilier.
 for(let i=0;i<36;i++){
  const x=-5.3+rnd()*10.6,z=-4.60+rnd()*1.2;
  vine([[x,.12,z],[x+.09,.1,z+.35],[x-.16,.13,z+.75],[x-.02,.13,z+1.08]],.01,5);
 }
 leaves.count=leafCount;
 leaves.instanceMatrix.needsUpdate=true;
 if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
 leaves.frustumCulled=false;leaves.castShadow=false;scene.add(leaves);
 // Plantes basses en volumes, derrière et devant les fenêtres.
 const ground=room.matte('#3f4835');
 box(scene,0,-.24,-9.4,43,.32,10.5,ground);
 // Mur bas derrière le jardin pour éviter le vide absolu.
 box(scene,0,1.1,-14.5,46,2.3,.34,room.matte('#646e5e'));
 const leavesOutside=new T.InstancedMesh(new T.IcosahedronGeometry(.55,1),
  room.matte('#617951',{roughness:1,flatShading:true}),225);
 let noutside=0;
 for(let i=0;i<58;i++){
  const bx=-15+rnd()*30,bz=-7.1-rnd()*8.7;
  const h=3+rnd()*5.3;
  cyl(scene,bx,h*.40,bz,.085,.21,h*.76,bark,7);
  for(let j=0;j<5;j++){
   const xx=bx+(rnd()-.5)*2.5,yy=h*.60+rnd()*h*.24,zz=bz+(rnd()-.5)*2.3;
   dummy.position.set(xx,yy,zz);
   dummy.rotation.set(0,rnd()*6.28,0);const r=.85+rnd()*.92;
   dummy.scale.set(r,r*.8,r*1.1);dummy.updateMatrix();
   leavesOutside.setMatrixAt(noutside++,dummy.matrix);
   if(noutside>=225)break;
  }if(noutside>=225)break;
 }
 leavesOutside.count=noutside;leavesOutside.instanceMatrix.needsUpdate=true;
 scene.add(leavesOutside);
 for(let i=0;i<55;i++){
  const x=-15+rnd()*30,z=-5.7-rnd()*6;
  const shrub=new T.Mesh(new T.IcosahedronGeometry(.25+rnd()*.6,1),pick(green.slice(1)));
  shrub.position.set(x,.1+rnd()*.25,z);shrub.scale.y=.6+rnd()*.5;scene.add(shrub);
 }
 // Feuilles séchées et brindilles sur le sol.
 for(let i=0;i<310;i++){
  const x=-5.5+rnd()*11,z=-4.58+rnd()*9.1;
  const material=pick([m.darkWood,m.paper,m.rust]);
  const leaf=mesh(scene,new T.PlaneGeometry(.045+rnd()*.12,.03+rnd()*.07),
   material,x,.086,z,false);
  leaf.rotation.x=-Math.PI/2;leaf.rotation.z=rnd()*6.28;
 }
 // Particules de poussière captant la lumière ; elles dérivent lentement.
 const count=720,data=new Float32Array(count*3),speeds=new Float32Array(count);
 for(let i=0;i<count;i++){
  data[i*3]=-5.5+rnd()*11;data[i*3+1]=.25+rnd()*3.65;data[i*3+2]=-4.55+rnd()*8.9;
  speeds[i]=.12+rnd()*.44;
 }
 const dustGeometry=new T.BufferGeometry();
 dustGeometry.setAttribute('position',new T.BufferAttribute(data,3));
 const dust=new T.Points(dustGeometry,new T.PointsMaterial({
  color:'#eddfb5',size:.018,transparent:true,opacity:.48,depthWrite:false,sizeAttenuation:true
 }));
 scene.add(dust);
 // Rayons de soleil : plans doux et transparents avec dégradés faits par canvas.
 const cvs=document.createElement('canvas');cvs.width=128;cvs.height=512;
 const ctx=cvs.getContext('2d');const g=ctx.createLinearGradient(0,0,0,512);
 g.addColorStop(0,'rgba(255,237,186,0)');g.addColorStop(.3,'rgba(255,232,174,.18)');
 g.addColorStop(.65,'rgba(255,232,174,.09)');g.addColorStop(1,'rgba(255,233,178,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,128,512);
 const shaftTexture=new T.CanvasTexture(cvs);shaftTexture.colorSpace=T.SRGBColorSpace;
 const shaftMat=new T.MeshBasicMaterial({map:shaftTexture,transparent:true,opacity:.20,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(const windowX of [-3.35,0,3.35]){
  const sh=mesh(scene,new T.PlaneGeometry(1.35,5.5),shaftMat,windowX+1.0,1.55,-2.8,false);
  sh.rotation.set(-.9,.18,.3);sh.renderOrder=1;
 }
 let frame=0;
 function update(dt){
  frame+=dt;
  const a=dustGeometry.attributes.position;
  for(let i=0;i<count;i++){
   const y=a.getY(i)+dt*speeds[i]*.15;
   a.setY(i,y>4.07?.18:y);
   const x=a.getX(i)+Math.sin(frame*.45+i*13.6)*dt*.013;
   a.setX(i,Math.max(-5.6,Math.min(5.6,x)));
  }
  a.needsUpdate=true;
 }
 return{update,stats:{ivyLeaves:leafCount,grass:grassCount,moss:mossCount,trees:noutside,dust:count}};
}
