/* Navigation de ZONE ZÉRO : grille, obstacles, rampes et A* à tas binaire. Sans dépendance 3D. */
export function createNavigation(blockers,platforms,bounds={minX:-94,maxX:94,minZ:-66,maxZ:66}){
  const {minX,maxX,minZ,maxZ}=bounds,cols=maxX-minX+1,rows=maxZ-minZ+1,size=cols*rows;
  const at=(x,z)=>(z-minZ)*cols+x-minX;
  const inside=(x,z)=>x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function deckHeight(p,x,z){
    const xL=p.x-p.w/2,xR=p.x+p.w/2,zB=p.z-p.d/2,zT=p.z+p.d/2;
    if(x>=xL&&x<=xR&&z>=zB&&z<=zT)return p.h;
    if(Math.abs(z-p.z)>p.rampWidth/2)return null;
    if(p.side==='east'&&x>xR&&x<xR+p.rampLength)return p.h*(1-(x-xR)/p.rampLength);
    if(p.side==='west'&&x<xL&&x>xL-p.rampLength)return p.h*(1-(xL-x)/p.rampLength);
    return null;
  }
  function heightAt(x,z){
    for(const p of platforms){const h=deckHeight(p,x,z);if(h!==null)return .06+Math.max(0,h)}
    return .06;
  }
  function obstruction(x,z,pad=0,limit=0){
    for(const b of blockers)if(b.h>=limit&&Math.abs(x-b.x)<b.w/2+pad&&Math.abs(z-b.z)<b.d/2+pad)return true;
    return false;
  }
  const grid=new Uint8Array(size);
  for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)grid[at(x,z)]=obstruction(x,z,.32)?0:1;
  function canStep(x,z,xx,zz){
    if(!inside(xx,zz)||!grid[at(xx,zz)])return false;
    return Math.abs(heightAt(x,z)-heightAt(xx,zz))<=.55;
  }
  function snap(x,z){
    const a=clamp(Math.round(x),minX,maxX),b=clamp(Math.round(z),minZ,maxZ);
    if(grid[at(a,b)])return{x:a,z:b};
    let winner=null,score=Infinity;
    for(let r=1;r<=11;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
      const xx=a+dx,zz=b+dz;if(!inside(xx,zz)||!grid[at(xx,zz)])continue;
      const d=dx*dx+dz*dz;if(d<score){score=d;winner={x:xx,z:zz}}
    }
    return winner;
  }
  function canSegment(a,b){
    const length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/.4));
    let py=heightAt(a.x,a.z);
    for(let k=1;k<=n;k++){
      const t=k/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
      const y=heightAt(x,z);
      if(obstruction(x,z,.29)||Math.abs(y-py)>.52)return false;
      py=y;
    }
    return true;
  }
  function pathfind(a,b){
    const start=snap(a.x,a.z),end=snap(b.x,b.z);if(!start||!end)return[];
    const s=at(start.x,start.z),target=at(end.x,end.z);
    if(s===target){return canSegment(a,b)?[{x:b.x,z:b.z}]:[]}
    const distances=new Float32Array(size),previous=new Int32Array(size),visited=new Uint8Array(size);
    distances.fill(Infinity);previous.fill(-1);distances[s]=0;
    const heap=[];
    function push(id,cost){let i=heap.length;heap.push({id,cost});while(i>0){
      const parent=(i-1)>>1;if(heap[parent].cost<=cost)break;
      heap[i]=heap[parent];i=parent;
    }heap[i]={id,cost}}
    function pop(){const root=heap[0],last=heap.pop();if(heap.length){
      let i=0;while(true){
        let child=i*2+1;if(child>=heap.length)break;
        if(child+1<heap.length&&heap[child+1].cost<heap[child].cost)child++;
        if(last.cost<=heap[child].cost)break;
        heap[i]=heap[child];i=child;
      }heap[i]=last;
    }return root}
    push(s,Math.hypot(end.x-start.x,end.z-start.z));let count=0;
    while(heap.length&&count++<size){
      const v=pop(),id=v.id;
      if(visited[id])continue;visited[id]=1;if(id===target)break;
      const x=id%cols+minX,z=Math.floor(id/cols)+minZ;
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const xx=x+dx,zz=z+dz;if(!canStep(x,z,xx,zz))continue;
        const next=at(xx,zz);if(visited[next])continue;
        const nd=distances[id]+1;
        if(nd<distances[next]){
          distances[next]=nd;previous[next]=id;
          push(next,nd+Math.hypot(end.x-xx,end.z-zz));
        }
      }
    }
    if(previous[target]===-1)return[];
    const raw=[];let current=target;
    while(current!==s&&current!==-1&&raw.length<size){raw.push({x:current%cols+minX,z:Math.floor(current/cols)+minZ});current=previous[current]}
    raw.reverse();
    if(!obstruction(b.x,b.z,.3)&&canSegment(raw[raw.length-1],b))raw.push({x:b.x,z:b.z});
    // Réduire les zigzags sur les longues avenues, sans franchir les bâtiments.
    const optimized=[],nodes=[{x:a.x,z:a.z},...raw];
    for(let i=0;i<nodes.length-1;){
      let j=Math.min(nodes.length-1,i+16);
      while(j>i+1&&!canSegment(nodes[i],nodes[j]))j--;
      optimized.push(nodes[j]);i=j;
    }
    return optimized;
  }
  function visible(a,b){
    const ax=a.x,az=a.z,bx=b.x,bz=b.z;
    const ay=heightAt(ax,az)+1.32,by=heightAt(bx,bz)+1.12;
    const steps=Math.ceil(Math.hypot(ax-bx,az-bz)*4);
    for(let i=2;i<steps-1;i++){
      const t=i/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=ay+(by-ay)*t;
      if(obstruction(x,z,0,y))return false;
      if(heightAt(x,z)>y+.15)return false;
    }return true;
  }
  return{bounds,heightAt,obstruction,snap,canSegment,pathfind,visible,blockers,platforms};
}
