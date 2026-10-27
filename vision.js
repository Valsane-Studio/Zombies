/* ZONE ZÉRO — visibilité limitée, exploration et occultation. */
export function createVision(T,scene,world){
  const {minX,maxX,minZ,maxZ}=world.bounds;
  const width=372,height=264,w=maxX-minX,h=maxZ-minZ;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const mask=document.createElement('canvas');mask.width=width;mask.height=height;
  const mctx=mask.getContext('2d',{willReadFrequently:true});
  const explored=new Uint8Array(width*height),visible=new Uint8Array(width*height);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const overlay=new T.Mesh(new T.PlaneGeometry(w,h),material);
  overlay.rotation.x=-Math.PI/2;overlay.position.set((minX+maxX)/2,40,(minZ+maxZ)/2);
  overlay.renderOrder=300;overlay.frustumCulled=false;scene.add(overlay);
  const xPixel=x=>(x-minX)/w*width,zPixel=z=>(z-minZ)/h*height;
  const pixel=(x,z)=>{
    const px=Math.floor(xPixel(x)),pz=Math.floor(zPixel(z));
    if(px<0||pz<0||px>=width||pz>=height)return -1;
    return pz*width+px;
  };
  const blockers=world.blockers.filter(b=>b.h>=1.15);
  // Ray vs AABB, sans dépendre de la grille A*.
  function obstacleDist(x,z,dx,dz,maxDistance,viewerHeight){
    let best=maxDistance;
    for(const b of blockers){
      if(b.h<viewerHeight-.5)continue; // depuis un toit, on voit au-dessus des petits couverts
      const lowX=b.x-b.w/2-.08,highX=b.x+b.w/2+.08,lowZ=b.z-b.d/2-.08,highZ=b.z+b.d/2+.08;
      let tmin=0,tmax=best;
      if(Math.abs(dx)<1e-8){if(x<lowX||x>highX)continue}
      else{const t1=(lowX-x)/dx,t2=(highX-x)/dx;tmin=Math.max(tmin,Math.min(t1,t2));tmax=Math.min(tmax,Math.max(t1,t2))}
      if(Math.abs(dz)<1e-8){if(z<lowZ||z>highZ)continue}
      else{const t1=(lowZ-z)/dz,t2=(highZ-z)/dz;tmin=Math.max(tmin,Math.min(t1,t2));tmax=Math.min(tmax,Math.max(t1,t2))}
      if(tmax>=tmin&&tmax>=0&&tmin<best)best=tmin;
    }
    return best;
  }
  function update(p,radius=20){
    if(!p)return;
    const viewHeight=world.heightAt(p.x,p.z)+(p.mode==='sneak'?.9:1.6);
    const rays=160,poly=[];
    for(let i=0;i<rays;i++){
      const a=i*2*Math.PI/rays,dx=Math.cos(a),dz=Math.sin(a);
      const distance=obstacleDist(p.x,p.z,dx,dz,radius,viewHeight);
      poly.push([xPixel(p.x+dx*distance),zPixel(p.z+dz*distance)]);
    }
    mctx.clearRect(0,0,width,height);
    mctx.beginPath();mctx.moveTo(poly[0][0],poly[0][1]);
    for(let i=1;i<poly.length;i++)mctx.lineTo(poly[i][0],poly[i][1]);
    mctx.closePath();mctx.fillStyle='#fff';mctx.fill();
    const image=mctx.getImageData(0,0,width,height).data;
    const fog=ctx.createImageData(width,height);
    visible.fill(0);
    for(let i=0;i<explored.length;i++){
      const seeing=image[i*4+3]>80;
      if(seeing){visible[i]=1;explored[i]=1}
      const j=i*4;
      fog.data[j]=9;fog.data[j+1]=17;fog.data[j+2]=20;
      fog.data[j+3]=seeing?0:explored[i]?206:252;
    }
    ctx.putImageData(fog,0,0);texture.needsUpdate=true;
  }
  function canSee(x,z){const i=pixel(x,z);return i>=0&&visible[i]===1}
  function discovered(x,z){const i=pixel(x,z);return i>=0&&explored[i]===1}
  function hasLineOfSight(a,b){
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<.001)return true;
    return obstacleDist(a.x,a.z,dx/d,dz/d,d-.15,world.heightAt(a.x,a.z)+1.45)>=d-.15;
  }
  function explorationPercent(){
    let count=0;for(let i=0;i<explored.length;i+=16)if(explored[i])count++;
    return Math.round(count/Math.ceil(explored.length/16)*100);
  }
  return {update,canSee,discovered,hasLineOfSight,explorationPercent};
}
