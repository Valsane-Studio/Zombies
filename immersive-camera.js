/* ZONE ZÉRO — caméra immersive à la troisième personne.
   Vue derrière le survivant, légèrement surélevée. Cadrage fluide, orbit manuel,
   raccourcissement dans les intérieurs, évitement des façades. */
export function createImmersiveCamera(T,{camera,player,world,canvas,sun}){
 const pivot=player.position.clone();
 const lastPosition=player.position.clone();
 let yaw=player.rotation.y,orbit=0,tilt=.34,zoom=1,drag=null,lastTheta=yaw;
 let time=0;
 const up=new T.Vector3(0,1,0);
 const desired=new T.Vector3(),goal=new T.Vector3(),focus=new T.Vector3();
 const nearLimit=1.15;
 function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
 function reset(){orbit=0;tilt=.34;zoom=1}
 function onDown(e){
  if(e.button!==1&&!(e.button===0&&e.altKey))return;
  e.preventDefault();drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY};
  canvas.setPointerCapture?.(e.pointerId);
 }
 function onMove(e){
  if(!drag||e.pointerId!==drag.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  drag.x=e.clientX;drag.y=e.clientY;
  orbit-=dx*.008;tilt=T.MathUtils.clamp(tilt+dy*.004,.11,.82);
 }
 function stop(e){if(drag&&e.pointerId===drag.pointerId)drag=null}
 canvas.addEventListener('pointerdown',onDown);
 canvas.addEventListener('pointermove',onMove);
 canvas.addEventListener('pointerup',stop);
 canvas.addEventListener('pointercancel',stop);
 // L'utilisateur conserve le clic gauche pour marcher. Alt + glisser / bouton central :
 // faire tourner la caméra sans modifier la destination.
 function wheel(e){
  e.preventDefault();
  zoom=T.MathUtils.clamp(zoom*(e.deltaY>0?1.085:.925),.68,1.5);
 }
 canvas.addEventListener('wheel',wheel,{passive:false});
 const blocking=(x,z,y,level,inside)=>{
  // Niveau rue : ignorer les voitures sous la ligne de caméra, mais masquer les murs.
  if(level===2)return false;
  if(level===1||inside)return world.collides(x,z,.19,level);
  if(y>2.45)return false;
  return world.collides(x,z,.15,0);
 };
 function update(dt,{moving=false,running=false,force=false,arrowLeft=false,arrowRight=false,arrowUp=false,arrowDown=false}={}){
  dt=Math.min(.07,Math.max(0,dt));
  time+=dt;
  if(arrowLeft)orbit+=dt*1.12;
  if(arrowRight)orbit-=dt*1.12;
  if(arrowUp)tilt=T.MathUtils.clamp(tilt-dt*.63,.11,.82);
  if(arrowDown)tilt=T.MathUtils.clamp(tilt+dt*.63,.11,.82);
  // Le suivi privilégie l'orientation du personnage sans tourner brusquement.
  const wantedYaw=player.rotation.y+orbit;
  yaw+=angleDelta(wantedYaw,yaw)*(force?1:1-Math.exp(-dt*(moving?2.6:2.0)));
  // Ne pas suivre le haut et le bas d'une marche de manière saccadée.
  pivot.lerp(player.position,force?1:1-Math.exp(-dt*(moving?5.5:3.3)));
  const inside=Boolean(world.building?.inside)&&world.building.level<2;
  const level=world.building?.level||0;
  const distance=(inside?3.45:6.15)*zoom;
  const height=(inside?1.92:3.00)*zoom;
  const shoulder=inside?.25:.46;
  const lean=running?.05:.015;
  // Orientation yaw 0 = personnage regardant vers -Z, caméra derrière vers +Z.
  const backX=Math.sin(yaw),backZ=Math.cos(yaw);
  const rightX=Math.cos(yaw),rightZ=-Math.sin(yaw);
  focus.set(pivot.x,pivot.y+(inside?1.12:1.2),pivot.z);
  desired.set(
   focus.x+backX*distance+rightX*shoulder,
   focus.y+height+Math.sin(tilt)*.9,
   focus.z+backZ*distance+rightZ*shoulder
  );
  // Réduire la distance si un obstacle intervient entre le survivant et l'objectif.
  // Raymarch 3D simplifié, indépendant des milliers d'herbes instanciées.
  let alpha=1;
  for(let i=1;i<=26;i++){
   const t=i/26;
   const x=focus.x+(desired.x-focus.x)*t;
   const y=focus.y+(desired.y-focus.y)*t;
   const z=focus.z+(desired.z-focus.z)*t;
   if(blocking(x,z,y,level,inside)){alpha=Math.max(nearLimit/distance,t-.065);break}
  }
  goal.copy(focus).lerp(desired,alpha);
  // Empêcher les longues excursions de caméra hors des pièces.
  camera.position.lerp(goal,force?1:1-Math.exp(-dt*(inside?10:5.5)));
  const bob=moving?Math.sin(time*(running?14:9))*(running?.027:.012):0;
  camera.position.y+=bob;
  camera.lookAt(focus.x-rightX*.12,focus.y+.10,focus.z-rightZ*.12);
  const targetFov=inside?57:50;
  camera.fov+=(targetFov-camera.fov)*(force?1:1-Math.exp(-dt*2.3));
  camera.updateProjectionMatrix();
  if(sun){
   sun.target.position.copy(pivot);
   sun.position.copy(pivot).add(new T.Vector3(-23,39,-7));
   sun.target.updateMatrixWorld();
  }
  lastPosition.copy(player.position);
 }
 return {update,reset,get orbit(){return orbit},get tilt(){return tilt},get zoom(){return zoom}};
}
