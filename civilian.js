/* ZONE ZÉRO — personnage civil avec bras droit articulé et arme tenue dans la main.
   Le pistolet, la paume et les doigts partagent un seul pivot de poignet.
   Toutes les dimensions sont locales au personnage ; échelle globale 0,76. */
export function createCivilian(T,root){
 const fabric=c=>new T.MeshStandardMaterial({color:c,roughness:.93});
 const tshirt=fabric('#849187'),trim=fabric('#6f8077'),jeans=fabric('#4b5962');
 const skin=fabric('#c5a38b'),hair=fabric('#3c302b'),shoes=fabric('#363c3b'),sole=fabric('#9b9b90');
 const gun=new T.MeshStandardMaterial({color:'#323b3d',roughness:.49,metalness:.62});
 const slide=new T.MeshStandardMaterial({color:'#444c4e',roughness:.37,metalness:.75});
 const add=(parent,geometry,material,x=0,y=0,z=0)=>{
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const block=(group,x,y,z,w,h,d,material)=>add(group,new T.BoxGeometry(w,h,d),material,x,y,z);
 const ball=(group,x,y,z,r,material)=>add(group,new T.SphereGeometry(r,12,10),material,x,y,z);
 // Proportion : ~1,62 m pour une automobile de ~1,9 m de haut.
 root.scale.setScalar(.76);
 const model=new T.Group();root.add(model);
 add(model,new T.CylinderGeometry(.245,.235,.23,14),jeans,0,.92,0);
 const torso=add(model,new T.CylinderGeometry(.295,.235,.68,16),tshirt,0,1.40,0);
 torso.scale.z=.76;
 block(model,0,1.09,-.022,.44,.10,.25,trim);
 add(model,new T.CylinderGeometry(.092,.11,.18,12),skin,0,1.82,0);
 const head=ball(model,0,2.0,-.028,.17,skin);head.scale.set(.86,1.06,.86);
 const haircap=add(model,new T.SphereGeometry(.174,16,10,0,Math.PI*2,0,Math.PI*.54),hair,0,2.077,0);
 haircap.scale.set(1,1,.98);
 ball(model,0,1.95,-.17,.047,skin).scale.set(.63,.75,1);
 for(const side of [-1,1])ball(model,side*.15,1.98,.006,.043,skin);
 const legs=[];
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.128,.95,0);model.add(leg);
  add(leg,new T.CylinderGeometry(.112,.098,.50,12),jeans,0,-.28,0);
  ball(leg,0,-.53,0,.104,jeans);
  add(leg,new T.CylinderGeometry(.097,.084,.43,12),jeans,0,-.70,-.018);
  block(leg,0,-.92,-.1,.23,.15,.38,shoes);
  block(leg,0,-1.005,-.11,.24,.04,.38,sole);
  legs.push(leg);
 }
 // Cylindres orientés exactement entre leurs articulations.
 function limb(group,start,end,radius,material,edgeRadius=radius){
  const from=new T.Vector3(...start),to=new T.Vector3(...end);
  const direction=to.clone().sub(from),height=direction.length();
  const piece=add(group,new T.CylinderGeometry(edgeRadius,radius,height,12),material,
   (from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2);
  piece.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
  return piece;
 }
 // Bras gauche relâché : manches courtes, avant-bras et main.
 const leftArm=new T.Group();leftArm.position.set(-.315,1.65,0);model.add(leftArm);
 ball(leftArm,0,-.04,0,.13,tshirt);
 limb(leftArm,[0,-.04,0],[-.08,-.25,-.025],.119,tshirt,.105);
 limb(leftArm,[-.08,-.25,-.025],[-.10,-.62,-.04],.083,skin,.073);
 ball(leftArm,-.10,-.66,-.04,.084,skin);
 // Bras droit : à la marche il descend le long du corps ; au tir il se lève.
 // Les segments articulés passent progressivement d'une pose à l'autre.
 const rightArm=new T.Group();rightArm.position.set(.305,1.65,-.025);model.add(rightArm);
 ball(rightArm,0,-.04,0,.129,tshirt);
 const idleElbow=new T.Vector3(.075,-.395,.025),idleWrist=new T.Vector3(.085,-.77,-.045);
 const fireElbow=new T.Vector3(.065,-.34,-.245),fireWrist=new T.Vector3(-.025,-.405,-.64);
 const shoulder=new T.Vector3(0,-.04,0);
 const sleeve=add(rightArm,new T.CylinderGeometry(.108,.121,1,12),tshirt,0,0,0);
 const upper=add(rightArm,new T.CylinderGeometry(.082,.090,1,12),skin,0,0,0);
 const forearm=add(rightArm,new T.CylinderGeometry(.074,.084,1,12),skin,0,0,0);
 const elbowJoint=ball(rightArm,0,0,0,.084,skin);
 const handRig=new T.Group();rightArm.add(handRig);
 const limbUp=new T.Vector3(0,1,0);
 let aimBlend=0,aimWanted=false,recoilAngle=0;
 const currElbow=new T.Vector3(),currWrist=new T.Vector3(),sleeveEnd=new T.Vector3();
 function segmentBetween(part,a,b){
  const direction=new T.Vector3().subVectors(b,a);
  part.position.copy(a).add(b).multiplyScalar(.5);
  part.quaternion.setFromUnitVectors(limbUp,direction.clone().normalize());
  part.scale.y=direction.length();
 }
 function updateRightArm(){
  currElbow.copy(idleElbow).lerp(fireElbow,aimBlend);
  currWrist.copy(idleWrist).lerp(fireWrist,aimBlend);
  sleeveEnd.copy(shoulder).lerp(currElbow,.43);
  segmentBetween(sleeve,shoulder,sleeveEnd);
  segmentBetween(upper,sleeveEnd,currElbow);
  segmentBetween(forearm,currElbow,currWrist);
  elbowJoint.position.copy(currElbow);
  handRig.position.copy(currWrist);
  // Au repos le pistolet pointe vers le bas.
  handRig.rotation.x=-.66*(1-aimBlend)+recoilAngle;
 }
 updateRightArm();
 // Le pivot de poignet est parent de la paume, des doigts ET du pistolet.
 // Ainsi la main ne se détache plus de l'arme quand le bras bouge.
 // Paume dirigée vers la poignée.
 const palm=ball(handRig,0,-.005,-.118,.088,skin);palm.scale.set(.94,.9,1.3);
 const thumb=ball(handRig,-.105,.024,-.16,.046,skin);thumb.scale.set(.75,.9,1.25);
 const pistol=new T.Group();pistol.position.set(.004,.058,-.125);handRig.add(pistol);
 // Culasse parallèle au regard du personnage (-Z), canon et hausse.
 block(pistol,0,.075,-.168,.17,.14,.37,gun);
 block(pistol,0,.166,-.167,.18,.085,.39,slide);
 block(pistol,0,.21,-.312,.055,.045,.07,gun);
 block(pistol,0,.194,-.015,.065,.043,.048,gun);
 // La poignée rentre au creux de la paume ; légèrement inclinée vers l'arrière.
 const grip=block(pistol,0,-.106,-.053,.137,.27,.144,gun);
 grip.rotation.x=-.18;
 block(pistol,0,-.246,-.023,.154,.038,.154,slide);
 // Pontet, détente et quatre doigts autour de la poignée (aucune main flottante).
 const guard=add(pistol,new T.TorusGeometry(.083,.014,6,16,Math.PI*1.44),gun,0,-.083,-.182);
 guard.rotation.y=Math.PI/2;guard.rotation.x=-.09;
 for(let finger=0;finger<4;finger++){
  const y=-.035-finger*.051;
  const curl=ball(pistol,.092,y,-.065,.037,skin);
  curl.scale.set(.72,.66,1.18);
  block(pistol,.075,y,-.105,.042,.025,.082,skin);
 }
 // Index près de la détente, sans traverser la glissière.
 const indexFinger=ball(pistol,.076,-.025,-.172,.027,skin);
 indexFinger.scale.set(.64,.8,1.1);
 function animate(dt,time,moving,running){
  const phase=time*(running?12.2:8.4);
  const stride=moving?Math.sin(phase)*(running?.43:.28):0;
  const ease=Math.min(1,dt*12);
  legs[0].rotation.x+=(stride-legs[0].rotation.x)*ease;
  legs[1].rotation.x+=(-stride-legs[1].rotation.x)*ease;
  leftArm.rotation.x+=(-stride*.5-leftArm.rotation.x)*ease;
  // Au repos les bras se balancent en opposition, pistolet dans la main droite.
  const swing=stride*.5*(1-aimBlend);
  rightArm.rotation.x+=(swing-rightArm.rotation.x)*Math.min(1,dt*10);
  // Levée rapide à la visée et retour naturel après le tir.
  aimBlend+=((aimWanted?1:0)-aimBlend)*(1-Math.exp(-dt*(aimWanted?13:8)));
  if(aimBlend<.0002&&!aimWanted)aimBlend=0;
  recoilAngle*=Math.exp(-dt*16);
  updateRightArm();
  model.position.y+=((moving?.015*Math.sin(phase*2):0)-model.position.y)*ease;
 }
 // Calcul du bout du canon en coordonnées MONDE, quel que soit l'angle du bras.
 function muzzle(){return pistol.localToWorld(new T.Vector3(0,.132,-.385))}
 function setAiming(aiming){aimWanted=Boolean(aiming)}
 function readyToFire(){return aimBlend>=.85}
 function aimImmediately(){aimWanted=true;aimBlend=1;rightArm.rotation.x=0;updateRightArm()}
 function recoil(){recoilAngle=Math.min(.18,recoilAngle+.12);updateRightArm()}
 return{model,legs,arms:[leftArm,rightArm],pistol,handRig,animate,muzzle,recoil,setAiming,readyToFire,aimImmediately};
}
