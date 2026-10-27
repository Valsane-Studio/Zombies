/* Caisses et caches disséminées : interaction volontaire, pas de loot automatique. */
export function createLoot(T,scene,world){
  const defs=[
    {x:-78,z:-51,type:'ammo9',amount:18},
    {x:-70,z:-47,type:'ammo9',amount:24},
    {x:-57,z:-12,type:'medkit',amount:1},
    {x:-42,z:-47,type:'carbine',amount:36},
    {x:-35,z:-24,type:'ammo556',amount:30},
    {x:-20,z:-48,type:'medkit',amount:1},
    {x:-10,z:-47,type:'ammo9',amount:25},
    {x:-5,z:27,type:'shotgun',amount:12},
    {x:6,z:33,type:'ammo12',amount:14},
    {x:24,z:23,type:'medkit',amount:1},
    {x:42,z:24,type:'ammo556',amount:35},
    {x:45,z:-20,type:'ammo12',amount:16},
    {x:65,z:58,type:'ammo9',amount:30},
    {x:77,z:54,type:'medkit',amount:1},
    {x:87,z:-45,type:'ammo556',amount:35},
    {x:64,z:-12,type:'ammo9',amount:22},
    {x:-22,z:55,type:'medkit',amount:1},
    {x:47,z:52,type:'ammo12',amount:10}
  ];
  const meta={
    ammo9:{name:'MUNITIONS 9 MM',color:'#e2c27d'},
    ammo556:{name:'MUNITIONS 5,56 MM',color:'#9eafdd'},
    ammo12:{name:'CARTOUCHES CALIBRE 12',color:'#daa177'},
    medkit:{name:'KIT DE SOINS',color:'#9cdbb1'},
    carbine:{name:'CARABINE',color:'#a8d4f0'},
    shotgun:{name:'FUSIL À POMPE',color:'#e5b984'}
  };
  const items=[];
  for(const def of defs){
    const p=world.snap(def.x,def.z);if(!p||world.obstruction(p.x,p.z,.6))continue;
    const group=new T.Group();group.position.set(p.x,world.heightAt(p.x,p.z),p.z);
    const c=meta[def.type].color;
    const material=new T.MeshStandardMaterial({color:c,metalness:.28,roughness:.64,emissive:c,emissiveIntensity:.12});
    const isWeapon=def.type==='carbine'||def.type==='shotgun';
    const crate=new T.Mesh(new T.BoxGeometry(isWeapon?1.45:.73,isWeapon?.3:.36,.6),material);crate.position.y=.3;crate.castShadow=true;group.add(crate);
    const lock=new T.Mesh(new T.BoxGeometry(.48,.08,.10),new T.MeshBasicMaterial({color:0xe8e6d3}));lock.position.y=.52;group.add(lock);
    const marker=new T.Mesh(new T.RingGeometry(.62,.72,32),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.62,side:T.DoubleSide,depthWrite:false}));
    marker.rotation.x=-Math.PI/2;marker.position.y=.08;group.add(marker);
    const light=new T.PointLight(c,.45,3,2);light.position.y=.65;group.add(light);
    group.visible=false;
    scene.add(group);items.push({...def,x:p.x,z:p.z,group,marker,found:false,phase:Math.random()*6});
  }
  function nearest(p,range=2.25){
    let result=null,best=range;
    for(const item of items){
      if(item.found)continue;
      const d=Math.hypot(item.x-p.x,item.z-p.z);
      if(d<best){best=d;result=item}
    }
    return result;
  }
  function collect(p,item){
    if(!item||item.found||Math.hypot(item.x-p.x,item.z-p.z)>2.3)return null;
    item.found=true;scene.remove(item.group);
    if(item.type==='medkit'){p.medkits=Math.min(4,p.medkits+item.amount)}
    if(item.type==='carbine'||item.type==='shotgun'){
      p.unlocked[item.type]=true;
      p.inventory[item.type].reserve+=item.amount;
      p.inventory[item.type].ammo=p.inventory[item.type].magazine;
    }
    const ammoTypes={ammo9:'pistol',ammo556:'carbine',ammo12:'shotgun'};
    if(ammoTypes[item.type]){
      const key=ammoTypes[item.type];
      p.inventory[key].reserve+=item.amount;
      if(p.weapon===key)p.reserve+=item.amount;
    }
    return meta[item.type].name+' RÉCUPÉRÉ'+(item.type==='carbine'||item.type==='shotgun'?' · NOUVELLE ARME':'');
  }
  function update(t,vision){
    for(const item of items)if(!item.found){
      item.group.visible=vision.canSee(item.x,item.z);
      item.marker.material.opacity=.48+.22*Math.sin(t*2.7+item.phase);
      item.group.children[0].position.y=.3+Math.sin(t*2.4+item.phase)*.07;
    }
  }
  return{items,nearest,collect,update,meta};
}
