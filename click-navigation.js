/* Navigation par clic : évitement des collisions, lissage de chemin, pointeur au sol. */
export function createClickNavigation(T,{world,scene,player,camera,canvas,onFire,onInteract=()=>{}}){
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();
 const floor=new T.Plane(new T.Vector3(0,1,0),0);
 const currentLevel=()=>world.building?.level||0;
 const floorHeight=()=>currentLevel()===0?.12:currentLevel()===1?3.45:6.74;
 const marker=new T.Mesh(new T.RingGeometry(.39,.49,40),new T.MeshBasicMaterial({
  color:0xcce7c2,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide
 }));
 marker.rotation.x=-Math.PI/2;marker.position.y=.16;marker.visible=false;scene.add(marker);
 const lineMat=new T.LineBasicMaterial({color:0xa9c9aa,transparent:true,opacity:.7,depthWrite:false,depthTest:false});
 let pathLine=null,waypoints=[],index=0,run=false,shootHeld=false,arrival=null;
 let pointerPoint=null,moving=false,running=false,shotAim=null;
 function groundAt(x,y){
  const rect=canvas.getBoundingClientRect();
  pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  floor.constant=-floorHeight();
  const hit=new T.Vector3();
  return raycaster.ray.intersectPlane(floor,hit)?hit:null;
 }
 function clear(){
  waypoints=[];index=0;arrival=null;marker.visible=false;
  if(pathLine){scene.remove(pathLine);pathLine.geometry.dispose();pathLine=null}
 }
 function lineClear(a,b){
  const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.28));
  for(let i=1;i<=n;i++){
   const t=i/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   if(world.collides(x,z,.43,currentLevel()))return false;
  }return true;
 }
 function snapDest(p){
  if(!world.collides(p.x,p.z,.43,currentLevel()))return p;
  for(let radius=.6;radius<=4.8;radius+=.35)
   for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;
    const x=p.x+Math.cos(a)*radius,z=p.z+Math.sin(a)*radius;
    if(!world.collides(x,z,.43,currentLevel()))return new T.Vector3(x,floorHeight(),z);
   }
  return null;
 }
 const step=.85,minX=-72.15,maxX=72.15,minZ=-43.2,maxZ=20.35;
 const nx=Math.ceil((maxX-minX)/step)+1,nz=Math.ceil((maxZ-minZ)/step)+1;
 const grid=(p)=>({x:Math.max(0,Math.min(nx-1,Math.round((p.x-minX)/step))),z:Math.max(0,Math.min(nz-1,Math.round((p.z-minZ)/step)))});
 const pos=(x,z)=>new T.Vector3(minX+x*step,floorHeight(),minZ+z*step);
 const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
 function findPath(start,rawTarget){
  const target=snapDest(rawTarget);if(!target)return null;
  if(lineClear(start,target))return[target.clone()];
  const startNode=grid(start),goalNode=grid(target);
  const size=nx*nz,goal=goalNode.z*nx+goalNode.x,source=startNode.z*nx+startNode.x;
  const parent=new Int32Array(size).fill(-1),cost=new Float32Array(size).fill(Infinity),visited=new Uint8Array(size);
  const heap=[];
  function push(id,priority){
   let p=heap.length;heap.push({id,priority});
   while(p>0){const prev=(p-1)>>1;if(heap[prev].priority<=priority)break;heap[p]=heap[prev];p=prev}
   heap[p]={id,priority};
  }
  function pop(){
   const first=heap[0],last=heap.pop();
   if(heap.length){
    let p=0;while(p*2+1<heap.length){
     const left=p*2+1,right=left+1,next=right<heap.length&&heap[right].priority<heap[left].priority?right:left;
     if(heap[next].priority>=last.priority)break;
     heap[p]=heap[next];p=next;
    }heap[p]=last;
   }return first;
  }
  const h=(x,z)=>Math.hypot(goalNode.x-x,goalNode.z-z);
  cost[source]=0;push(source,h(startNode.x,startNode.z));
  let found=false,iterations=0;
  while(heap.length&&iterations++<size){
   const item=pop(),id=item.id;if(visited[id])continue;visited[id]=1;
   if(id===goal){found=true;break}
   const x=id%nx,z=Math.floor(id/nx),p=pos(x,z);
   for(const[dx,dz,mult]of dirs){
    const x2=x+dx,z2=z+dz;if(x2<0||x2>=nx||z2<0||z2>=nz)continue;
    const to=pos(x2,z2),next=z2*nx+x2;
    if(visited[next]||world.collides(to.x,to.z,.43,currentLevel())||!lineClear(p,to))continue;
    const tentative=cost[id]+mult;
    if(tentative>=cost[next])continue;
    cost[next]=tentative;parent[next]=id;push(next,tentative+h(x2,z2));
   }
  }
  if(!found)return null;
  const route=[],seen=new Set();let current=goal;
  while(current!==source&&!seen.has(current)&&current>=0&&route.length<size){
   seen.add(current);route.push(pos(current%nx,Math.floor(current/nx)));current=parent[current];
  }
  if(current!==source)return null;route.reverse();
  const input=[start.clone(),...route,target],smooth=[];let i=0;
  while(i<input.length-1){
   let last=input.length-1;
   while(last>i+1&&!lineClear(input[i],input[last]))last--;
   smooth.push(input[last].clone());i=last;
  }
  return smooth;
 }
 function moveTo(point,fast=false,callback=null){
  if(!point)return false;
  const p=findPath(player.position,point);
  if(!p?.length)return false;
  clear();waypoints=p;index=0;run=fast;arrival=callback;
  const end=p[p.length-1];marker.position.set(end.x,floorHeight()+.13,end.z);marker.visible=true;
  const vertices=[player.position.clone().setY(floorHeight()+.14),...p.map(v=>v.clone().setY(floorHeight()+.14))];
  pathLine=new T.Line(new T.BufferGeometry().setFromPoints(vertices),lineMat);
  pathLine.frustumCulled=false;scene.add(pathLine);return true;
 }
 let pointerDown=null;
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.button!==2)return;
  const point=groundAt(e.clientX,e.clientY);
  if(e.button===2){
   shotAim=point;shootHeld=true;onFire(point);
  }else{
   const chosen=world.building?.getHotspot(raycaster)||null;
   pointerDown={x:e.clientX,y:e.clientY,point,hotspot:chosen,fast:e.shiftKey||e.detail>1,id:e.pointerId};
  }
 });
 canvas.addEventListener('pointerup',e=>{
  if(e.button===2){shootHeld=false;return}
  if(e.button!==0||!pointerDown)return;
  const p=pointerDown;pointerDown=null;
  if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>9)return;
  if(world.building?.transitioning)return;
  if(p.hotspot){
   if(p.hotspot.id==='blocked'){onInteract(p.hotspot.id);return}
   const dest=world.building.approachFor(p.hotspot,player);
   const callback=()=>onInteract(p.hotspot.id);
   // Si l'on est déjà arrivé au point d'action, effectuer l'interaction.
   if(Math.hypot(dest.x-player.position.x,dest.z-player.position.z)<.75){callback();return}
   if(!moveTo(dest,false,callback))onInteract('inaccessible');
  }else if(!moveTo(p.point,p.fast)){onInteract('inaccessible')}
 });
 canvas.addEventListener('pointercancel',()=>{pointerDown=null;shootHeld=false});
 canvas.addEventListener('pointermove',e=>{
  pointerPoint=groundAt(e.clientX,e.clientY);
  if(shootHeld)shotAim=pointerPoint;
 });
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 function faceAt(point,instant=false){
  if(!point)return;
  const dx=point.x-player.position.x,dz=point.z-player.position.z;
  if(dx*dx+dz*dz<.003)return;
  const target=Math.atan2(-dx,-dz);
  const delta=Math.atan2(Math.sin(target-player.rotation.y),Math.cos(target-player.rotation.y));
  player.rotation.y+=delta*(instant?1:.18);
 }
 function update(dt,time,shiftHeld=false){
  moving=false;running=false;
  if(!world.building?.transitioning&&waypoints.length&&index<waypoints.length){
   const p=waypoints[index],dx=p.x-player.position.x,dz=p.z-player.position.z;
   const distance=Math.hypot(dx,dz);
   if(distance<.16){index++;if(index>=waypoints.length){const callback=arrival;clear();run=false;if(callback)callback()}}
   else{
    running=run||shiftHeld;const speed=running?5.5:3.4;
    const length=Math.min(distance,speed*dt),vx=dx/distance*length,vz=dz/distance*length;
    if(!shootHeld)faceAt(p);
    let changed=false;
    if(!world.collides(player.position.x+vx,player.position.z,.43,currentLevel())){player.position.x+=vx;changed=true}
    if(!world.collides(player.position.x,player.position.z+vz,.43,currentLevel())){player.position.z+=vz;changed=true}
    moving=changed;if(!changed)clear();
   }
  }
  if(shootHeld){faceAt(shotAim,true);onFire(shotAim)}
  if(marker.visible)marker.material.opacity=.62+.20*Math.sin(time*4.5);
  return{moving,running,shooting:shootHeld};
 }
 return{moveTo,clear,groundAt,update,getAim(){return shotAim||pointerPoint},
  faceAt,hasPath(){return !!waypoints.length}};
}
