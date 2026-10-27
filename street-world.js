import {addOvergrowth} from './overgrowth.js';
/* ZONE ZÉRO · Rue abandonnée — décor physique et matériaux.
   Étude visuelle : aucun système de zombies, d'inventaire ou de farming. */
export function buildStreet(T, scene) {
  let seed = 721903;
  const rand = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const pick = a => a[Math.floor(rand()*a.length)];
  const mat = (color, roughness=.8, metalness=.03, others={}) => new T.MeshStandardMaterial({color,roughness,metalness,...others});
  const M = {
    concrete: mat('#7b8078',.92), concreteLight: mat('#9a9b8c',.92),
    road: mat('#696f69',.85,.02), pavement:mat('#8c8e83',.94),
    brick:mat('#806d61',.96), plaster:mat('#8d9185',.96),
    charcoal:mat('#333b38',.9), painted:mat('#57685f',.76,.16),
    faded:mat('#b9ac8a',.87), window:mat('#233c3d',.22,.45),
    metal:mat('#515e5a',.59,.65), rust:mat('#875849',.87,.16),
    rubber:mat('#252b2b',.9,.08), bone:mat('#c6c0a9',.9),
    leaves:mat('#626f55',.9,0,T.DoubleSide?{side:T.DoubleSide}:{}),
    foliage:mat('#6e7b58',.94), yellow:mat('#b69a56',.86),
    dark:mat('#212b2b',.9), tar:mat('#414a47',.4,.23)
  };
  const colliders = [];
  const mesh=(geometry, material, x=0,y=0,z=0, parent=scene, casts=true)=>{
    const o=new T.Mesh(geometry, material);
    o.position.set(x,y,z);o.castShadow=casts;o.receiveShadow=true;
    parent.add(o);return o;
  };
  const box=(x,y,z,w,h,d,m=M.concrete,parent=scene,casts=true)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent,casts);
  const cylinder=(x,y,z,r1,r2,h,m=M.metal,parent=scene,seg=12)=>{
    const o=mesh(new T.CylinderGeometry(r1,r2,h,seg),m,x,y,z,parent,true);return o;
  };
  const collision=(x,z,w,d)=>colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  function noiseTex(base, mode, size=512) {
    const c=document.createElement('canvas');c.width=size;c.height=size;
    const g=c.getContext('2d');
    g.fillStyle=base;g.fillRect(0,0,size,size);
    for(let i=0;i<size*size*.11;i++){
      const x=rand()*size,y=rand()*size,n=rand();
      g.globalAlpha=.035+rand()*.12;
      g.fillStyle=n>.52?'#e5dfd0':'#101b1b';
      g.fillRect(x,y,1+rand()*3.2,1+rand()*3.2);
    }
    if(mode==='asphalt'){
      for(let i=0;i<23;i++){
        let x=rand()*size,y=rand()*size;g.beginPath();g.moveTo(x,y);
        g.strokeStyle=rand()>.35?'#28322e':'#b1b1a2';g.globalAlpha=.09+rand()*.14;g.lineWidth=.6+rand()*1.5;
        for(let j=0;j<15;j++){x+=(rand()-.5)*24;y+=(rand()-.5)*20;g.lineTo(x,y)}
        g.stroke();
      }
      for(let i=0;i<18;i++){
        const x=rand()*size,y=rand()*size;
        g.globalAlpha=.05+rand()*.07;g.fillStyle='#141c1b';
        g.beginPath();g.ellipse(x,y,5+rand()*24,3+rand()*11,rand()*6,0,Math.PI*2);g.fill();
      }
    }
    if(mode==='paving'){
      g.globalAlpha=.20;g.strokeStyle='#4a5149';g.lineWidth=2.2;
      for(let y=0;y<size;y+=54) {
        g.beginPath();g.moveTo(0,y);g.lineTo(size,y);g.stroke();
        for(let x=(Math.floor(y/54)%2)*50;x<size;x+=100){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+54);g.stroke()}
      }
    }
    if(mode==='brick'){
      g.globalAlpha=.20;g.fillStyle='#39352d';
      for(let y=0;y<size;y+=38){
        g.fillRect(0,y,size,2);
        for(let x=(Math.floor(y/38)%2)*36;x<size;x+=76)g.fillRect(x,y,2,38);
      }
      g.globalAlpha=.16;
      for(let i=0;i<60;i++){g.fillStyle=rand()>.5?'#beb6a2':'#3e423c';g.fillRect(rand()*size,rand()*size,1+rand()*40,1+rand()*4)}
    }
    g.globalAlpha=1;
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
    tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=8;
    return tx;
  }
  const asphaltTex=noiseTex('#747a72','asphalt',768);asphaltTex.repeat.set(17,5);
  M.road.map=asphaltTex;M.road.color.set('#ffffff');M.road.roughness=.84;M.road.bumpMap=asphaltTex;M.road.bumpScale=.09;
  const pavementTex=noiseTex('#94968a','paving');pavementTex.repeat.set(18,2);
  M.pavement.map=pavementTex;M.pavement.color.set('#ffffff');M.pavement.bumpMap=pavementTex;M.pavement.bumpScale=.05;
  const brickTex=noiseTex('#928377','brick');brickTex.repeat.set(4,3);
  M.brick.map=brickTex;M.brick.color.set('#ffffff');M.brick.bumpMap=brickTex;M.brick.bumpScale=.025;
  // Poly Haven CC0 : cartes PBR chargées si disponibles. Les matériaux procéduraux restent autonomes en secours.
  const loader=new T.TextureLoader();
  const loadPBR=(name,target,repeat,diff='diff',normal='nor_gl',rough='rough')=>{
    const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/'+name+'/'+name+'_';
    const load=(suffix,callback)=>loader.load(base+suffix+'_1k.jpg',tex=>{
      tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(...repeat);tex.anisotropy=8;
      callback(tex);target.needsUpdate=true;
    },undefined,()=>{});
    load(diff,tex=>{tex.colorSpace=T.SRGBColorSpace;target.map=tex});
    load(normal,tex=>{target.normalMap=tex;target.bumpMap=null});
    load(rough,tex=>{target.roughnessMap=tex});
  };
  loadPBR('asphalt_03',M.road,[18,4]);
  loadPBR('concrete_pavement',M.pavement,[20,2]);
  // Chaussée, bordures et trottoirs : 145 × 90 mètres.
  box(0,-.55,0,152,1,92,M.charcoal,scene,false);
  box(0,.005,0,148,.025,28,M.road,scene,false);
  for(const side of [-1,1]){
    box(0,.09,side*18.2,150,.18,8.3,M.pavement,scene,false);
    box(0,.14,side*14.08,150,.27,.25,M.concreteLight,scene,false);
    box(0,.025,side*23,150,.1,4.4,M.charcoal,scene,false);
  }
  // Peintures routières effacées, arrêts anciens et passages piétons.
  const lineMat=mat('#afa993',.93,0,{transparent:true,opacity:.57,depthWrite:false});
  const fadedLine=mat('#c0b6a1',.95,0,{transparent:true,opacity:.31,depthWrite:false});
  for(let x=-69;x<70;x+=7.6){
    box(x,.035,0,3.5,.015,.11,lineMat,scene,false);
    for(const side of [-1,1]){
      if(x%3>2)box(x,.035,side*11.35,2.7,.014,.10,fadedLine,scene,false);
    }
  }
  for(const at of [-40,28]){
    for(let j=0;j<6;j++){
      const x=at+j*1.45;
      box(x,.037,-12,0.68,.012,3.1,rand()>.35?lineMat:fadedLine,scene,false);
      box(x,.037,12,.68,.012,3.1,rand()>.45?lineMat:fadedLine,scene,false);
    }
  }
  function signTexture(title,bg='#3e594f',fg='#e1d8ba'){
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,128);
    for(let i=0;i<2500;i++){g.fillStyle=rand()>.5?'#f5ecd8':'#1a2221';g.globalAlpha=rand()*.11;g.fillRect(rand()*512,rand()*128,rand()*4,rand()*6)}
    g.globalAlpha=1;g.font='bold 58px Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=fg;g.fillText(title,256,67,472);
    return new T.CanvasTexture(c);
  }
  const facadeMats=[M.brick,M.plaster,mat('#757c76',.94),mat('#918c7d',.92),mat('#686e68',.94)];
  const models=[];
  function building(spec){
    const {x,side,w,depth,h,name,finish,ruin}=spec;
    const z=side*(23+depth/2);
    const front=z-side*depth/2;
    const group=new T.Group();scene.add(group);
    const frontMat=facadeMats[finish%facadeMats.length];
    // Volume architectural et éléments de toiture réellement tridimensionnels.
    box(x,h/2,z,w,h,depth,frontMat,group,true);
    box(x,h+.22,z,w+.6,.45,depth+.6,M.tar,group,true);
    for(const edge of [-1,1]) {
      box(x+edge*(w/2-.18),h+.5,z,.4,.7,depth+.45,M.concreteLight,group,true);
    }
    box(x,h+.40,z+side*(depth/2-.17),w+.4,.56,.35,M.concrete,group,true);
    // Cadres, fenêtres, menuiseries et décors d'étage.
    const windows=Math.max(2,Math.floor((w-2)/2.65));
    const levels=Math.max(2,Math.floor((h-2.6)/3.15));
    const doorRows=[];
    for(let level=0;level<levels;level++){
      const yy=3.8+level*3.08;
      if(yy+1.1>h-.55)break;
      for(let i=0;i<windows;i++){
        if(ruin&&((i*3+level)%7===1))continue;
        const xx=x-w/2+1.4+i*(w-2.8)/Math.max(1,windows-1);
        const zFace=front-side*.17;
        // Renfoncement sombre, deux carreaux, encadrement et appui.
        box(xx,yy,zFace,1.38,1.82,.16,M.dark,group,false);
        box(xx,yy,zFace-side*.12,1.09,1.52,.07,rand()>.7?M.rust:M.window,group,false);
        box(xx,yy,zFace-side*.19,.075,1.48,.1,M.metal,group,false);
        box(xx,yy+.03,zFace-side*.19,1.05,.07,.1,M.metal,group,false);
        box(xx,yy-.91,zFace-side*.32,1.66,.16,.40,M.concreteLight,group,false);
        box(xx,yy+.94,zFace-side*.1,1.61,.12,.26,M.concrete,group,false);
        if(rand()>.72)box(xx+.42,yy,zFace-side*.32,.30,1.56,.09,M.charcoal,group,false);
      }
    }
    // Rez-de-chaussée : magasins, rideaux métalliques et portes scellées.
    const shopW=Math.min(w-1.4,Math.max(5,w*.62));
    const doorX=x-w*.28,shopZ=front-side*.16;
    box(x,1.62,shopZ,shopW,2.9,.15,M.dark,group,false);
    box(x,1.65,shopZ-side*.10,shopW-.24,2.6,.09,M.metal,group,false);
    for(let row=0;row<23;row++){
      box(x,0.34+row*.115,shopZ-side*.2,shopW-.26,.016,.035,row%6===0?M.rust:M.painted,group,false);
    }
    box(doorX,1.38,shopZ-side*.19,1.25,2.65,.11,M.charcoal,group,false);
    cylinder(doorX+.43,1.48,shopZ-side*.31,.055,.055,.10,M.bone,group);
    // Panneau commercial avec texture typographique.
    const tx=signTexture(name,ruin?'#514d42':'#41594f');
    const panelMat=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide,toneMapped:false});
    const sign=mesh(new T.PlaneGeometry(Math.min(w-.7,7.5),1.1),panelMat,x,3.00,front-side*.39,group,false);
    if(side===1)sign.rotation.y=Math.PI;
    // Coulures, câbles, façades descellées.
    for(let i=0;i<12;i++){
      const yy=.35+rand()*(h-1.3),xx=x+(rand()-.5)*(w-1.4);
      const trail=box(xx,yy,front-side*.31,.08,.12+rand()*1.75,.017,rand()>.6?M.rust:M.charcoal,group,false);
      trail.rotation.z=(rand()-.5)*.14;
    }
    for(let i=0;i<3;i++){
      const roofX=x+(rand()-.5)*(w-2);
      box(roofX,h+.63,z+(rand()-.5)*(depth-2),1.1,.62,.86,rand()>.5?M.rust:M.metal,group,true);
    }
    // Un peu de nature sur les corniches.
    for(let i=0;i<7;i++)if(rand()>.25){
      const xx=x+(rand()-.5)*w;
      cylinder(xx,h+.43,front,.035,.035,.35+rand()*.35,M.foliage,group,5);
    }
    if(ruin){
      // Murs abîmés, tas de gravats et fers exposés.
      for(let i=0;i<10;i++){
        const xx=x+(rand()-.5)*(w-1),zz=front-side*(1+rand()*1.4);
        box(xx,.16+rand()*.27,zz,.2+rand()*.8,.25+rand()*.3,.3+rand()*.7,rand()>.5?M.concrete:M.brick,group,true).rotation.y=rand()*6;
      }
      for(let i=0;i<5;i++){
        const xx=x+(rand()-.5)*w;
        box(xx,h+.02,front-side*(.15+rand()*.65),.2,.2,.9,M.rust,group,true).rotation.z=rand()*1.3;
      }
    }
    collision(x,z,w,depth);
    models.push(group);
  }
  const specs=[
    {x:-62,side:-1,w:20,depth:13,h:15,name:'LIBRAIRIE',finish:1,ruin:false},
    {x:-40,side:-1,w:21,depth:14,h:18,name:'PHARMACIE',finish:0,ruin:true},
    {x:-17,side:-1,w:21,depth:14,h:13,name:'CAFÉ NORD',finish:4,ruin:true},
    {x:17,side:-1,w:22,depth:15,h:17,name:'HÔTEL DE VILLE',finish:2,ruin:false},
    {x:42,side:-1,w:21,depth:13,h:13,name:'ÉLECTRICITÉ',finish:0,ruin:true},
    {x:64,side:-1,w:20,depth:14,h:17,name:'CINÉMA',finish:3,ruin:false},
    {x:-62,side:1,w:20,depth:15,h:11,name:'ATELIER',finish:4,ruin:true},
    {x:-40,side:1,w:20,depth:15,h:13,name:'QUINCAILLERIE',finish:1,ruin:false},
    {x:-18,side:1,w:21,depth:14,h:10,name:'ÉPICERIE',finish:0,ruin:true},
    {x:16,side:1,w:24,depth:15,h:14,name:'PRESSE',finish:3,ruin:true},
    {x:43,side:1,w:22,depth:13,h:12,name:'GARAGE',finish:2,ruin:false},
    {x:65,side:1,w:20,depth:14,h:14,name:'HABITATIONS',finish:1,ruin:false}
  ];
  for(const s of specs)building(s);
  // Entrées de cour et angles où la nature a gagné du terrain.
  for(const x of [-4,0,5]) {
    box(x,-.05,-32,1.3,.10,12,M.charcoal,scene,false);
    box(x,-.05,31,1.5,.10,10,M.charcoal,scene,false);
  }
  function abandonedCar(x,z,rotation=0,color='#777f75',wrecked=false){
    const group=new T.Group();group.position.set(x,.04,z);group.rotation.y=rotation;scene.add(group);
    const body=mat(color,.65,.53),roof=mat(wrecked?'#443d39':'#59645f',.71,.34);
    const chrome=mat('#9b9f93',.38,.75),glass=mat('#283e41',.15,.6),lamp=mat('#9f947f',.3);
    // Châssis, ailes, habitacle, pare-brises et pare-chocs.
    box(0,.78,0,2.00,.58,4.4,body,group,true);
    box(0,1.06,-.66,1.94,.30,1.75,body,group,true);
    box(0,1.13,1.48,1.96,.28,1.22,body,group,true);
    box(0,1.54,-.15,1.71,.57,2.35,roof,group,true);
    box(0,1.86,-.20,1.72,.11,2.12,roof,group,true);
    const winds=[-.98,.67];
    for(const wz of winds){
      const glassPane=box(0,1.65,wz,1.47,.38,.055,glass,group,false);
      glassPane.rotation.x=wz<0?.33:-.42;
    }
    for(const side of [-1,1]){
      box(side*.91,1.38,-.24,.065,.4,1.7,glass,group,false);
      box(side*.96,1.12,-.7,.085,.11,1.65,chrome,group,false);
      box(side*.87,.95,1.52,.08,.11,1.15,body,group,false);
      for(const wz of [-1.43,1.38]){
        const wheel=mesh(new T.CylinderGeometry(.43,.43,.29,16),M.rubber,side*1.01,.43,wz,group,true);
        wheel.rotation.z=Math.PI/2;
        const hub=mesh(new T.CylinderGeometry(.23,.23,.303,12),M.metal,side*1.04,.43,wz,group,false);
        hub.rotation.z=Math.PI/2;
      }
    }
    box(0,.63,-2.25,1.72,.16,.13,M.metal,group,true);
    box(0,.63,2.26,1.77,.16,.13,M.metal,group,true);
    for(const side of [-1,1]){
      box(side*.68,.82,-2.24,.37,.18,.08,wrecked?M.rust:lamp,group,false);
      box(side*.68,.85,2.24,.35,.15,.09,M.rust,group,false);
    }
    if(wrecked){
      box(-.13,1.55,-.15,1.75,.06,.8,M.charcoal,group,true).rotation.z=.12;
      for(let i=0;i<12;i++){
        const a=rand()*6.28,r=1.9+rand()*1.25;
        box(Math.cos(a)*r,.06,Math.sin(a)*r,.14+rand()*.5,.08,.13+rand()*.35,rand()>.5?M.rust:M.dark,scene,false);
      }
    }
    collision(x,z,3.5,6.1);
    return group;
  }
  abandonedCar(-56,-7,.37,'#535950',true);
  abandonedCar(-27,6,-.55,'#6f6b5c',false);
  abandonedCar(4,-7,.23,'#716d59',true);
  abandonedCar(35,5,-.28,'#4c645c',false);
  abandonedCar(59,-6,.22,'#8e7e67',true);
  function dumpster(x,z,rotation=0){
    const g=new T.Group();g.position.set(x,.15,z);g.rotation.y=rotation;scene.add(g);
    box(0,.77,0,1.9,1.35,1.25,M.painted,g,true);
    box(0,1.47,.1,2.02,.14,1.36,M.rust,g,true).rotation.x=.24;
    box(.4,1.58,-.36,.55,.18,.19,M.rubber,g,false);
    for(const side of [-1,1])for(const vz of [-.4,.4]){
      cylinder(side*.9,.22,vz,.12,.12,.16,M.rubber,g,8);
    }
    collision(x,z,2,1.5);
  }
  dumpster(-10,-14,1.57);dumpster(23,14,.38);dumpster(52,13,-.5);
  function streetlamp(x,z,lit=true){
    const g=new T.Group();g.position.set(x,0,z);scene.add(g);
    cylinder(0,3.9,0,.08,.12,7.8,M.metal,g,10);
    box(.55,7.83,0,1.2,.08,.10,M.metal,g);
    cylinder(1.10,7.72,0,.34,.29,.12,M.charcoal,g,12);
    const bulb=mesh(new T.SphereGeometry(.17,12,9),mat('#e9d3a1',.2,0,{emissive:'#e6be80',emissiveIntensity:lit?2:.1}),1.1,7.56,0,g,false);
    if(lit){
      const l=new T.PointLight(0xffd7a1,12,15,2);l.position.set(x+1.1,7.2,z);scene.add(l);
      const pool=mesh(new T.CircleGeometry(3.8,42),new T.MeshBasicMaterial({color:'#ebc289',transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}),x+1.1,.043,z,scene,false);
      pool.rotation.x=-Math.PI/2;
    }
    return g;
  }
  for(const x of [-63,-35,-7,21,49,69]){
    streetlamp(x,-15.3,rand()>.3);
    streetlamp(x+11,15.3,rand()>.62);
  }
  function debris(){
    const groups={};
    // Gravats dispersés, morceaux de verre, papiers et plaques de rouille.
    const pile=[M.concrete,M.bone,M.rust,M.charcoal,M.brick,M.metal];
    for(let i=0;i<280;i++){
      const x=-73+rand()*146,z=-21+rand()*42;
      if(colliders.some(b=>x>b.minX-.6&&x<b.maxX+.6&&z>b.minZ-.6&&z<b.maxZ+.6))continue;
      const w=.07+rand()*.35,h=.015+rand()*.12,d=.08+rand()*.25;
      box(x,h/2+.035,z,w,h,d,pick(pile),scene,false).rotation.y=rand()*Math.PI*2;
    }
    // Éclats de fenêtres ou papier glissé sur le bitume.
    const paper=mat('#c2b79d',.98,0,{side:T.DoubleSide});
    for(let i=0;i<52;i++){
      const x=-70+rand()*140,z=-14+rand()*28;
      if(colliders.some(b=>x>b.minX-1&&x<b.maxX+1&&z>b.minZ-1&&z<b.maxZ+1))continue;
      const p=mesh(new T.PlaneGeometry(.2+rand()*.38,.14+rand()*.3),paper,x,.050,z,scene,false);
      p.rotation.x=-Math.PI/2;p.rotation.z=rand()*6.28;
    }
  }
  debris();
  // Flaques d'eau de pluie avec ombrages irréguliers.
  const puddleMat=new T.MeshPhysicalMaterial({color:'#758f8a',roughness:.18,metalness:.31,transparent:true,opacity:.55,clearcoat:1,clearcoatRoughness:.09,depthWrite:false,side:T.DoubleSide});
  for(let i=0;i<86;i++){
    const x=-71+rand()*142,z=-12+rand()*24;
    if(colliders.some(b=>x>b.minX-.6&&x<b.maxX+.6&&z>b.minZ-.6&&z<b.maxZ+.6))continue;
    const p=mesh(new T.CircleGeometry(1,22),puddleMat,x,.047,z,scene,false);
    p.rotation.x=-Math.PI/2;p.rotation.z=rand()*6.28;
    p.scale.set(.18+rand()*1.65,.11+rand()*.7,1);
  }
  // Jeunes pousses, herbes et plantes grimpantes dans les fissures du quartier.
  const blades=new T.Group();scene.add(blades);
  for(let i=0;i<280;i++){
    const x=-73+rand()*146;
    const z=(rand()>.5?1:-1)*(13.1+rand()*8.5);
    if(colliders.some(b=>x>b.minX-.3&&x<b.maxX+.3&&z>b.minZ-.3&&z<b.maxZ+.3))continue;
    const h=.15+rand()*.68;
    const o=mesh(new T.ConeGeometry(.075+rand()*.05,h,4),rand()>.3?M.leaves:M.foliage,x,h/2+.1,z,blades,false);
    o.rotation.z=(rand()-.5)*.62;
  }
  // Arbres survivants et bacs soulevés par les racines.
  function smallTree(x,z,h=5){
    const group=new T.Group();group.position.set(x,.13,z);scene.add(group);
    const trunk=mat('#584d3d',.98);
    cylinder(0,h*.48,0,.13,.27,h*.94,trunk,group,9);
    for(let j=0;j<4;j++){
      const a=j*2.33;
      const branch=cylinder(Math.cos(a)*.5,h*(.58+j*.05),Math.sin(a)*.45,.065,.11,2,trunk,group,7);
      branch.rotation.z=.2+Math.sin(a)*.4;branch.rotation.x=.35*Math.cos(a);
    }
    for(let i=0;i<7;i++){
      const a=rand()*Math.PI*2,r=rand()*1.3;
      const crown=mesh(new T.IcosahedronGeometry(.85+rand()*.7,1),i%3?M.foliage:M.leaves,Math.sin(a)*r,h*.75+(rand()-.5)*1.1,Math.cos(a)*r,group,true);
      crown.scale.y=.75+rand()*.75;
    }
    box(0,.12,0,1.9,.16,1.9,M.concrete,group,false);
    return group;
  }
  for(const [x,z,h] of [[-46,17.4,5.5],[-18,-17.1,6],[12,18.4,4.5],[46,-18.4,5.8],[67,19,5.5]])smallTree(x,z,h);
  // La rue est la seule zone de jeu pour cette étude.
  function collides(x,z,r=.47){
    if(x<-73||x>73||z<-21.3||z>21.3)return true;
    for(const c of colliders){
      const nearX=Math.max(c.minX,Math.min(x,c.maxX)),nearZ=Math.max(c.minZ,Math.min(z,c.maxZ));
      if((nearX-x)**2+(nearZ-z)**2<r*r)return true;
    }return false;
  }
  const plants=addOvergrowth(T,scene,{collides,buildings:specs});
  return {collides,colliders,materials:M,models,plants};
}
