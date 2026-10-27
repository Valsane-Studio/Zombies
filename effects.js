/* ZONE ZÉRO — impacts, poussière, corps temporaires et atmosphère */
export function createEffects(T,scene,world){
  const bodies=[],bursts=[],flashes=[],smoke=[];
  const reactions=new Map();
  const scratchColor='#692e2b';
  const scarGeo=new T.SphereGeometry(.12,6,5);
  const scarMat=new T.MeshStandardMaterial({color:scratchColor,roughness:1});
  function gradientTexture(centerColor){
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const g=canvas.getContext('2d'),radial=g.createRadialGradient(32,32,0,32,32,32);
    radial.addColorStop(0,centerColor);radial.addColorStop(.22,'rgba(255,245,208,.40)');radial.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=radial;g.fillRect(0,0,64,64);
    const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return t;
  }
  const muzzleTexture=gradientTexture('rgba(255,240,180,1)');
  const hazeTexture=gradientTexture('rgba(185,189,180,.24)');
  const sparkGeo=new T.SphereGeometry(.095,5,4);
  // Poussière flottante, visible surtout dans les zones éclairées.
  const dustCount=260,dustPositions=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){
    dustPositions[i*3]=-89+Math.random()*178;
    dustPositions[i*3+1]=.3+Math.random()*6;
    dustPositions[i*3+2]=-62+Math.random()*124;
  }
  const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(dustPositions,3));
  const dustMesh=new T.Points(dustGeo,new T.PointsMaterial({color:0xd9c4a6,size:.065,transparent:true,opacity:.28,depthWrite:false,sizeAttenuation:true}));
  dustMesh.frustumCulled=false;scene.add(dustMesh);
  // Un voile atmosphérique dynamique localisé, sans obstruer la lecture du terrain.
  const smokeSites=[[-38.2,7.5],[42,44],[23,-15],[-59,-48],[60,-48],[-12,22],[6,-30],[45,8],[-53,-11],[78,35]];
  for(let i=0;i<32;i++){
    const base=smokeSites[i%smokeSites.length];
    const material=new T.SpriteMaterial({map:hazeTexture,color:i%3===0?0xd0bfa6:0xabb5ac,transparent:true,opacity:.07,depthWrite:false,fog:true});
    const sprite=new T.Sprite(material);
    const seed=Math.random(),size=.7+Math.random()*1.8;
    sprite.scale.set(size,size,1);
    sprite.position.set(base[0]+(Math.random()-.5)*2,1+seed*5,base[1]+(Math.random()-.5)*2);
    scene.add(sprite);smoke.push({sprite,site:base,seed,speed:.17+Math.random()*.19,life:seed*9,size});
  }
  // Voiles de lumière chaude sous les lampadaires.
  const poolTexture=gradientTexture('rgba(253,205,132,.45)');
  for(const [x,z] of [[-5.4,-11],[6.5,11],[20.7,-2]]){
    const ground=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:poolTexture,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide}));
    ground.rotation.x=-Math.PI/2;ground.position.set(x,.057,z);scene.add(ground);
  }
  function muzzle(p,target){
    const dx=target.x-p.x,dz=target.z-p.z,l=Math.max(.001,Math.hypot(dx,dz));
    const sprite=new T.Sprite(new T.SpriteMaterial({map:muzzleTexture,color:0xffd799,transparent:true,opacity:.78,depthWrite:false,blending:T.AdditiveBlending}));
    sprite.position.set(p.x+dx/l*.64,world.heightAt(p.x,p.z)+1.25,p.z+dz/l*.64);
    sprite.scale.set(.7,.7,1);scene.add(sprite);
    flashes.push({sprite,t:.085});
  }
  function hit(zombie){
    const floor=world.heightAt(zombie.x,zombie.z);
    const x=zombie.x+(Math.random()-.5)*.14,z=zombie.z+(Math.random()-.5)*.14,y=floor+1.2+Math.random()*.46;
    // Éclat de l'impact, très bref.
    const flash=new T.Sprite(new T.SpriteMaterial({map:muzzleTexture,color:0xffb8a2,transparent:true,opacity:.78,depthWrite:false}));
    flash.position.set(x,y,z);flash.scale.set(.48,.48,1);scene.add(flash);flashes.push({sprite:flash,t:.13});
    // Petites projections corporelles visibles depuis la caméra tactique.
    const flecks=[];
    for(let i=0;i<8;i++){
      const mesh=new T.Mesh(sparkGeo,new T.MeshBasicMaterial({color:i%3===0?0x9a594d:0x633b32,transparent:true,opacity:.8,depthWrite:false}));
      mesh.position.set(x,y,z);
      const sz=.65+Math.random()*.8;mesh.scale.setScalar(sz);
      mesh.castShadow=false;scene.add(mesh);
      flecks.push({mesh,vx:(Math.random()-.5)*2.9,vy:.35+Math.random()*1.9,vz:(Math.random()-.5)*2.9});
    }
    bursts.push({flecks,t:.42,max:.42});
    // Trace sur le modèle, qui reste visible jusqu'à sa disparition.
    if(!zombie.scars)zombie.scars=0;
    if(zombie.scars<4){
      const scar=new T.Mesh(scarGeo,scarMat);
      scar.position.set((Math.random()-.5)*.38,1.17+(Math.random()-.5)*.53,-.335);
      scar.scale.set(.8+Math.random()*.55,.55+Math.random()*.6,.18);
      zombie.actor.group.add(scar);
      zombie.scars++;
    }
    reactions.set(zombie,{time:.16,max:.16});
  }
  function kill(zombie){
    reactions.delete(zombie);
    const actor=zombie.actor,group=actor.group;
    actor.selection.visible=false;
    // Cloner les matériaux uniquement pour ces cadavres, sans rendre transparentes les autres unités.
    group.traverse(o=>{
      if(o.isMesh){
        const material=o.material;
        o.material=Array.isArray(material)?material.map(m=>{const a=m.clone();a.transparent=true;return a}):material.clone();
        if(!Array.isArray(o.material))o.material.transparent=true;
      }
    });
    bodies.push({group,zombie,age:0,lifetime:7.6,fade:1.8,side:Math.random()>.5?1:-1,positionY:world.heightAt(zombie.x,zombie.z)});
  }
  function update(dt){
    // Bref mouvement du buste à chaque projectile reçu.
    for(const [z,r] of reactions){
      r.time-=dt;const strength=Math.max(0,r.time/r.max);
      z.actor.torso.rotation.x=-.3*strength;
      z.actor.head.rotation.z=.16*strength;
      if(r.time<=0){z.actor.torso.rotation.x=0;z.actor.head.rotation.z=0;reactions.delete(z)}
    }
    const pos=dustGeo.attributes.position;
    for(let i=0;i<dustCount;i++){
      let y=pos.getY(i)+dt*.14;
      if(y>6.8)y=.14;
      let x=pos.getX(i)+dt*.052;
      if(x>89)x=-89;
      pos.setXY(i,x,y);
    }
    pos.needsUpdate=true;
    for(const s of smoke){
      s.life+=dt*s.speed;
      const phase=s.life%2.1;
      s.sprite.position.y=.8+phase*2.7;
      s.sprite.position.x=s.site[0]+Math.sin(s.life*.7+s.seed*4)*1.1;
      s.sprite.position.z=s.site[1]+Math.cos(s.life*.55+s.seed*3)*.75;
      const scale=s.size*(.8+phase*.47);
      s.sprite.scale.set(scale,scale,1);
      s.sprite.material.opacity=Math.sin(Math.PI*Math.min(1,phase/2.1))*.085;
    }
    for(let i=flashes.length-1;i>=0;i--){
      const f=flashes[i];f.t-=dt;
      f.sprite.material.opacity=Math.max(0,f.t/.13)*.77;
      f.sprite.scale.multiplyScalar(1+dt*2.8);
      if(f.t<=0){scene.remove(f.sprite);f.sprite.material.dispose();flashes.splice(i,1)}
    }
    for(let i=bursts.length-1;i>=0;i--){
      const b=bursts[i];b.t-=dt;
      for(const f of b.flecks){
        f.vy-=6.5*dt;
        f.mesh.position.x+=f.vx*dt;f.mesh.position.y+=f.vy*dt;f.mesh.position.z+=f.vz*dt;
        f.mesh.material.opacity=Math.max(0,b.t/b.max)*.9;
        f.mesh.scale.multiplyScalar(Math.max(.9,1-2*dt));
      }
      if(b.t<=0){for(const f of b.flecks){scene.remove(f.mesh);f.mesh.material.dispose()}bursts.splice(i,1)}
    }
    for(let i=bodies.length-1;i>=0;i--){
      const b=bodies[i];b.age+=dt;
      const t=Math.min(1,b.age/.46),smooth=t*t*(3-2*t);
      b.group.rotation.x=-Math.PI/2*smooth;
      b.group.rotation.z=b.side*.13*smooth;
      b.group.position.y=b.positionY+.09*smooth;
      b.zombie.actor.legs.forEach((leg,j)=>{leg.rotation.x=(j===0?.15:-.22)*smooth});
      b.zombie.actor.arms.forEach((arm,j)=>{arm.rotation.z=(j===0?.5:-.4)*smooth});
      if(b.age>b.lifetime-b.fade){
        const opacity=Math.max(0,(b.lifetime-b.age)/b.fade);
        b.group.traverse(o=>{if(o.isMesh&&o.material){
          if(Array.isArray(o.material))o.material.forEach(m=>m.opacity=opacity);
          else o.material.opacity=opacity;
        }});
      }
      if(b.age>=b.lifetime){
        scene.remove(b.group);
        b.group.traverse(o=>{if(o.isMesh){
          if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
          else o.material?.dispose();
        }});
        bodies.splice(i,1);
      }
    }
  }
  return{muzzle,hit,kill,update};
}
