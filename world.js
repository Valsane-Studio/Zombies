/* ZONE ZÉRO — Secteur de traversée urbaine, prototype 04. */
import {createNavigation} from './navigation.js';
export function createWorld(T,scene){
  let seed=48107;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const m=(color,roughness=.88,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const mats={asphalt:m('#515a55'),sidewalk:m('#737b70'),block:m('#838a7e'),cement:m('#8f9589'),
    brick:[m('#696f67'),m('#757166'),m('#646d6c'),m('#81776b')],
    roof:m('#3f4a49'),steel:m('#485451',.6,.4),glass:m('#293d42',.35,.25),light:m('#b9b3a2'),
    rust:m('#8e7258'),stripe:m('#c8b67f'),yellow:m('#e5bf4d'),dark:m('#353f3d'),
    vegetation:m('#485d4a'),bus:m('#7b7465')};
  function texture(base,detail){const c=document.createElement('canvas');c.width=c.height=256;let g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);
    for(let i=0;i<7200;i++){g.globalAlpha=.04+rand()*.13;g.fillStyle=detail;g.fillRect(rand()*256,rand()*256,rand()*2.3+1,rand()*2.3+1)}
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(18,12);tx.anisotropy=4;return tx}
  mats.asphalt.map=texture('#59635f','#afaca0');mats.asphalt.color.set('#ffffff');
  mats.cement.map=texture('#777c74','#d1c8ab');mats.cement.color.set('#ffffff');
  const blockers=[],pickSurfaces=[],footprints=[],roadblocks=[],spots=[],staticMeshes=[],platforms=[
    {x:-9,z:6,w:11,d:12,h:2.5,rampLength:7,rampWidth:3.1,side:'east'},
    {x:71,z:38,w:11,d:13,h:2.7,rampLength:8,rampWidth:3.2,side:'west'}
  ];
  const roadX=[-75,-35,5,45,85],roadZ=[-48,-12,24,60];
  const windowFront=[],windowSide=[],windowSills=[];
  const mission={
    start:{x:-84,z:-48},exit:{x:85,z:58,radius:4.4},
    infestations:[
      {x:-54,z:-12,radius:13,count:3,name:'QUARTIER OUEST'},
      {x:-15,z:-48,radius:12,count:4,name:'AXE SUD'},
      {x:16,z:24,radius:14,count:4,name:'CARREFOUR CENTRAL'},
      {x:47,z:-12,radius:12,count:3,name:'BOULEVARD EST'},
      {x:78,z:35,radius:12,count:4,name:'SECTEUR HÔPITAL'},
      {x:81,z:-45,radius:9,count:3,name:'ZONE INDUSTRIELLE'}
    ]
  };
  function mesh(geo,material,x,y,z,cast=false){const obj=new T.Mesh(geo,material);obj.position.set(x,y,z);obj.castShadow=cast;obj.receiveShadow=true;scene.add(obj);return obj}
  function box(x,y,z,w,h,d,material,cast=false){
    return mesh(new T.BoxGeometry(w,h,d),material,x,y,z,cast)}
  function plane(x,y,z,w,d,material){
    const o=mesh(new T.PlaneGeometry(w,d),material,x,y,z,false);o.rotation.x=-Math.PI/2;return o}
  function collider(x,z,w,d,h){blockers.push({x,z,w,d,h});}
  function building(x,z,w,d,h,id){
    const material=mats.brick[id%4];
    collider(x,z,w,d,h);
    footprints.push({x,z,w,d,h});
    box(x,h/2,z,w,h,d,material,true);
    box(x,h+.14,z,w+.3,.28,d+.3,mats.roof);
    for(const dx of [-w/2+.16,w/2-.16])box(x+dx,h+.46,z,.31,.65,d+.45,mats.cement);
    for(const dz of [-d/2+.16,d/2-.16])box(x,h+.46,z+dz,w+.2,.65,.31,mats.cement);
    // Fenêtres placées en grandes rangées, échelle cohérente avec un immeuble de 3-5 étages.
    // Fenêtres instanciées en lots : un seul appel de rendu par type.
    for(let xx=-w/2+1.4;xx<w/2-.25;xx+=2.5)for(let yy=2;yy<h-.85;yy+=2.65){
      windowFront.push([x+xx,yy,z+d/2+.045],[x+xx,yy,z-d/2-.045]);
      windowSills.push([x+xx,yy+.66,z+d/2+.10]);
    }
    for(let zz=-d/2+1.5;zz<d/2-.6;zz+=2.65)for(let yy=2;yy<h-.85;yy+=2.65){
      windowSide.push([x+w/2+.06,yy,z+zz],[x-w/2-.06,yy,z+zz]);
    }
    const doorZ=z+d/2+.08;
    box(x,1.18,doorZ,2.4,2.3,.13,mats.steel);
    box(x,2.38,doorZ+.15,3,.23,.32,mats.roof);
    // Équipements de toiture et ventilations.
    box(x-w*.25,h+.55,z+d*.16,1.5,1,.9,mats.steel,true);
    box(x+w*.22,h+.43,z-d*.13,1.25,.76,1.3,mats.rust);
    if(id%3===0)box(x+w*.28,h+1.25,z-d*.2,.16,1.6,.16,mats.steel);
  }
  function addRaised(p){
    const y=p.h+.06;
    box(p.x,p.h/2,p.z,p.w,p.h,p.d,mats.cement,true);
    const top=box(p.x,y+.045,p.z,p.w,.10,p.d,mats.roof);pickSurfaces.push(top);
    const left=p.x-p.w/2,right=p.x+p.w/2;
    const cx=p.side==='east'?right+p.rampLength/2:left-p.rampLength/2;
    const ramp=new T.Mesh(new T.BoxGeometry(p.rampLength,.18,p.rampWidth),mats.cement);
    ramp.position.set(cx,p.h/2+.08,p.z);
    ramp.rotation.z=(p.side==='east'?-1:1)*Math.atan(p.h/p.rampLength);
    ramp.castShadow=true;ramp.receiveShadow=true;scene.add(ramp);pickSurfaces.push(ramp);
    for(let n=1;n<=6;n++){const x=p.side==='east'?right+n*p.rampLength/7:left-n*p.rampLength/7;
      const elevated=p.h*(1-n/7);
      box(x,elevated+.12,p.z,.08,.02,p.rampWidth-.14,mats.light)}
    // Parapets latéraux partiels : appui réel au bord du toit.
    box(p.x,y+.36,p.z-p.d/2+.16,p.w-.4,.62,.25,mats.cement);
    box(p.x-p.w/2+.17,y+.3,p.z,.27,.5,p.d*.6,mats.cement);
    for(let i=0;i<3;i++)box(p.x-1.5+i*1.5,y+.25,p.z+p.d/2-.23,.85,.46,.35,mats.cement);
  }
  // 185 m × 130 m, plusieurs pâtés de maisons accessibles par avenues et passages.
  box(0,-.42,0,190,.84,136,mats.block);
  const floor=plane(0,.03,0,188,132,mats.asphalt);pickSurfaces.push(floor);
  for(const x of roadX)plane(x,.055,0,9,130,mats.asphalt);
  for(const z of roadZ)plane(0,.057,z,185,9,mats.asphalt);
  // Lignes de circulation et trottoirs.
  for(const x of roadX)for(let z=-61;z<63;z+=8)box(x,.081,z,.14,.016,3,mats.stripe);
  for(const z of roadZ)for(let x=-89;x<90;x+=8)box(x,.083,z,3,.015,.14,mats.stripe);
  const special=new Set(['1,1','3,2']);
  let id=0;
  for(let c=0;c<4;c++)for(let r=0;r<3;r++){
    const centerX=(roadX[c]+roadX[c+1])/2,centerZ=(roadZ[r]+roadZ[r+1])/2;
    box(centerX,.1,centerZ,31,.13,27,mats.sidewalk);
    // Bordures : les passages restent navigables entre les bâtiments.
    box(centerX,.20,centerZ-13.25,30.7,.12,.26,mats.light);
    box(centerX,.20,centerZ+13.25,30.7,.12,.26,mats.light);
    if(special.has(c+','+r)){
      if(c===1){building(-24,6,11.4,21,10.5,id++);}
      else {building(55,50,11,7.3,10,id++);}
      continue;
    }
    const height1=8+((id*17)%6)*1.4,height2=9+((id*13)%6)*1.45;
    building(centerX-8.2,centerZ,12.3,22.5,height1,id++);
    building(centerX+8.2,centerZ,12.3,22.5,height2,id++);
    // Grillage partiel dans certaines ruelles (sans les fermer systématiquement).
    if((c+r)%3===0){
      const fenceZ=centerZ+(r%2?5:-5);
      box(centerX,.81,fenceZ,2.9,1.6,.09,mats.steel);collider(centerX,fenceZ,2.9,.09,1.6);
    }
  }
  // Un mesh par type de fenêtre : les grands immeubles restent fluides.
  function instances(positions,w,h,d,material){
    if(!positions.length)return;
    const o=new T.InstancedMesh(new T.BoxGeometry(w,h,d),material,positions.length),dummy=new T.Object3D();
    positions.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix)});
    o.instanceMatrix.needsUpdate=true;o.castShadow=false;o.receiveShadow=false;scene.add(o);
  }
  instances(windowFront,1.18,1.2,.075,mats.glass);
  instances(windowSide,.075,1.12,1.22,mats.glass);
  instances(windowSills,1.25,.1,.1,mats.light);
  platforms.forEach(addRaised);
  // Intersections encombrées par des barrages et des véhicules.
  function barrier(x,z,w,d,orientation='h'){
    collider(x,z,w,d,1.35);roadblocks.push({x,z,w,d});
    box(x,.57,z,w,1.14,d,mats.cement,true);
    box(x,1.20,z,w,.12,d,mats.light);
    const stripeN=Math.max(2,Math.floor(Math.max(w,d)/1.1));
    for(let i=0;i<stripeN;i++){
      const f=-.5+(i+.5)/stripeN;
      if(orientation==='h')box(x+f*w,.8,z+d/2+.016,.4,.15,.03,mats.yellow);
      else box(x+w/2+.02,.8,z+f*d,.03,.14,.42,mats.yellow);
    }
  }
  barrier(-54,-48,2.4,8.6,'v');
  barrier(-14,-12,2.8,8.9,'v');
  barrier(24,24,2.5,8.8,'v');
  barrier(5,-30,8.7,2.5,'h');
  barrier(45,7,8.7,2.5,'h');
  // Couvert bas pour préparer une défense plutôt que forcer un seul chemin.
  function cover(x,z,w,d,h=1.1){
    collider(x,z,w,d,h);box(x,h/2,z,w,h,d,mats.cement,true);
    box(x,h+.03,z,w+.12,.07,d+.12,mats.light);
  }
  cover(-74,-32,3.1,.6);cover(-36,-27,.6,3.2);cover(4,34,3.6,.6);
  cover(45,-13,3.4,.6);cover(84,42,.55,3.7);cover(5,-51,4,.6);
  function car(x,z,color,rotation=0,blocking=true){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
    const body=m(color,.58,.35);
    function part(w,h,d,mat,xx,yy,zz){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(xx,yy,zz);o.castShadow=true;g.add(o)}
    part(4.3,.73,1.82,body,0,.65,0);
    part(2.15,.75,1.55,mats.glass,-.35,1.3,0);
    part(2.27,.12,1.64,body,-.35,1.69,0);
    for(const ax of [-1.37,1.37])for(const az of [-.91,.91]){
      const wheel=new T.Mesh(new T.CylinderGeometry(.41,.41,.20,12),mats.dark);
      wheel.rotation.x=Math.PI/2;wheel.position.set(ax,.36,az);g.add(wheel);
    }
    part(.06,.21,.38,mats.light,2.18,.65,-.56);
    if(blocking){let w=rotation?2.2:4.6,d=rotation?4.6:2.2;collider(x,z,w,d,1.7)}
  }
  car(-59,-48,'#656c62',Math.PI/2);car(-9,-12,'#6f6661',Math.PI/2);
  car(31,24,'#656c6f',Math.PI/2);car(5,-37,'#8b7768',0);
  car(45,12,'#596e72',0);car(-75,10,'#7b7764',Math.PI/2);
  car(85,-22,'#585d54',Math.PI/2);car(15,-48,'#786a5b');
  for(const [x,z] of [[-53,-43],[-15,-7],[25,29],[5,-25],[45,10]]){
    for(let i=0;i<4;i++)box(x+(rand()-.5)*3,.10,z+(rand()-.5)*2,.4+rand()*.7,.13,.25+rand()*.6,mats.rust);
  }
  function lamp(x,z){
    box(x,3.5,z,.19,7,.19,mats.steel,true);
    box(x+.75,6.92,z,1.55,.13,.18,mats.steel);
    const lightBox=box(x+1.38,6.82,z,.53,.09,.39,new T.MeshBasicMaterial({color:0xf2d8a7}));
    lightBox.castShadow=false;
    const l=new T.PointLight(0xf0b989,9,18,2);l.position.set(x+1.32,6.65,z);scene.add(l);
  }
  for(const x of [-74,-34,6,46,86])for(const z of [-47,25,60])if(rand()>.3)lamp(x-5,z-5);
  for(let i=0;i<210;i++){
    const x=-90+rand()*180,z=-62+rand()*124;
    if(blockers.some(b=>Math.abs(x-b.x)<b.w/2+1&&Math.abs(z-b.z)<b.d/2+1))continue;
    if(rand()<.3)box(x,.078,z,.12+rand()*.55,.05,.12+rand()*.36,mats.rust);
    else box(x,.074,z,.06+rand()*.2,.03,.1+rand()*.4,mats.vegetation);
  }
  const nav=createNavigation(blockers,platforms,{minX:-93,maxX:93,minZ:-65,maxZ:65});
  function zone(x,z,name){
    const p={x,z,name,y:nav.heightAt(x,z),ring:null};spots.push(p);return p;
  }
  zone(-75,-33,'COUVERT OUEST');zone(-35,-25,'ANGLE PROTÉGÉ');
  zone(-9,5.3,'TOIT DU PARKING');zone(5,32,'MURET NORD');
  zone(44,-14.8,'APPUI DU BOULEVARD');zone(84,40,'COUVERT EST');
  zone(70,37,'TOIT SURÉLEVÉ');zone(-7,-47,'REPLI SUD');
  zone(5,-54,'COUVERT SUD');
  const ringMat=new T.MeshBasicMaterial({color:0xf1c550,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});
  const diskMat=new T.MeshBasicMaterial({color:0xe8b641,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide});
  for(const s of spots){
    const disc=mesh(new T.CircleGeometry(1.16,40),diskMat,s.x,s.y+.05,s.z);disc.rotation.x=-Math.PI/2;
    const ring=mesh(new T.RingGeometry(1.03,1.12,48),ringMat.clone(),s.x,s.y+.08,s.z);ring.rotation.x=-Math.PI/2;
    s.ring=ring;
    const inner=mesh(new T.RingGeometry(.69,.72,48),ringMat.clone(),s.x,s.y+.09,s.z);inner.rotation.x=-Math.PI/2;inner.material.opacity=.44;
  }
  // Indices visuels des secteurs infectés : teinte rouge diffuse, pas un objectif à défendre.
  const haze=new T.MeshBasicMaterial({color:0xb2514b,transparent:true,opacity:.09,depthWrite:false,side:T.DoubleSide});
  for(const c of mission.infestations){
    const circle=mesh(new T.CircleGeometry(c.radius*.79,48),haze,c.x,.072,c.z);
    circle.rotation.x=-Math.PI/2;
    const outline=mesh(new T.RingGeometry(c.radius*.72,c.radius*.74,48),new T.MeshBasicMaterial({color:0xb76c60,transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide}),c.x,.077,c.z);
    outline.rotation.x=-Math.PI/2;
  }
  // Extraction unique au nord-est : objectif, pas un bâtiment à défendre.
  const endpoint=mission.exit;
  const exitFloor=mesh(new T.CircleGeometry(endpoint.radius,56),new T.MeshBasicMaterial({color:0x7eb49e,transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}),endpoint.x,.087,endpoint.z);
  exitFloor.rotation.x=-Math.PI/2;
  const exitRing=mesh(new T.RingGeometry(endpoint.radius-.16,endpoint.radius,64),new T.MeshBasicMaterial({color:0xa8ead4,transparent:true,opacity:.84,depthWrite:false,side:T.DoubleSide}),endpoint.x,.095,endpoint.z);
  exitRing.rotation.x=-Math.PI/2;
  const beam=mesh(new T.CylinderGeometry(.6,1.5,11,20,1,true),new T.MeshBasicMaterial({color:0x88efc2,transparent:true,opacity:.085,depthWrite:false,side:T.DoubleSide}),endpoint.x,5.6,endpoint.z);
  const goalTag=document.createElement('canvas');goalTag.width=256;goalTag.height=72;
  const g=goalTag.getContext('2d');g.fillStyle='#112b29e8';g.fillRect(0,0,256,72);g.strokeStyle='#81d9b8';g.lineWidth=3;g.strokeRect(2,2,252,68);
  g.fillStyle='#ddffef';g.font='bold 23px sans-serif';g.textAlign='center';g.fillText('EXTRACTION',128,44);
  const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(goalTag),transparent:true,depthWrite:false}));
  sprite.position.set(endpoint.x,5.8,endpoint.z);sprite.scale.set(9,2.6,1);scene.add(sprite);
  const pick=mesh(new T.PlaneGeometry(188,132),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}),0,.065,0);
  pick.rotation.x=-Math.PI/2;pickSurfaces.push(pick);
  function clickPoint(raycaster){
    const hits=raycaster.intersectObjects(pickSurfaces,false);
    for(const h of hits){
      if(Math.abs(h.point.x)>92||Math.abs(h.point.z)>64)continue;
      const actual=nav.heightAt(h.point.x,h.point.z);
      if(Math.abs(h.point.y-actual)<.52)return {x:h.point.x,z:h.point.z,y:actual};
    }return null;
  }
  function updateVisuals(t){
    for(const s of spots)if(s.ring)s.ring.material.opacity=.57+.31*Math.sin(t*2.5+s.x);
    exitRing.material.opacity=.65+.22*Math.sin(t*2.1);
    beam.material.opacity=.06+.03*Math.sin(t*1.4);
  }
  return {...nav,materials:mats,mission,spots,roadX,roadZ,roadblocks,footprints,clickPoint,updateVisuals};
}
