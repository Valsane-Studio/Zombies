/* ZONE ZÉRO — diorama 3D du Carrefour. Les éléments visibles sont liés aux règles. */
import {W,H,FEATURES,EXIT,START,key,coverAt} from './tactics-rules.js';
export const CELL=2.5;
export const toWorld=(x,z)=>({x:(x-(W-1)/2)*CELL,z:(z-(H-1)/2)*CELL});
const geoBox=(T,w,h,d)=>new T.BoxGeometry(w,h,d);
export function createDiorama(T,scene){
 let seed=40017;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const m=(color,roughness=.9,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const mats={
   street:m('#4d5958',.78,.04),sidewalk:m('#777c73'),wall:[m('#6d746e'),m('#777269'),m('#6e7572'),m('#857d72')],
   roof:m('#343f40'),ledge:m('#ada994'),metal:m('#455453',.5,.3),glass:m('#344d50',.3,.25),
   burnt:m('#282e2d'),rust:m('#815441'),pale:m('#b2b4a6'),stripe:m('#b7ae8f'),tire:m('#22282a'),
   dirt:m('#504a40'),green:m('#42544e'),wood:m('#6d6151'),yellow:m('#d9ac67')
 };
 function box(x,y,z,w,h,d,material=mats.wall[0],cast=true,parent=scene){
   const object=new T.Mesh(geoBox(T,w,h,d),material);
   object.position.set(x,y,z);object.castShadow=cast;object.receiveShadow=true;parent.add(object);return object;
 }
 function decal(x,z,w,d,material,dy=.015){
   const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);
   mesh.rotation.x=-Math.PI/2;mesh.position.set(x,dy,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
 }
 function roughTexture(color){
   const c=document.createElement('canvas');c.width=c.height=256;
   const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,256,256);
   for(let i=0;i<6300;i++){g.fillStyle=random()>.55?'#b0b3a3':'#18262a';g.globalAlpha=.025+random()*.12;
     const x=random()*256,y=random()*256;g.fillRect(x,y,1+random()*4,1+random()*3)}
   g.globalAlpha=.26;g.strokeStyle='#292e2d';g.lineWidth=.75;
   for(let i=0;i<24;i++){let x=random()*256,y=random()*256;g.beginPath();g.moveTo(x,y);
     for(let j=0;j<4;j++){x+=random()*17-8;y+=random()*12-6;g.lineTo(x,y)}g.stroke()}
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(3.3,2.2);
   return tex;
 }
 mats.street.map=roughTexture('#59615e');mats.street.color.set('#ffffff');mats.street.needsUpdate=true;
 const mapWidth=W*CELL,mapHeight=H*CELL;
 box(0,-.43,0,mapWidth+.8,.86,mapHeight+.8,mats.sidewalk,false);
 decal(0,0,mapWidth,mapHeight,mats.street,.015);
 // Peinture et marquages effacés aux intersections.
 for(let x=1;x<W-2;x+=4){
   for(const z of [8,12]){
     const p=toWorld(x,z);
     box(p.x,.03,p.z,2.5,.013,.095,mats.stripe,false);
   }
 }
 for(let z=2;z<H-2;z+=4){
   for(const x of [11,17]){
     const p=toWorld(x,z);
     box(p.x,.036,p.z,.085,.012,1.7,mats.stripe,false);
   }
 }
 // Bordures, joints du bitume et passages piétons.
 for(const z of [6.7,13.0]){
   box(0,.13,toWorld(0,z).z,mapWidth,.20,.26,mats.ledge,false);
 }
 for(const [x,z] of [[11,8],[17,8],[11,12],[17,12]]){
   const p=toWorld(x,z);
   for(let k=0;k<4;k++)box(p.x+(k-1.5)*.48,.054,p.z, .27,.009,1.55,mats.stripe,false);
 }
 const arts=[];
 function building(f){
   const g=new T.Group();scene.add(g);
   const cX=f.x+(f.w-1)/2,cZ=f.z+(f.h-1)/2;
   const pos=toWorld(cX,cZ),w=f.w*CELL,h=f.h*CELL;
   const floors=f.w>6?4:3,wallHeight=floors*2.65,material=mats.wall[f.color%4];
   box(pos.x,wallHeight/2,pos.z,w,wallHeight,h,material,true,g);
   box(pos.x,wallHeight+.17,pos.z,w+.55,.34,h+.55,mats.roof,true,g);
   for(const xx of [-w/2+.18,w/2-.18])box(pos.x+xx,wallHeight+.46,pos.z,.34,.8,h+.75,mats.ledge,true,g);
   for(const zz of [-h/2+.18,h/2-.18])box(pos.x,wallHeight+.46,pos.z+zz,w+.35,.8,.34,mats.ledge,true,g);
   for(let i=0;i<Math.floor(w/2.7);i++){
     const lx=pos.x-w/2+1.7+i*2.7;
     for(let j=0;j<floors;j++){
       const yy=1.9+j*2.65;
       const material=random()>.82?m('#81775c',.5):mats.glass;
       for(const side of [-1,1]){
         box(lx,yy,pos.z+side*(h/2+.045),1.12,1.2,.12,material,false,g);
         box(lx,yy+.62,pos.z+side*(h/2+.14),1.31,.12,.1,mats.ledge,false,g);
         if(random()>.75)box(lx,yy,pos.z+side*(h/2+.15),1.16,.065,.075,mats.metal,false,g);
       }
     }
   }
   for(let i=0;i<Math.floor(h/3);i++){
     const lz=pos.z-h/2+1.8+i*3;
     for(let j=0;j<floors;j++){
       const yy=1.9+j*2.65;
       for(const side of [-1,1])box(pos.x+side*(w/2+.04),yy,lz,.11,1.1,1.04,mats.glass,false,g);
     }
   }
   const roofUnitX=pos.x+w*.17;
   box(roofUnitX,wallHeight+.65,pos.z-h*.18,1.7,1,.95,mats.metal,true,g);
   box(pos.x-w*.15,wallHeight+.52,pos.z+h*.16,1.65,.72,1.4,mats.rust,true,g);
   // Boutiques fermées : vitrines, rideaux, petites enseignes.
   if(f.z>7){
     box(pos.x,1.45,pos.z-h/2-.12,3.2,2.4,.15,mats.metal,true,g);
     box(pos.x,2.9,pos.z-h/2-.25,4.2,.66,.24,mats.burnt,true,g);
     for(let k=0;k<8;k++)box(pos.x,1.3+k*.26,pos.z-h/2-.24,3.1,.035,.025,mats.pale,false,g);
   }
   arts.push({feature:f,group:g,kind:'building'});
 }
 function wheels(parent,w,l){
   for(const x of [-w*.30,w*.30])for(const z of [-l*.51,l*.51]){
     const tyre=new T.Mesh(new T.CylinderGeometry(.47,.47,.22,12),mats.tire);
     tyre.rotation.x=Math.PI/2;tyre.position.set(x,.48,z);tyre.castShadow=true;parent.add(tyre);
   }
 }
 function wreckedCar(f){
   const group=new T.Group();scene.add(group);
   const pos=toWorld(f.x+(f.w-1)/2,f.z+(f.h-1)/2);
   group.position.set(pos.x,.12,pos.z);
   const horizontal=f.w>f.h;
   if(horizontal)group.rotation.y=Math.PI/2;
   const len=Math.max(f.w,f.h)*CELL*.88,w=1.9;
   box(0,.83,0,w,.78,len,mats.burnt,true,group);
   box(0,1.47,-len*.10,1.58,.62,len*.49,mats.rust,true,group);
   box(0,1.82,-len*.1,1.54,.09,len*.53,mats.burnt,true,group);
   for(const side of [-1,1])box(side*.91,1.40,-len*.15,.07,.43,len*.44,mats.glass,false,group);
   box(0,1.09,len*.35,1.84,.08,len*.28,mats.rust,true,group).rotation.x=-.31;
   wheels(group,w,len);
   for(let i=0;i<5;i++)box((random()-.5)*w*2,.10,(random()-.5)*len*1.5,.12+random()*.5,.12,.1+random()*.28,mats.dirt,false,group);
   arts.push({feature:f,group,kind:f.kind});
 }
 function bus(f){
   const group=new T.Group();scene.add(group);
   const pos=toWorld(f.x+(f.w-1)/2,f.z+(f.h-1)/2);
   group.position.set(pos.x,0,pos.z);
   const length=f.w*CELL-.3,depth=f.h*CELL-.45;
   box(0,1.6,0,length,2.65,depth,mats.burnt,true,group);
   box(0,3,0,length+.06,.27,depth+.08,mats.rust,true,group);
   const wins=Math.floor(length/1.8);
   for(let j=0;j<wins;j++){
     const xx=-length/2+.9+j*1.8;
     for(const z of [-depth/2-.06,depth/2+.06]){
       box(xx,2.1,z,1.35,.98,.08,j%4===1?mats.pale:mats.glass,false,group);
       box(xx+1,2.12,z,.1,1,.1,mats.metal,false,group);
     }
   }
   for(const xx of [-length*.38,length*.35])for(const zz of [-depth*.53,depth*.53]){
     const wheel=new T.Mesh(new T.CylinderGeometry(.62,.62,.27,12),mats.tire);
     wheel.rotation.x=Math.PI/2;wheel.position.set(xx,.61,zz);group.add(wheel);
   }
   box(length/2+.05,1.9,0,.13,1.7,depth*.7,mats.rust,true,group);
   const sign=box(-length*.19,3.19,-depth*.51,3.25,.42,.13,mats.burnt,false,group);
   arts.push({feature:f,group,kind:'bus'});
 }
 function dumpster(f){
   const group=new T.Group();scene.add(group);
   const pos=toWorld(f.x+(f.w-1)/2,f.z+(f.h-1)/2);group.position.set(pos.x,.24,pos.z);
   group.rotation.z=.36;
   box(0,.57,0,2.1,1.2,1.5,mats.green,true,group);
   box(.35,1.25,-.18,1.9,.16,1.5,mats.metal,true,group).rotation.z=.24;
   for(let i=0;i<4;i++)box((random()-.5)*3,.15,(random()-.5)*2.5,.25+random()*.45,.2,.22,mats.dirt,true,group);
   arts.push({feature:f,group,kind:f.kind});
 }
 function barrier(f){
   const group=new T.Group();scene.add(group);
   const pos=toWorld(f.x+(f.w-1)/2,f.z+(f.h-1)/2);group.position.set(pos.x,0,pos.z);
   box(0,.49,0,f.w*CELL-.3,.98,f.h*CELL-.25,mats.ledge,true,group);
   for(let x=-(f.w*CELL-.5)/2+.3;x<f.w*CELL/2-.2;x+=.85){
     box(x,.62,f.h*CELL/2-.1,.44,.24,.05,mats.rust,false,group);
   }
   arts.push({feature:f,group,kind:'barrier'});
 }
 for(const f of FEATURES){
   if(f.kind==='building')building(f);
   else if(f.kind==='bus')bus(f);
   else if(['car','wreck'].includes(f.kind))wreckedCar(f);
   else if(f.kind==='dumpster')dumpster(f);
   else barrier(f);
 }
 // Débris discrets sur chaussée non bloquante, flaques et lampadaires en bordure.
 const rubbleG=new T.Group();scene.add(rubbleG);
 for(let i=0;i<175;i++){
   const x=Math.floor(random()*W),z=Math.floor(random()*H);
   if(FEATURES.some(f=>x>=f.x-1&&x<f.x+f.w+1&&z>=f.z-1&&z<f.z+f.h+1))continue;
   const p=toWorld(x+(random()-.5)*.65,z+(random()-.5)*.65);
   box(p.x,.10,p.z,.06+random()*.25,.08,.12+random()*.26,random()>.5?mats.dirt:mats.pale,false,rubbleG);
 }
 const poles=[];
 for(const [x,z] of [[3,7],[12,12],[20,7],[27,12]]){
   const p=toWorld(x,z),group=new T.Group();group.position.set(p.x,0,p.z);scene.add(group);
   box(0,3.7,0,.12,7.4,.12,mats.metal,true,group);
   box(.65,7.34,0,1.3,.09,.12,mats.metal,true,group);
   box(1.14,7.23,0,.42,.085,.32,new T.MeshBasicMaterial({color:0xffdcab}),false,group);
   const light=new T.PointLight(0xf0c395,9,10,2);light.position.set(p.x+1.14,7,p.z);scene.add(light);
   poles.push({group,light,x,z});
 }
 const start=toWorld(START.x,START.z),exit=toWorld(EXIT.x,EXIT.z);
 const groundStart=new T.Mesh(new T.RingGeometry(.7,.96,40),new T.MeshBasicMaterial({color:0x8fd0be,transparent:true,opacity:.8,side:T.DoubleSide}));
 groundStart.rotation.x=-Math.PI/2;groundStart.position.set(start.x,.24,start.z);scene.add(groundStart);
 const exitGroup=new T.Group();exitGroup.position.set(exit.x,0,exit.z);scene.add(exitGroup);
 const eRing=new T.Mesh(new T.RingGeometry(.8,1.1,48),new T.MeshBasicMaterial({color:0x88e6be,transparent:true,opacity:.95,side:T.DoubleSide}));
 eRing.rotation.x=-Math.PI/2;eRing.position.y=.25;exitGroup.add(eRing);
 const beam=new T.Mesh(new T.CylinderGeometry(.42,1,8,20,1,true),new T.MeshBasicMaterial({color:0xa4f6d7,transparent:true,opacity:.11,side:T.DoubleSide,depthWrite:false}));
 beam.position.y=4;exitGroup.add(beam);
 function character(color,infected=false){
   const g=new T.Group();scene.add(g);
   const jacket=m(color),skin=m(infected?'#99a38d':'#ba9477'),pants=m(infected?'#474d48':'#313e3e');
   box(0,.67,0,.56,.3,.4,pants,true,g);
   box(0,1.24,0,.58,.91,.44,jacket,true,g);
   const neck=new T.Mesh(new T.CylinderGeometry(.11,.13,.24,8),skin);neck.position.y=1.75;g.add(neck);
   const head=new T.Mesh(new T.SphereGeometry(.255,12,10),skin);head.position.set(0,1.97,-.03);head.castShadow=true;g.add(head);
   for(const sign of [-1,1]){
     box(sign*.17,.34,-.05,.21,.68,.26,pants,true,g);
     box(sign*.43,1.26,-.12,.20,.74,.23,jacket,true,g).rotation.x=infected?-.26:-.67;
   }
   if(!infected){
     box(0,1.25,.33,.46,.64,.26,mats.green,true,g);
     box(0,2.22,-.02,.49,.13,.42,mats.dirt,true,g);
     box(.04,1.28,-.63,.12,.14,.6,mats.metal,true,g);
   }else{
     box(-.13,1.05,-.29,.31,.43,.05,mats.rust,true,g).rotation.z=.2;
     box(.13,1.92,-.24,.12,.09,.04,mats.rust,false,g);
     g.rotation.z=.06;
   }
   const circle=new T.Mesh(new T.RingGeometry(.39,.50,36),new T.MeshBasicMaterial({color:infected?0xc46c64:0xe3d0a0,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide}));
   circle.rotation.x=-Math.PI/2;circle.position.y=.08;g.add(circle);
   return{group:g,circle,head};
 }
 const player=character('#698b80');
 const zombies=new Map();
 function setupZombies(state){
   for(const z of state.zombies)zombies.set(z.id,character(z.id%2?'#6e7062':'#676d68',true));
 }
 function stashVisual(type){
   const group=new T.Group();scene.add(group);
   const materials={ammo:0xdab675,heal:0x9fd9ad,bottle:0xb7c7b0,shotgun:0xe0aa86};
   const color=new T.MeshStandardMaterial({color:materials[type],emissive:materials[type],emissiveIntensity:.35,metalness:.15,roughness:.6});
   box(0,.27,0,type==='shotgun'?1.2:.72,.42,.67,color,true,group);
   box(0,.50,0,.47,.06,.12,mats.pale,false,group);
   return group;
 }
 const stashes=new Map();
 function setupStashes(state){for(const l of state.stashes){const vis=stashVisual(l.type);const p=toWorld(l.x,l.z);vis.position.set(p.x,.02,p.z);stashes.set(l.id,vis)}}
 // Brouillard en texture : chaque dalle est masquée jusqu'à sa découverte.
 const fogCanvas=document.createElement('canvas');fogCanvas.width=W*24;fogCanvas.height=H*24;
 const fogCtx=fogCanvas.getContext('2d');
 const fogTex=new T.CanvasTexture(fogCanvas);fogTex.colorSpace=T.SRGBColorSpace;
 fogTex.magFilter=T.NearestFilter;fogTex.minFilter=T.LinearFilter;
 const fogMat=new T.MeshBasicMaterial({map:fogTex,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const fogMesh=new T.Mesh(new T.PlaneGeometry(mapWidth,mapHeight),fogMat);
 fogMesh.rotation.x=-Math.PI/2;fogMesh.position.y=.20;fogMesh.renderOrder=20;scene.add(fogMesh);
 let lastFog=-1;
 function updateFog(s){
   if(lastFog===s.turn)return;
   lastFog=s.turn;
   fogCtx.clearRect(0,0,fogCanvas.width,fogCanvas.height);
   for(let z=0;z<H;z++)for(let x=0;x<W;x++){
     const k=key(x,z),isVisible=s.visible.has(k),isExplored=s.explored.has(k);
     if(isVisible)continue;
     fogCtx.fillStyle=isExplored?'rgba(9,17,20,.76)':'rgba(6,12,16,.98)';
     fogCtx.fillRect(x*24,z*24,24,24);
   }
   fogTex.needsUpdate=true;
 }
 function sync(s){
   updateFog(s);
   for(const art of arts){
     const f=art.feature;let shown=false;
     for(let z=f.z;z<f.z+f.h&&!shown;z++)for(let x=f.x;x<f.x+f.w;x++){
       if(s.visible.has(key(x,z))){shown=true;break}
     }
     art.group.visible=shown;
   }
   for(const {group,light,x,z} of poles){
     const visible=s.visible.has(key(x,z));group.visible=visible;light.intensity=visible?9:0;
   }
   for(const z of s.zombies){
     const actor=zombies.get(z.id);if(!actor)continue;
     actor.group.visible=z.alive&&s.visible.has(key(z.x,z.z));
     const p=toWorld(z.x,z.z);actor.goalX=p.x;actor.goalZ=p.z;
     actor.circle.material.color.set(z.brain==='poursuite'?0xea786c:z.brain==='alerte'||z.brain==='recherche'?0xe3ad6a:0x9e8279);
   }
   for(const l of s.stashes){
     const a=stashes.get(l.id);if(!a)continue;
     a.visible=!l.looted&&s.visible.has(key(l.x,l.z));
   }
   const wp=toWorld(s.player.x,s.player.z);
   player.goalX=wp.x;player.goalZ=wp.z;
   exitGroup.visible=s.visible.has(key(EXIT.x,EXIT.z));
 }
 function animate(dt,elapsed){
   for(const actor of [player,...zombies.values()]){
     if(actor.goalX===undefined)continue;
     const targetX=actor.goalX,targetZ=actor.goalZ;
     const deltaX=targetX-actor.group.position.x,deltaZ=targetZ-actor.group.position.z;
     actor.group.position.x+=deltaX*Math.min(1,dt*9);
     actor.group.position.z+=deltaZ*Math.min(1,dt*9);
     if(Math.abs(deltaX)+Math.abs(deltaZ)>.025)actor.group.rotation.y=Math.atan2(-deltaX,-deltaZ);
   }
   eRing.material.opacity=.72+.22*Math.sin(elapsed*2.4);
 }
 // Hit planes pour détecter les cases du sol, même sous les objets.
 const clickSurface=new T.Mesh(new T.PlaneGeometry(mapWidth,mapHeight),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}));
 clickSurface.rotation.x=-Math.PI/2;clickSurface.position.y=.12;scene.add(clickSurface);
 return{mats,arts,player,zombies,stashes,poles,fogMesh,setupZombies,setupStashes,sync,animate,clickSurface};
}
