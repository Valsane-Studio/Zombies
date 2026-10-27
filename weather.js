/* Ambiance urbaine : bitume humide, pluie fine, halos et feux d'urgence intermittents. */
export function createWeather(T,scene,world){
  const random=(()=>{let v=58321;return()=>((v=(1664525*v+1013904223)>>>0)/4294967296)})();
  if(world.materials?.asphalt){world.materials.asphalt.roughness=.56;world.materials.asphalt.metalness=.09;world.materials.asphalt.needsUpdate=true}
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createRadialGradient(48,48,2,48,48,47);
  grad.addColorStop(0,'rgba(178,194,183,.45)');grad.addColorStop(.35,'rgba(118,142,134,.23)');grad.addColorStop(1,'rgba(73,98,94,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const puddles=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide}),110);
  const obj=new T.Object3D();let count=0,attempts=0;
  while(count<110&&attempts++<1500){
    const x=-88+random()*176,z=-61+random()*122;
    if(world.obstruction(x,z,1.3))continue;
    if(!world.roadX.some(a=>Math.abs(x-a)<4.8)&&!world.roadZ.some(a=>Math.abs(z-a)<4.8))continue;
    obj.position.set(x,.095,z);obj.rotation.set(-Math.PI/2,0,random()*Math.PI);
    obj.scale.set(.7+random()*2.8,.35+random()*1.2,1);obj.updateMatrix();puddles.setMatrixAt(count++,obj.matrix);
  }
  puddles.count=count;puddles.instanceMatrix.needsUpdate=true;scene.add(puddles);
  const countRain=570,positions=new Float32Array(countRain*6);
  const cellWidth=48,cellDepth=42;
  for(let i=0;i<countRain;i++){
    const j=i*6,x=random()*cellWidth-cellWidth/2,z=random()*cellDepth-cellDepth/2,y=random()*17;
    positions[j]=x;positions[j+1]=y;positions[j+2]=z;
    positions[j+3]=x+.08;positions[j+4]=y-.36;positions[j+5]=z-.055;
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const rain=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xa5bfbe,transparent:true,opacity:.24,depthWrite:false}));
  rain.frustumCulled=false;scene.add(rain);
  const flashPoints=[[-38,7],[42,44],[23,-15],[6,-30]];
  const beacons=flashPoints.map(([x,z],i)=>{
    const material=new T.MeshBasicMaterial({color:i%2?0xd66f51:0x709fb5});
    const o=new T.Mesh(new T.SphereGeometry(.11,9,8),material);
    o.position.set(x,1.1,z);scene.add(o);
    const light=new T.PointLight(i%2?0xf58b59:0x6bc3e7,0,11,2);
    light.position.set(x,1.6,z);scene.add(light);
    return {light,o,phase:i*1.9};
  });
  let elapsed=0;
  function update(dt,center){
    elapsed+=dt;
    const a=geometry.attributes.position;
    for(let i=0;i<countRain;i++){
      const j=i*6;
      const y=positions[j+1]-dt*11.8;
      const ny=y<-.1?15+random()*4:y;
      positions[j+1]=ny;positions[j+4]=ny-.36;
      if(ny>14&&y<-.1){const x=random()*cellWidth-cellWidth/2,z=random()*cellDepth-cellDepth/2;positions[j]=x;positions[j+3]=x+.08;positions[j+2]=z;positions[j+5]=z-.055}
    }
    a.needsUpdate=true;
    rain.position.set(center.x,0,center.z);
    for(const b of beacons){
      const flicker=Math.sin(elapsed*5.7+b.phase)*Math.sin(elapsed*2.8+b.phase);
      b.light.intensity=Math.max(0,(flicker-.42)*4.5);b.o.visible=b.light.intensity>.4;
    }
  }
  return {update};
}
