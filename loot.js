/* Objets à récupérer sur la route : armes, munitions et soins. */
export function createLoot(T,scene,world){
  const items=[];
  const defs=[
    {x:-70,z:-47,type:'ammo',amount:18},
    {x:-42,z:-47,type:'carbine',amount:30},
    {x:-35,z:-13,type:'medkit',amount:35},
    {x:-10,z:-47,type:'ammo',amount:26},
    {x:-6,z:27,type:'ammo',amount:28},
    {x:24,z:23,type:'medkit',amount:35},
    {x:42,z:24,type:'ammo',amount:32},
    {x:65,z:58,type:'ammo',amount:25},
    {x:77,z:54,type:'medkit',amount:35}
  ];
  const colors={ammo:0xd6b26c,carbine:0xa2d8f3,medkit:0xa6e5b9};
  for(const def of defs){
    const p=world.snap(def.x,def.z);if(!p)continue;
    const group=new T.Group();group.position.set(p.x,world.heightAt(p.x,p.z),p.z);
    const m=new T.MeshStandardMaterial({color:colors[def.type],metalness:.35,roughness:.56,emissive:colors[def.type],emissiveIntensity:.24});
    const caseGeo=def.type==='carbine'?new T.BoxGeometry(1.2,.25,.55):new T.BoxGeometry(.74,.38,.54);
    const caseMesh=new T.Mesh(caseGeo,m);caseMesh.position.y=.42;caseMesh.castShadow=true;group.add(caseMesh);
    const strip=new T.Mesh(new T.BoxGeometry(.5,.07,.08),new T.MeshBasicMaterial({color:0xffffff}));
    strip.position.y=.66;group.add(strip);
    const ring=new T.Mesh(new T.RingGeometry(.75,.86,32),new T.MeshBasicMaterial({color:colors[def.type],transparent:true,opacity:.83,side:T.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.12;group.add(ring);
    const glow=new T.PointLight(colors[def.type],.75,4,2);glow.position.y=.95;group.add(glow);
    scene.add(group);items.push({...def,x:p.x,z:p.z,group,ring,phase:Math.random()*6,found:false});
  }
  function collect(p){
    const gained=[];
    for(const obj of items){
      if(obj.found||Math.hypot(p.x-obj.x,p.z-obj.z)>1.55)continue;
      obj.found=true;scene.remove(obj.group);
      if(obj.type==='carbine'){
        p.unlocked.carbine=true;
        p.inventory.carbine={ammo:20,reserve:obj.amount};
        gained.push('CARABINE RÉCUPÉRÉE · TOUCHE 2 POUR ÉQUIPER');
      }
      if(obj.type==='ammo'){
        p.inventory.pistol.reserve+=obj.amount;
        if(p.weapon==='pistol')p.reserve+=obj.amount;
        if(p.unlocked.carbine){
          const bonus=Math.ceil(obj.amount*.6);
          p.inventory.carbine.reserve+=bonus;
          if(p.weapon==='carbine')p.reserve+=bonus;
        }
        gained.push('MUNITIONS RÉCUPÉRÉES');
      }
      if(obj.type==='medkit'){
        p.hp=Math.min(p.maxHp,p.hp+obj.amount);
        gained.push('SOINS · +'+obj.amount+' PV MAX.');
      }
    }
    return gained;
  }
  function update(t){for(const o of items)if(!o.found){
    o.ring.material.opacity=.55+.27*Math.sin(t*2.3+o.phase);
    o.group.children[0].position.y=.42+Math.sin(t*2+o.phase)*.08;
  }}
  return{collect,update,items};
}
