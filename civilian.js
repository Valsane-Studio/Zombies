/* Personnage civil sobre, à l'échelle des véhicules, pistolet toujours en main. */
export function createCivilian(T,root){
 const fabric=(c)=>new T.MeshStandardMaterial({color:c,roughness:.93});
 const tshirt=fabric('#849187'),trim=fabric('#6f8077'),jeans=fabric('#4b5962');
 const skin=fabric('#c5a38b'),hair=fabric('#3c302b'),shoes=fabric('#363c3b'),sole=fabric('#9b9b90');
 const gun=new T.MeshStandardMaterial({color:'#323b3d',roughness:.49,metalness:.62});
 const add=(parent,geo,mat,x,y,z)=>{
  const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const block=(g,x,y,z,w,h,d,m)=>add(g,new T.BoxGeometry(w,h,d),m,x,y,z);
 root.scale.setScalar(.76);
 const model=new T.Group();root.add(model);
 add(model,new T.CylinderGeometry(.245,.235,.23,14),jeans,0,.92,0);
 const body=add(model,new T.CylinderGeometry(.295,.235,.68,16),tshirt,0,1.40,0);
 body.scale.z=.76;
 block(model,0,1.09,-.022,.44,.10,.25,trim);
 add(model,new T.CylinderGeometry(.092,.11,.18,12),skin,0,1.82,0);
 const head=add(model,new T.SphereGeometry(.17,16,12),skin,0,2.0,-.028);
 head.scale.set(.86,1.06,.86);
 const cap=add(model,new T.SphereGeometry(.174,16,10,0,Math.PI*2,0,Math.PI*.54),hair,0,2.077,0);
 cap.scale.set(1,1,.98);
 add(model,new T.SphereGeometry(.047,9,8),skin,0,1.95,-.17).scale.set(.63,.75,1);
 for(const sign of [-1,1]){
  add(model,new T.SphereGeometry(.043,10,8),skin,sign*.15,1.98,.006);
 }
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.128,.95,0);model.add(leg);
  add(leg,new T.CylinderGeometry(.112,.098,.50,12),jeans,0,-.28,0);
  add(leg,new T.SphereGeometry(.104,10,8),jeans,0,-.53,0);
  add(leg,new T.CylinderGeometry(.097,.084,.43,12),jeans,0,-.70,-.018);
  block(leg,0,-.92,-.1,.23,.15,.38,shoes);
  block(leg,0,-1.005,-.11,.24,.04,.38,sole);legs.push(leg);
  const arm=new T.Group();arm.position.set(side*.32,1.66,0);model.add(arm);
  add(arm,new T.CylinderGeometry(.125,.117,.235,12),tshirt,side*.03,-.1,0);
  const forearm=add(arm,new T.CylinderGeometry(.084,.072,.46,12),skin,side*.06,-.41,-.07);
  forearm.rotation.x=side===1?-.26:-.12;
  add(arm,new T.SphereGeometry(.08,10,9),skin,side*.09,-.65,-.135);
  arms.push(arm);
 }
 arms[1].rotation.x=-.37;
 const pistol=new T.Group();pistol.position.set(.41,1.025,-.39);root.add(pistol);
 block(pistol,0,.07,-.18,.175,.14,.39,gun);
 block(pistol,0,.157,-.16,.185,.085,.39,trim);
 block(pistol,0,-.10,-.06,.14,.26,.15,gun);
 block(pistol,0,.14,-.345,.085,.055,.11,gun);
 add(pistol,new T.SphereGeometry(.09,10,9),skin,.015,-.035,-.045);
 function animate(dt,time,moving,running){
  const phase=time*(running?12.2:8.4);
  const stride=moving?Math.sin(phase)*(running?.43:.28):0;
  const ease=Math.min(1,dt*12);
  legs[0].rotation.x+=(stride-legs[0].rotation.x)*ease;
  legs[1].rotation.x+=(-stride-legs[1].rotation.x)*ease;
  arms[0].rotation.x+=(-stride*.5-arms[0].rotation.x)*ease;
  arms[1].rotation.x+=(-.37-arms[1].rotation.x)*ease;
  model.position.y+=((moving?.015*Math.sin(phase*2):0)-model.position.y)*ease;
  pistol.position.z+=(-.39-pistol.position.z)*Math.min(1,dt*21);
 }
 function muzzle(){return pistol.localToWorld(new T.Vector3(0,.15,-.42))}
 function recoil(){pistol.position.z-=.045}
 return{model,legs,arms,pistol,animate,muzzle,recoil};
}
