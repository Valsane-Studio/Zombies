/* Valsane Studio / ZONE ZÉRO — monde 3D et navigation */
export function createWorld(T,scene){
  const random=(()=>{let n=92643;return()=>((n=(1664525*n+1013904223)>>>0)/4294967296)})();
  const mat=(color,roughness=.87,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const materials={street:mat('#4a5352'), pavement:mat('#707970'), brick:mat('#6e7771'), wall:mat('#666b64'), roof:mat('#444c49'), concrete:mat('#898f84'), trim:mat('#b3b9a6'), metal:mat('#374243',.6,.24), rust:mat('#825f4c'), yellow:mat('#c9ad59'), glass:mat('#293c3d',.3,.35), grass:mat('#415648')};
  function noiseTexture(base,detail,count=4200){
    const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);
    for(let i=0;i<count;i++){g.globalAlpha=.03+random()*.14;g.fillStyle=detail;const x=random()*256,y=random()*256,s=.5+random()*2.8;g.fillRect(x,y,s,s)}
    g.globalAlpha=.22;g.strokeStyle='#171c1c';g.lineWidth=.8;
    for(let i=0;i<14;i++){let x=random()*256,y=random()*256;g.beginPath();g.moveTo(x,y);for(let a=0;a<4;a++){x+=random()*14-7;y+=random()*14-7;g.lineTo(x,y)}g.stroke()}
    const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(8,7);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;
  }
  const roadTex=noiseTexture('#565e59','#a3a79e');const cementTex=noiseTexture('#798077','#c1c5b5',3200);
  materials.street.map=roadTex;materials.street.color.set('#ffffff');materials.street.needsUpdate=true;
  materials.concrete.map=cementTex;materials.concrete.color.set('#ffffff');materials.concrete.needsUpdate=true;
  const blockers=[],floorMeshes=[],decals=[],lights=[];
  function box(x,y,z,w,h,d,m,shadow=true){let o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;scene.add(o);return o}
  function plane(x,y,z,w,d,m){let o=new T.Mesh(new T.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
  function marker(x,y,z,r,m){const o=new T.Mesh(new T.RingGeometry(r-.055,r,48),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);scene.add(o);return o}
  function block(x,z,w,d,h,material=materials.wall){blockers.push({x,z,w,d,h});return box(x,h/2,z,w,h,d,material)}
  // Sol : cour industrielle et routes goudronnées
  box(0,-.34,0,52,.68,40,materials.pavement,false);
  const asphalt=plane(0,.018,0,46,34,materials.street);floorMeshes.push(asphalt);
  const thin=mat('#ada992');
  for(let x=-19;x<20;x+=4.7)box(x,.044,0,2.2,.012,.075,thin,false);
  for(let z=-13;z<15;z+=4.7)box(0,.045,z,.075,.012,2.2,thin,false);
  // Trottoirs, lignes, traces et raccords des routes
  for(const z of [-8.35,8.35]){box(0,.115,z,46,.17,.42,materials.pavement,false);
    for(let x=-22;x<22;x+=2.2)box(x,.213,z,2,.008,.027,materials.trim,false)}
  for(const x of [-8.45,8.45])box(x,.11,0,.4,.16,34,materials.pavement,false);
  // Bâtiments avec façades et toitures crédibles
  function building(x,z,w,d,h,number){
    block(x,z,w,d,h,materials.brick);
    box(x,h+.14,z,w+.3,.29,d+.3,materials.roof);
    for(const sx of [-1,1]){
      box(x+sx*(w/2-.2),h+.53,z,.36,.9,d+.65,materials.concrete);
    }
    for(const sz of [-1,1])box(x,h+.53,z+sz*(d/2-.18),w+.4,.9,.3,materials.concrete);
    for(let xx=-w/2+1.1;xx<w/2-.5;xx+=1.8){
      for(let yy=1.1;yy<h-1;yy+=1.75){
        let glass=mat(random()>.77?'#73877b':'#293b39',.36,.22);
        const a=box(x+xx,yy,z+d/2+.028,1.02,.94,.05,glass,false);
        a.castShadow=false;box(x+xx,yy,z-d/2-.028,1.02,.94,.05,glass,false);
        box(x+xx,yy+.48,z+d/2+.06,1.08,.07,.09,materials.metal,false);
      }
    }
    for(let zz=-d/2+1.1;zz<d/2-.45;zz+=1.9){
      for(let yy=1.2;yy<h-1;yy+=1.75){
        const g=mat('#273738',.4,.3);
        box(x+w/2+.028,yy,z+zz,.05,.94,1,g,false);
        box(x-w/2-.028,yy,z+zz,.05,.94,1,g,false);
      }
    }
    // Climatisations, lucarnes, extracteurs sur les toits
    box(x+w*.17,h+.62,z-d*.1,1.15,.95,.95,materials.metal);
    box(x+w*.17,h+1.12,z-d*.1,1.22,.1,1.03,materials.trim);
    const fan=new T.Mesh(new T.CylinderGeometry(.4,.4,.09,12),materials.roof);
    fan.position.set(x+w*.17,h+1.2,z-d*.1);scene.add(fan);
    box(x-w*.2,h+.43,z+d*.12,1.3,.55,.9,materials.rust);
    // Enseigne sur une façade
    if(number%2===0){
      box(x,h*.52,z+d/2+.16,w*.55,.65,.16,materials.metal,false);
      for(let k=0;k<5;k++)box(x-w*.22+k*w*.11,h*.52,z+d/2+.26,.08,.29,.04,materials.trim,false);
    }
  }
  building(-15,-12,9,6,6.3,0);building(15,-12,9,6,5.3,1);
  building(-15,12,9,5.8,6.9,2);building(15,12,9,5.8,7.7,3);
  // Plateforme centrale : on peut monter exclusivement par la rampe à l'est
  const platform={left:-3.55,right:3.55,front:-3.25,back:3.25,height:2.45};
  box(0,platform.height/2,0,7.1,platform.height,6.5,materials.concrete);
  const top=box(0,platform.height+.08,0,7.1,.16,6.5,materials.roof);floorMeshes.push(top);
  // Bordure légère, sans fermeture de l'accès depuis la rampe
  box(-3.35,platform.height+.36,0,.28,.58,6.4,materials.concrete);
  box(0,platform.height+.36,3.07,6.8,.58,.26,materials.concrete);
  // Un appui de tir au nord sur le toit
  box(-2.2,platform.height+.46,-3,2.15,.76,.32,materials.concrete);
  const rampLength=5.8;
  const ramp=new T.Mesh(new T.BoxGeometry(rampLength,.25,2.45),materials.concrete);
  ramp.rotation.z=-Math.atan(platform.height/rampLength);
  ramp.position.set(platform.right+rampLength/2,platform.height/2+.06,0);
  ramp.castShadow=true;ramp.receiveShadow=true;scene.add(ramp);floorMeshes.push(ramp);
  for(let i=0;i<7;i++){let xx=3.6+i*.83,yy=platform.height*(1-(xx-platform.right)/rampLength)+.12;
    box(xx,yy,0,.08,.02,2.4,materials.trim,false)}
  // Barrières, voitures, palettes, containers — navigation contournable
  function lowWall(x,z,w,d,h=1.2){block(x,z,w,d,h,materials.concrete);box(x,h+.03,z,w+.12,.06,d+.12,materials.trim)}
  lowWall(-11,1.5,4.6,.5,1.25);lowWall(11,4.1,4.6,.55,1.25);lowWall(-10,-5.4,3.3,.55,1.25);lowWall(11,-5.6,2.2,.55,.9);
  function car(x,z,color,angle=0){
    const g=new T.Group();g.position.set(x,.08,z);g.rotation.y=angle;scene.add(g);
    const carMat=mat(color,.6,.3);
    const base=new T.Mesh(new T.BoxGeometry(3.35,.8,1.72),carMat);base.position.y=.64;base.castShadow=true;g.add(base);
    const cabin=new T.Mesh(new T.BoxGeometry(1.65,.66,1.52),materials.glass);cabin.position.set(-.23,1.26,0);cabin.castShadow=true;g.add(cabin);
    const roof=new T.Mesh(new T.BoxGeometry(1.8,.13,1.58),carMat);roof.position.set(-.23,1.62,0);g.add(roof);
    for(const sx of [-1.07,1.07])for(const sz of [-.84,.84]){
      const wh=new T.Mesh(new T.CylinderGeometry(.4,.4,.18,12),materials.metal);
      wh.rotation.x=Math.PI/2;wh.position.set(sx,.38,sz);wh.castShadow=true;g.add(wh);
    }
    for(const sz of [-.57,.57]){let light=new T.Mesh(new T.BoxGeometry(.07,.22,.3),mat('#d8ba78'));light.position.set(1.72,.67,sz);g.add(light)}
    blockers.push({x,z,w:3.5,d:1.95,h:1.7});
  }
  car(-9.8,-2.6,'#667a74');car(11.2,-2.4,'#826a5b');car(-7.2,12,'#566a73');
  function crate(x,z,s=1){blockers.push({x,z,w:s,d:s,h:s});box(x,s/2,z,s,s,s,materials.rust);
    for(const xx of [-s*.36,s*.36])box(x+xx,s/2+.01,z+s/2+.015,.06,s,.03,materials.trim,false)}
  [[-8,6.1,.9],[-6.5,-9.2,1.2],[9.7,9,.8],[19,2,1.1]].forEach(p=>crate(...p));
  function barrel(x,z){const o=new T.Mesh(new T.CylinderGeometry(.38,.38,1,12),materials.rust);
    o.position.set(x,.56,z);o.castShadow=true;scene.add(o);
    for(const h of [-.28,.28]){const band=new T.Mesh(new T.TorusGeometry(.38,.035,6,14),materials.metal);band.rotation.x=Math.PI/2;band.position.set(x,.56+h,z);scene.add(band)}
    blockers.push({x,z,w:.8,d:.8,h:1})}
  for(const p of [[-7,6],[-7.9,6],[8.8,10],[-20,-4]])barrel(...p);
  function lightPost(x,z){
    box(x,2.3,z,.18,4.6,.18,materials.metal);
    box(x+.45,4.6,z,.9,.14,.14,materials.metal);
    const bulb=new T.Mesh(new T.BoxGeometry(.35,.07,.3),new T.MeshBasicMaterial({color:0xfce6b9}));
    bulb.position.set(x+.83,4.49,z);scene.add(bulb);
    const light=new T.PointLight(0xffd5a0,10,9,2);light.position.set(x+.83,4.32,z);scene.add(light);lights.push(light);
  }
  lightPost(-6,-11);lightPost(6,11);lightPost(20,-2);
  // Débris non bloquants, végétation et fissures
  for(let i=0;i<155;i++){
    const x=-22+random()*44,z=-16+random()*32;
    if(Math.abs(x)<4.5&&Math.abs(z)<4.1)continue;
    if(blockers.some(o=>Math.abs(x-o.x)<o.w/2+.4&&Math.abs(z-o.z)<o.d/2+.4))continue;
    if(random()<.24){
      box(x,.075,z,.07+random()*.2,.04,.1+random()*.32,materials.trim,false);
    }else{
      const patch=plane(x,.054,z,.12+random()*.35,.07+random()*.16,random()>.5?materials.roof:materials.grass);
      patch.rotation.z=random()*5;decals.push(patch);
    }
  }
  // Zones jaunes de stabilité : au sol et sur le bloc central
  const appuiMat=new T.MeshBasicMaterial({color:0xffce59,transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide});
  const faintMat=new T.MeshBasicMaterial({color:0xe6b94d,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
  const spots=[{x:-2.3,z:-1.95,y:platform.height+.19,name:'APPUI SURÉLEVÉ'},{x:-11.1,z:3.4,y:.08,name:'COUVERT OUEST'},{x:10.9,z:6.25,y:.08,name:'COUVERT EST'},{x:-10.1,z:-7.15,y:.08,name:'REPLI SUD'}];
  for(const s of spots){
    const disk=new T.Mesh(new T.CircleGeometry(.95,48),faintMat);disk.rotation.x=-Math.PI/2;disk.position.set(s.x,s.y+.025,s.z);scene.add(disk);
    const ring=marker(s.x,s.y+.045,s.z,1,appuiMat.clone());s.ring=ring;
    const inner=marker(s.x,s.y+.05,s.z,.66,appuiMat.clone());inner.material.opacity=.4;
    for(let i=0;i<4;i++){let a=i*Math.PI/2,xx=s.x+Math.sin(a)*1.17,zz=s.z+Math.cos(a)*1.17;
      box(xx,s.y+.05,zz,.15,.015,.13,materials.yellow,false)}
  }
  // Grille de navigation 1m, marche/rampes reliées verticalement
  const minX=-23,maxX=23,minZ=-17,maxZ=17,cols=maxX-minX+1,rows=maxZ-minZ+1;
  const size=cols*rows,grid=new Uint8Array(size),ind=(x,z)=>(z-minZ)*cols+(x-minX);
  const valid=(x,z)=>x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ;
  function heightAt(x,z){
    if(x>=platform.left&&x<=platform.right&&z>=platform.front&&z<=platform.back)return platform.height+.16;
    if(x>platform.right&&x<platform.right+rampLength&&Math.abs(z)<=1.22)
      return Math.max(.06,(platform.height+.16)*(1-(x-platform.right)/rampLength));
    return .06;
  }
  function obstruction(x,z,inflate=0){
    return blockers.some(b=>Math.abs(x-b.x)<b.w/2+inflate&&Math.abs(z-b.z)<b.d/2+inflate);
  }
  for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)grid[ind(x,z)]=obstruction(x,z,.38)?0:1;
  // Franchissement possible uniquement via rampe (différence de hauteur limitée)
  function pass(x,z,xx,zz){
    if(!valid(xx,zz)||!grid[ind(xx,zz)])return false;
    const a=heightAt(x,z),b=heightAt(xx,zz);
    if(Math.abs(a-b)>.65)return false;
    // Une entaille sur les bords permet uniquement de passer par la rampe.
    const top1=a>platform.height-.15,top2=b>platform.height-.15;
    if(top1!==top2&&!(x>=2.9&&xx>=2.9&&Math.abs(z)<1.3&&Math.abs(zz)<1.3))return false;
    return true;
  }
  function node(p){return {x:Math.max(minX,Math.min(maxX,Math.round(p.x))),z:Math.max(minZ,Math.min(maxZ,Math.round(p.z)))}}
  function nearestValid(x,z){
    const start=node({x,z});if(grid[ind(start.x,start.z)])return start;
    for(let r=1;r<5;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
      const xx=start.x+dx,zz=start.z+dz;if(valid(xx,zz)&&grid[ind(xx,zz)])return {x:xx,z:zz};
    }return start;
  }
  function pathfind(a,b){
    const start=nearestValid(a.x,a.z),dest=nearestValid(b.x,b.z);
    const s=ind(start.x,start.z),goal=ind(dest.x,dest.z),score=new Float32Array(size),prev=new Int32Array(size),seen=new Uint8Array(size);
    score.fill(1e9);prev.fill(-1);score[s]=0;const open=[s];
    let iterations=0;
    while(open.length&&iterations++<3900){
      let bestI=0,best=Infinity;
      for(let i=0;i<open.length;i++){
        const k=open[i],x=k%cols+minX,z=Math.floor(k/cols)+minZ;
        const f=score[k]+Math.hypot(dest.x-x,dest.z-z);
        if(f<best){best=f;bestI=i}
      }
      const cur=open.splice(bestI,1)[0];if(cur===goal)break;if(seen[cur])continue;seen[cur]=1;
      const x=cur%cols+minX,z=Math.floor(cur/cols)+minZ;
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const xx=x+dx,zz=z+dz;if(!pass(x,z,xx,zz))continue;
        const ni=ind(xx,zz),ng=score[cur]+1;
        if(ng<score[ni]){score[ni]=ng;prev[ni]=cur;open.push(ni)}
      }
    }
    if(goal!==s&&prev[goal]===-1)return [];
    let cur=goal,path=[];while(cur!==s&&cur>=0&&path.length<300){
      path.push({x:cur%cols+minX,z:Math.floor(cur/cols)+minZ});cur=prev[cur]}
    return path.reverse();
  }
  function visible(a,b){
    const ax=a.x,az=a.z,bx=b.x,bz=b.z;
    const ay=heightAt(ax,az)+1.3,by=heightAt(bx,bz)+1.15;
    const steps=Math.ceil(Math.hypot(ax-bx,az-bz)*6);
    for(let i=1;i<steps;i++){
      const t=i/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=ay+(by-ay)*t;
      if(obstruction(x,z,0) && blockers.some(q=>Math.abs(x-q.x)<q.w/2&&Math.abs(z-q.z)<q.d/2&&y<q.h))return false;
      if(heightAt(x,z)>y+.14)return false;
    }return true;
  }
  // Raycast avec surfaces praticables : podium, rampe et sol
  const groundPick=new T.Mesh(new T.PlaneGeometry(46,34),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}));
  groundPick.rotation.x=-Math.PI/2;groundPick.position.y=.06;groundPick.updateMatrixWorld(true);scene.add(groundPick);floorMeshes.push(groundPick);
  function clickPoint(raycaster){
    const hit=raycaster.intersectObjects(floorMeshes,false);
    for(const h of hit){if(Math.abs(h.point.x)>22.8||Math.abs(h.point.z)>16.8)continue;
      const py=heightAt(h.point.x,h.point.z);
      if(Math.abs(h.point.y-py)<.5)return{x:h.point.x,z:h.point.z,y:py};
    }return null;
  }
  return {materials,platform,spots,pathfind,heightAt,visible,clickPoint,obstruction};
}
