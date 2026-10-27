/* ZONE ZÉRO — végétation de reconquête : herbes, mousse, lichens, lierre.
   Petits maillages instanciés + atlas Canvas local : aucun chargement externe. */
export function addOvergrowth(T,scene,{collides,buildings=[]}={}){
 let seed=955713;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const green=['#576849','#6a7950','#465e4b','#7c8459'];
 function textureGrass(){
  const c=document.createElement('canvas');c.width=128;c.height=256;
  const g=c.getContext('2d');g.clearRect(0,0,128,256);
  for(let i=0;i<31;i++){
    const root=36+random()*56,top=root+(random()-.5)*96,h=65+random()*160;
    g.beginPath();g.moveTo(root-4,255);g.quadraticCurveTo(root+(random()-.5)*55,255-h*.49,top,255-h);
    g.quadraticCurveTo(root+(random()-.5)*32,255-h*.48,root+4,255);g.closePath();
    g.fillStyle=green[Math.floor(random()*green.length)];g.globalAlpha=.66+random()*.32;g.fill();
    g.strokeStyle='#b9b790';g.globalAlpha=.1;g.stroke();
  }
  g.globalAlpha=1;const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
 }
 function mossTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const g=c.getContext('2d');g.clearRect(0,0,256,256);
  for(let i=0;i<3600;i++){
    const x=random()*256,y=random()*256;
    const nx=(x-128)/125,ny=(y-128)/125;
    const n=Math.sqrt(nx*nx+ny*ny);
    const rag=.75+.17*Math.sin(Math.atan2(ny,nx)*9)+.18*Math.sin(Math.atan2(ny,nx)*17);
    if(n>rag||random()<(n/.93)*.48)continue;
    g.globalAlpha=.06+random()*.32;
    g.fillStyle=green[Math.floor(random()*green.length)];
    g.beginPath();g.arc(x,y,1+random()*6,0,Math.PI*2);g.fill();
  }
  for(let i=0;i<85;i++){
    const theta=random()*Math.PI*2,r=random()*93;
    g.globalAlpha=.18;g.fillStyle='#b3a980';
    g.beginPath();g.arc(128+Math.cos(theta)*r,128+Math.sin(theta)*r,random()*4,0,Math.PI*2);g.fill();
  }
  g.globalAlpha=1;const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
 }
 function ivyTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=512;
  const g=c.getContext('2d');g.clearRect(0,0,256,512);
  for(let branch=0;branch<17;branch++){
    let x=25+random()*206,y=512+random()*28;
    const length=130+random()*360,steps=12+Math.floor(random()*15);
    g.beginPath();g.moveTo(x,y);g.lineWidth=1+random()*3;
    for(let i=0;i<steps;i++){
      const oldX=x,oldY=y;x+=(random()-.5)*33;y-=length/steps;
      g.quadraticCurveTo((oldX+x)/2+Math.sin(i*.6)*7,(oldY+y)/2,x,y);
    }
    g.strokeStyle=green[Math.floor(random()*green.length)];g.globalAlpha=.75;g.stroke();
    // Feuilles en losanges arrondis, alternées sur les rameaux.
    for(let i=0;i<steps;i++){
      const ratio=i/steps,fy=512-ratio*length,fx=24+branch*13+Math.sin(i*.75+branch)*34;
      for(let side of [-1,1]){
        const px=fx+side*(7+random()*16),py=fy+random()*15;
        g.save();g.translate(px,py);g.rotate(side*(.5+random()*.5));
        g.fillStyle=green[Math.floor(random()*green.length)];
        g.globalAlpha=.65+random()*.32;
        g.beginPath();g.ellipse(0,0,3+random()*3.5,6+random()*5,.2,0,Math.PI*2);g.fill();g.restore();
      }
    }
  }
  g.globalAlpha=1;const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;
 }
 const grassMaterial=new T.MeshStandardMaterial({map:textureGrass(),transparent:true,alphaTest:.13,
  side:T.DoubleSide,depthWrite:false,roughness:1,metalness:0});
 const mossMaterial=new T.MeshBasicMaterial({map:mossTexture(),transparent:true,opacity:.92,
  depthWrite:false,side:T.DoubleSide,alphaTest:.07,polygonOffset:true,polygonOffsetFactor:-1});
 const ivyMaterial=new T.MeshStandardMaterial({map:ivyTexture(),transparent:true,alphaTest:.13,
  depthWrite:false,side:T.DoubleSide,roughness:1});
 const grassGeo=new T.PlaneGeometry(.31,.75);
 const count=3300,grasses=new T.InstancedMesh(grassGeo,grassMaterial,count),dummy=new T.Object3D();
 grasses.frustumCulled=false;grasses.castShadow=false;grasses.receiveShadow=true;
 let filled=0,tries=0;
 while(filled<count&&tries++<count*18){
   const x=-72.5+random()*145;
   const mode=random(),z=(mode<.48?(random()>.5?1:-1)*(13.9+random()*6.9):
     mode<.82?(random()>.5?1:-1)*(10.4+random()*5.8):
     -12.5+random()*25);
   if(collides?.(x,z,.27))continue;
   if(mode>.82&&random()>.3)continue;
   const size=.38+random()*1.14;
   dummy.position.set(x,.12+size*.39,z);
   dummy.rotation.set(0,random()*Math.PI*2,(random()-.5)*.28);
   dummy.scale.set(.5+random()*.8,size,.5+random()*.8);
   dummy.updateMatrix();grasses.setMatrixAt(filled++,dummy.matrix);
 }
 grasses.count=filled;grasses.instanceMatrix.needsUpdate=true;scene.add(grasses);
 // Plaques de mousse sur le bitume fissuré et les joints de trottoir.
 const moss=new T.InstancedMesh(new T.PlaneGeometry(1,1),mossMaterial,460);
 let mCount=0;
 for(let i=0;i<1050&&mCount<460;i++){
   const x=-72+random()*144;
   const mode=random(),z=mode<.49?(random()>.5?1:-1)*(13.9+random()*2.3):
    mode<.83?(random()>.5?1:-1)*(18.2+random()*2.3):(-12.5+random()*25);
   if(collides?.(x,z,.4))continue;
   const wide=.8+random()*3.8,deep=.3+random()*1.6;
   dummy.position.set(x,.066,z);
   dummy.rotation.set(-Math.PI/2,0,random()*6.28);
   dummy.scale.set(wide,deep,1);dummy.updateMatrix();moss.setMatrixAt(mCount++,dummy.matrix);
 }
 moss.count=mCount;moss.instanceMatrix.needsUpdate=true;scene.add(moss);
 // Lierre sur les façades et mousse remontant depuis les trottoirs.
 const ivyPlanes=[];
 for(const b of buildings){
   const front=b.side*23;
   const count=3+Math.floor(random()*5);
   for(let j=0;j<count;j++){
     const w=1.8+random()*3.8,h=2.7+random()*Math.min(8,b.h-2);
     const x=b.x+(random()-.5)*(b.w-w*.65);
     const atH=j<2?(.5+h*.47):(1.5+random()*(b.h-h*.7));
     const p=new T.Mesh(new T.PlaneGeometry(w,h),ivyMaterial);
     p.position.set(x,Math.min(b.h-.3,atH),front-b.side*.49);
     if(b.side===1)p.rotation.y=Math.PI;
     p.castShadow=false;p.receiveShadow=false;scene.add(p);ivyPlanes.push(p);
   }
   for(let j=0;j<4;j++){
     const x=b.x+(random()-.5)*(b.w-2);
     const p=new T.Mesh(new T.PlaneGeometry(2.2+random()*3.3,1+random()*2.4),mossMaterial);
     p.position.set(x,1.0,front-b.side*.52);
     if(b.side===1)p.rotation.y=Math.PI;
     scene.add(p);
   }
 }
 // Fourrés dans les zones d'ombre, sur les bords de rue.
 const bushes=new T.InstancedMesh(new T.IcosahedronGeometry(.56,1),
   new T.MeshStandardMaterial({color:'#64744c',roughness:1,flatShading:true}),110);
 let n=0;
 for(let i=0;i<350&&n<110;i++){
   const x=-71+random()*142,z=(random()>.5?1:-1)*(18+random()*3.3);
   if(collides?.(x,z,.65))continue;
   const size=.30+random()*.52;
   dummy.position.set(x,.12+size*.72,z);dummy.rotation.set(0,random()*6.28,0);
   dummy.scale.set(size*1.7,size,size*1.2);dummy.updateMatrix();bushes.setMatrixAt(n++,dummy.matrix);
 }
 bushes.count=n;bushes.instanceMatrix.needsUpdate=true;scene.add(bushes);
 return {grassCount:filled,mossCount:mCount,ivyCount:ivyPlanes.length,bushCount:n};
}
