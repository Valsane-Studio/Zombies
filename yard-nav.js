/* Navigation pour ZONE ZÉRO : A* spatial léger, obstacles au sol et hauteur de rampe.
   Un chemin ne traverse ni les bâtiments, ni les meubles, ni le bord surélevé
   de la passerelle. Aucun lien avec le décor visuel.
*/
export function findYardPath(T,world,from,to){
 const STEP=.84,MX=-39.1,MZ=-27.1;
 const NX=94,NZ=65;
 const point=(ix,iz)=>({x:MX+ix*STEP,z:MZ+iz*STEP});
 const cell=(v)=>({
  ix:Math.max(0,Math.min(NX-1,Math.round((v.x-MX)/STEP))),
  iz:Math.max(0,Math.min(NZ-1,Math.round((v.z-MZ)/STEP)))
 });
 function safe(x,z,r=.33){return !world.isBlocked(x,z,r)}
 function reach(a,b){
  const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.max(1,Math.ceil(d/.19));
  let py=world.heightAt(a.x,a.z);
  for(let i=1;i<=n;i++){
   const k=i/n,x=a.x+(b.x-a.x)*k,z=a.z+(b.z-a.z)*k;
   if(!safe(x,z,.31))return false;
   const h=world.heightAt(x,z);
   if(Math.abs(h-py)>.29)return false;
   py=h;
  }
  return true;
 }
 function projectToGround(p){
  if(safe(p.x,p.z))return {x:p.x,z:p.z};
  for(let rad=.35;rad<=3.5;rad+=.3){
   for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=p.x+Math.cos(angle)*rad,z=p.z+Math.sin(angle)*rad;
    if(safe(x,z))return{x,z};
   }
  }
  return null;
 }
 const source=projectToGround(from),target=projectToGround(to);
 if(!source||!target)return null;
 if(reach(source,target))return [new T.Vector3(target.x,world.heightAt(target.x,target.z),target.z)];
 const start=cell(source),end=cell(target),startId=start.iz*NX+start.ix,endId=end.iz*NX+end.ix,N=NX*NZ;
 const cost=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
 const steps=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,-1,Math.SQRT2]];
 const heap=[];
 function push(id,f){
  const el={id,f};let i=heap.length;heap.push(el);
  while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p}
  heap[i]=el;
 }
 function pop(){
  const v=heap[0],last=heap.pop();
  if(heap.length){
   let i=0;while(true){
    const l=2*i+1;if(l>=heap.length)break;const r=l+1,j=r<heap.length&&heap[r].f<heap[l].f?r:l;
    if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;
   }heap[i]=last;
  }return v;
 }
 const heuristic=(ix,iz)=>Math.hypot(end.ix-ix,end.iz-iz);
 cost[startId]=0;push(startId,heuristic(start.ix,start.iz));
 let found=false,iterations=0;
 while(heap.length&&iterations++<N*3){
  const {id}=pop();if(closed[id])continue;closed[id]=1;
  if(id===endId){found=true;break}
  const ix=id%NX,iz=Math.floor(id/NX),a=point(ix,iz);
  for(const [dx,dz,length]of steps){
   const x=ix+dx,z=iz+dz;if(x<0||z<0||x>=NX||z>=NZ)continue;
   const next=z*NX+x;if(closed[next])continue;
   const b=point(x,z);
   if(!safe(b.x,b.z)||!reach(a,b))continue;
   const alt=cost[id]+length;
   if(alt>=cost[next])continue;
   cost[next]=alt;prev[next]=id;push(next,alt+heuristic(x,z));
  }
 }
 if(!found)return null;
 const raw=[target],visited=new Set();let cur=endId;
 while(cur!==startId){
  if(cur<0||visited.has(cur))return null;visited.add(cur);
  raw.push(point(cur%NX,Math.floor(cur/NX)));cur=prev[cur];
 }
 raw.push(source);raw.reverse();
 // Path simplification: every shortcut is re-tested against the same obstacles
 // and height changes as the character controller.
 const clean=[];let i=0;
 while(i<raw.length-1){
  let last=raw.length-1;
  while(last>i+1&&!reach(raw[i],raw[last]))last--;
  const p=raw[last];clean.push(new T.Vector3(p.x,world.heightAt(p.x,p.z),p.z));i=last;
  if(clean.length>100)return null;
 }
 return clean;
}
