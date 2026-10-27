/* Comportement volontairement élémentaire des infectés : voir, entendre, poursuivre, oublier. */
export function createStealth(world,vision){
  const sounds=[];
  function noise(x,z,radius,kind='footstep',time=0){sounds.push({x,z,radius,kind,expires:time+1.6})}
  function coverNear(player){
    const {x,z}=player;
    return world.blockers.some(b=>{
      if(b.h<.65||b.h>2.2)return false;
      const dx=Math.max(0,Math.abs(x-b.x)-b.w/2),dz=Math.max(0,Math.abs(z-b.z)-b.d/2);
      return Math.hypot(dx,dz)<1.55;
    });
  }
  function visibleTo(z,player){
    if(!player.alive)return false;
    const d=Math.hypot(z.x-player.x,z.z-player.z);
    if(d<1.5)return true;
    let radius=player.mode==='sprint'?17:player.mode==='sneak'?6:11.5;
    const covered=player.mode==='sneak'&&coverNear(player);
    if(covered)radius*=.56;
    if(player.flashlight)radius+=6;
    const forwardX=-Math.sin(z.heading||0),forwardZ=-Math.cos(z.heading||0);
    const angle=(forwardX*(player.x-z.x)+forwardZ*(player.z-z.z))/d;
    if(angle<-.12)radius*=.48;
    if(d>radius)return false;
    if(!vision.hasLineOfSight(z,player))return false;
    if(covered&&d>3.3){
      // Le joueur accroupi derrière un objet n'est pas détecté à moyenne portée.
      const chest={x:player.x,z:player.z};
      const low=world.blockers.some(b=>{
        if(b.h<.7||b.h>1.9)return false;
        const dx=chest.x-z.x,dz=chest.z-z.z,dist2=dx*dx+dz*dz;
        if(dist2<.001)return false;
        const t=Math.max(0,Math.min(1,((b.x-z.x)*dx+(b.z-z.z)*dz)/dist2));
        const qx=z.x+t*dx,qz=z.z+t*dz;
        return t>.55&&Math.abs(qx-b.x)<b.w/2+.5&&Math.abs(qz-b.z)<b.d/2+.5;
      });
      if(low)return false;
    }
    return true;
  }
  function updateZombie(z,player,time){
    while(sounds.length&&sounds[0].expires<time)sounds.shift();
    if(visibleTo(z,player)){
      z.state='chase';z.alert=true;z.lastSeen={x:player.x,z:player.z};z.lastSighting=time;
      return{state:z.state,destination:z.lastSeen};
    }
    let heard=null,nearest=Infinity;
    for(const ev of sounds){
      const d=Math.hypot(z.x-ev.x,z.z-ev.z);
      if(d<=ev.radius&&d<nearest){nearest=d;heard=ev}
    }
    if(heard){
      z.lastSeen={x:heard.x,z:heard.z};z.lastSighting=time;
      z.state='investigate';z.alert=true;
      return{state:z.state,destination:z.lastSeen};
    }
    if(z.state==='chase'&&time-(z.lastSighting||0)<3.5){
      return{state:'search',destination:z.lastSeen};
    }
    if(z.state==='investigate'&&z.lastSeen&&time-(z.lastSighting||0)<6){
      return{state:'investigate',destination:z.lastSeen};
    }
    z.state='idle';z.alert=false;
    return{state:z.state,destination:z.origin||null};
  }
  function threat(player,zombies){
    let danger=0;
    for(const z of zombies)if(z.hp>0){
      const d=Math.hypot(z.x-player.x,z.z-player.z);
      if(z.state==='chase'&&d<17)danger+=3;
      else if(z.alert&&d<20)danger+=1;
    }
    return danger>=5?'CRITIQUE':danger>=3?'TRAQUÉ':danger?'SUSPECT':'CALME';
  }
  return {noise,coverNear,visibleTo,updateZombie,threat};
}
