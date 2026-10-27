/* ZONE ZÉRO — Props urbains de catastrophe : véhicules brûlés, gravats et passages étroits */
export function populateStreets(T,scene,{box,collider,roadblocks,rand,mats,blockers}){
  const material=(c,r=.85,metal=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:metal});
  const char=material('#262b29',1,.12),soot=material('#191e1d',1),scorched=material('#3d403a',1),
    rust=material('#7c5140',.93,.12),rustLight=material('#9a6350'),brokenGlass=material('#1c2c2c',.29,.2),
    glassCut=material('#929b91',.54,.14),tire=material('#242728',1),rubber=material('#333533'),
    garbage=material('#2d3833'),garbageBlue=material('#4f5c5c'),paper=material('#ab9f7f'),
    brick=material('#7d7669'),ember=material('#a65d37');
  const scrap=[rust,soot,brokenGlass,brick,mats.steel],paint=[char,soot,rust];
  const impactMark=new T.MeshBasicMaterial({color:0x1c2120,transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide});
  function addTo(parent,w,h,d,mat,x,y,z,angle=0,cast=true){
    const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.rotation.z=angle;o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;
  }
  function streetDecal(x,z,width,depth,opacity=.5){
    const obj=new T.Mesh(new T.CircleGeometry(1,18),impactMark.clone());
    obj.scale.set(width,depth,1);obj.rotation.x=-Math.PI/2;obj.position.set(x,.086,z);
    obj.material.opacity=opacity;scene.add(obj);return obj;
  }
  function register(x,z,w,d,h=1.6){
    collider(x,z,w,d,h);roadblocks.push({x,z,w,d});
  }
  // Carcasse sombre, vitres éclatées, carrosserie tordue et traces d'incendie.
  function burnedCar(x,z,angle=0,length=4.3,blocking=true){
    const g=new T.Group();g.position.set(x,.08,z);g.rotation.y=angle;scene.add(g);
    const w=length,lengthRatio=length/4.3;
    addTo(g,w,.65,1.85,char,0,.67,0);
    addTo(g,w*.4,.7,1.52,soot,-.23*lengthRatio,1.32,0);
    addTo(g,w*.42,.08,1.58,scorched,-.22*lengthRatio,1.69,0,.07);
    addTo(g,w*.22,.12,1.93,rust,w*.33,.79,0,-.25);
    addTo(g,w*.2,.09,1.96,rust,-w*.38,.84,0,.14);
    for(const zz of [-.84,.84]){
      addTo(g,w*.43,.45,.11,brokenGlass,-.16*lengthRatio,1.36,zz);
      addTo(g,w*.42,.06,.13,glassCut,-.16*lengthRatio,1.62,zz);
      addTo(g,.13,.26,.07,rust,w*.17,.72,zz*1.12);
      for(const xx of [-w*.32,w*.32]){
        const t=new T.Mesh(new T.CylinderGeometry(.36,.36,.24,11),tire);
        t.rotation.x=Math.PI/2;t.position.set(xx,.36,zz*1.10);t.castShadow=true;g.add(t);
        const hub=new T.Mesh(new T.CylinderGeometry(.19,.19,.247,10),scorched);
        hub.rotation.x=Math.PI/2;hub.position.set(xx,.36,zz*1.1);g.add(hub);
      }
    }
    // Capot ouvert et contre-plongée rouillée.
    addTo(g,w*.35,.08,1.7,rustLight,w*.36,1.05,-.03,.30);
    addTo(g,.07,.31,.39,soot,w/2,.64,-.55);
    streetDecal(x,z,w*.89,2,.52);
    for(let i=0;i<9;i++){
      const xx=x+(rand()-.5)*w*1.05,zz=z+(rand()-.5)*3.2;
      box(xx,.11,zz,.08+rand()*.37,.05,.08+rand()*.4,i%3?char:rust);
    }
    if(blocking){
      const rotated=Math.abs(angle)>.6;
      register(x,z,rotated?2.45:w+.25,rotated?w+.25:2.45,1.7);
    }
  }
  function smokeTrail(x,z){
    const material=new T.SpriteMaterial({color:0x8a8780,opacity:.17,transparent:true,depthWrite:false});
    for(let i=0;i<3;i++){
      const sprite=new T.Sprite(material.clone());sprite.position.set(x+(rand()-.5)*.8,1.5+i*1.5,z+(rand()-.5)*.8);
      const scale=1.7+i*.6;sprite.scale.set(scale,scale,1);scene.add(sprite);
    }
  }
  // Benne renversée sur le côté : métal bosselé, couvercle entrouvert, déchets visibles.
  function dumpster(x,z,angle=0,block=true){
    const g=new T.Group();g.position.set(x,.77,z);g.rotation.y=angle;g.rotation.z=.93;scene.add(g);
    const shell=material(rand()>.5?'#455a51':'#596568',.87,.24);
    addTo(g,1.48,1.34,1.18,shell,0,.0,0);
    addTo(g,1.62,.13,1.29,scorched,0,.76,-.06,.12);
    addTo(g,1.5,.16,1.2,char,.08,.79,.15,.48);
    for(const k of [-1,1]){
      addTo(g,.13,1.19,.12,mats.steel,k*.68,0,.57);
      addTo(g,.19,.19,.19,char,k*.61,-.73,.41);
      addTo(g,.13,.9,.08,scorched,k*.73,0,-.35);
    }
    for(let i=0;i<5;i++){
      const bag=new T.Mesh(new T.IcosahedronGeometry(.22+rand()*.2,0),i%2?garbage:garbageBlue);
      bag.position.set(.7+(rand()-.5)*1.4,.19+rand()*.33,.8+(rand()-.5)*.65);
      bag.scale.set(1,.8,1.3);bag.castShadow=true;scene.add(bag);
    }
    streetDecal(x,z,2.1,1.6,.28);
    if(block)register(x,z,2.55,2.0,1.5);
  }
  function bin(x,z,angle=0){
    const g=new T.Group();g.position.set(x,.49,z);g.rotation.z=Math.PI*.40;g.rotation.y=angle;scene.add(g);
    addTo(g,.59,.91,.57,rand()>.5?garbage:garbageBlue,0,0,0);
    addTo(g,.68,.08,.68,char,0,.49,.04,.2);
    addTo(g,.12,.12,.12,tire,-.29,-.48,.31);
    addTo(g,.12,.12,.12,tire,.29,-.48,.31);
    streetDecal(x,z,1,.8,.22);
  }
  function rubble(x,z,radius=1.8,blocking=false){
    const chunks=5+Math.floor(rand()*6),hasBlocks=[];
    for(let i=0;i<chunks;i++){
      const a=rand()*Math.PI*2,d=(.25+rand()*.75)*radius;
      const xx=x+Math.cos(a)*d,zz=z+Math.sin(a)*d;
      const size=.15+rand()*.6,yy=.08+size*.22;
      const object=box(xx,yy,zz,size,.15+rand()*.45,size*.75,scrap[Math.floor(rand()*scrap.length)]);
      object.rotation.y=rand()*3.14;object.rotation.x=(rand()-.5)*.35;
      hasBlocks.push(object);
    }
    if(blocking)register(x,z,radius*1.9,radius*1.7,.75);
  }
  function brokenFence(x,z,len=4.8,angle=0,block=false){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
    for(let i=0;i<=4;i++){
      const xx=-len/2+i*len/4;
      addTo(g,.08,1.7,.08,mats.steel,xx,.85,0,(i%2?-.08:.1));
    }
    for(let yy of [.45,.92,1.4])addTo(g,len,.035,.04,mats.steel,0,yy,0,yy===.92?.05:0,false);
    if(block){
      const rotate=Math.abs(angle)>.6;
      register(x,z,rotate?.2:len,rotate?len:.2,1.6);
    }
  }
  // Trois goulets : le passage restant fait environ 2 à 3 mètres de large.
  burnedCar(-38.2,7.5,Math.PI/2,6.3,true);  // Avenue ouest, véhicule noirci longitudinal
  dumpster(-31.6,7.2,0,true);
  rubble(-31.9,10.7,1.05,false);
  streetDecal(-35.3,7.5,3,4.5,.2);
  burnedCar(42,44,Math.PI/2,5.8,true);     // Avenue nord-est
  dumpster(48.1,44,Math.PI/2,true);
  rubble(48.1,47,1.2,false);
  burnedCar(23,-15.05,0,7.2,true);         // Couloir transversal : route à franchir avec précaution
  rubble(23,-9.15,1.6,true);
  // Goulot complémentaire près d'un accès infesté.
  burnedCar(86.8,-35,Math.PI/2,5.2,true);
  dumpster(81.5,-34.7,0,true);
  // Carcasses secondaires sur les routes.
  burnedCar(-57.5,57.2,0,4.25,true);
  burnedCar(60,-47.8,0,4.3,true);
  burnedCar(-12.3,22.4,0,4.1,true);
  smokeTrail(23,-15.05);smokeTrail(42,44);smokeTrail(-38.2,7.5);
  // Déchets, corbeilles arrachées, barrières tombées, amas de gravats.
  for(const p of [
    [-71,-27],[-37,-7],[-11,-16],[17,27],[40,38],[65,-45],[75,23],
    [88,15],[-88,12],[-62,22],[-28,39],[4,-2],[32,-52],[50,-2],[-2,45]
  ]){bin(p[0],p[1],(rand()-.5)*3);}
  for(const p of [[-66,-8],[33,-18],[58,25],[-21,55],[38,51],[-4,-42],[76,-6]]){
    dumpster(p[0],p[1],rand()*Math.PI,true);
    rubble(p[0]+2,p[1]+1.7,1.15,false);
  }
  for(const p of [[-48,45],[64,6],[-52,-33],[33,11]]){
    brokenFence(...p,4.5,rand()>.5?Math.PI/2:0,false);
    rubble(p[0]+1.3,p[1],1.6,false);
  }
  for(const p of [[-50,59],[-17,-30],[28,51],[67,-20],[75,14],[-75,-18],[-25,-53]]){
    rubble(p[0],p[1],1.1+rand()*.7,false);
  }
  // Traînées de pneus, taches et fissures du revêtement.
  for(let i=0;i<48;i++){
    const x=-86+rand()*172,z=-59+rand()*118;
    if(blockers.some(b=>Math.abs(x-b.x)<b.w/2+1&&Math.abs(z-b.z)<b.d/2+1))continue;
    streetDecal(x,z,.35+rand()*1.4,.18+rand()*.7,.07+rand()*.12);
  }
  // Panneaux de rue endommagés, boîtes électriques, signalisation écrasée.
  for(const [x,z] of [[-75,-17],[-36,-49],[4,25],[45,60],[86,25],[-34,60]]){
    box(x,1.6,z,.12,3,.12,mats.steel);
    box(x+.48,3,z,1.12,.53,.09,mats.rust);
    box(x+.5,3,z+.058,1,.34,.04,mats.light);
    box(x,.27,z,.82,.28,.75,mats.cement);
  }
}
