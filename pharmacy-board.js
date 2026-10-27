/* Dessin original du plateau tactique : encre, papier, bâtiments et pions. */
import * as E from './pharmacy-engine.js';
const W=E.W,H=E.H,C=50,TAU=Math.PI*2;
const PALETTE={paper:'#a6ac9a',road:'#9aa294',line:'#78887c',text:'#e5e3c7',dark:'#354940',
  building:'#6c7a70',building2:'#7d8172',walls:'#485a51',med:'#dccd9d',gold:'#eac184',red:'#bf7665',green:'#86bf9d'};
const hash=(a,b)=>((a*92821+b*68917+4311)>>>0)%10000/10000;
const center=(x,y)=>({x:(x+.5)*C,y:(y+.5)*C});
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function fill(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function txt(ctx,text,x,y,size=12,color='#f0edce',align='center',weight='800'){
 ctx.font=weight+' '+size+'px Inter,system-ui,sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function stroke(ctx,x,y,w,h,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(x,y,w,h)}
function poly(ctx,pts,color,close=true){
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
 if(close)ctx.closePath();ctx.fill();
}
function circle(ctx,x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=c;ctx.fill()}
function labelChip(ctx,text,x,y,c='#253c33',fg='#e9eac7',size=12){
 ctx.font='800 '+size+'px Inter,system-ui,sans-serif';const width=Math.max(34,ctx.measureText(text).width+18);
 fill(ctx,x-width/2,y-13,width,24,c);txt(ctx,text,x,y,size,fg);return width;
}
function building(ctx,b){
 const x=b.x*C,y=b.y*C,w=b.w*C,h=b.h*C;
 if(b.type==='pharmacy'){
  ctx.shadowColor='#293c3480';ctx.shadowBlur=12;ctx.shadowOffsetY=5;
  fill(ctx,x,y,w,h,'#576e61');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  fill(ctx,x+12,y+12,w-24,h-24,'#d1c5a0');
  ctx.save();ctx.beginPath();ctx.rect(x+10,y+10,w-20,h-20);ctx.clip();
  for(let k=0;k<13;k++)fill(ctx,x+12,y+14+k*22,w-24,.9,'#8e927945');
  for(let k=0;k<8;k++)fill(ctx,x+15+k*45,y+12,.8,h-24,'#81796335');
  ctx.restore();
  // Étagères dessinées contre les murs, sans masquer le chemin.
  for(const [sx,sy,vert] of [[10.5,5.3,1],[14.8,5.5,1],[10.5,7.6,1],[14.8,7.5,1]]){
   const xx=sx*C,yy=sy*C;fill(ctx,xx-9,yy-16,18,32,'#a48c63');
   stroke(ctx,xx-9,yy-16,18,32,'#736e54',1);
   for(let j=0;j<3;j++)fill(ctx,xx-7,yy-11+j*9,14,3,j%2?'#ece2be':'#839f8a');
  }
  // Encadrement et murs épais, interrompus par les accès.
  const x0=x+8,x1=x+w-8,y0=y+8,y1=y+h-8;
  ctx.lineWidth=14;ctx.strokeStyle='#435c51';ctx.beginPath();
  ctx.moveTo(x0,y1);ctx.lineTo((12-.55)*C,y1);ctx.moveTo((12+.55)*C,y1);ctx.lineTo(x1,y1);
  ctx.moveTo(x0,y0);ctx.lineTo((10-.55)*C,y0);ctx.moveTo((10+.55)*C,y0);ctx.lineTo(x1,y0);
  ctx.moveTo(x0,y0);ctx.lineTo(x0,y1);ctx.moveTo(x1,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle='#bac9a7';ctx.strokeRect(x+7,y+7,w-14,h-14);
  // Enseigne de pharmacie + croix
  fill(ctx,x+87,y+67,237,43,'#49675b');
  txt(ctx,'PHARMACIE',x+204,y+89,19,'#e9e5bc');
  fill(ctx,x+55,y+62,26,9,'#aed0a8');fill(ctx,x+63,y+54,9,25,'#aed0a8');
  txt(ctx,'RÉCUPÉRER LES MÉDICAMENTS',x+w/2,y+h-57,10,'#52634f');
  return;
 }
 ctx.shadowColor='#283a3290';ctx.shadowBlur=11;ctx.shadowOffsetY=4;
 fill(ctx,x+3,y+4,w-4,h-4,'#55665a');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 const roof=b.type==='industrial'?'#777e73':'#849083';
 fill(ctx,x+7,y+7,w-14,h-14,roof);stroke(ctx,x+7,y+7,w-14,h-14,'#52665b',4);
 fill(ctx,x+18,y+18,w-36,4,'#aeb6a14d');fill(ctx,x+18,y+h-22,w-36,4,'#3e5c4c66');
 for(let i=0;i<Math.floor(w/53);i++){
  for(let j=0;j<Math.floor(h/66);j++){
   const wx=x+22+i*49,wy=y+22+j*61;
   if(wx+27>x+w-10||wy+25>y+h-10)continue;
   fill(ctx,wx,wy,26,23,i%3===0?'#64796d':'#73857b');
   stroke(ctx,wx,wy,26,23,'#a9b6a388');
   fill(ctx,wx+11,wy+3,4,17,'#4d5b50');
  }
 }
 for(let i=0;i<14;i++){
  const px=x+10+hash(i,b.x)*Math.max(1,w-20),py=y+10+hash(i+10,b.y)*Math.max(1,h-20);
  fill(ctx,px,py,1.5,1.5,'#475b503f');
 }
 labelChip(ctx,b.name,x+w/2,y+h/2,'#4b5e54','#e1dfb8',11);
}
function obstacle(ctx,o){
 const x=o.x*C,y=o.y*C,w=o.w*C,h=o.h*C,cx=x+w/2,cy=y+h/2;
 if(o.type==='bus'){
  ctx.shadowColor='#283930aa';ctx.shadowBlur=14;
  round(ctx,x+4,y+6,w-8,h-12,9);ctx.fillStyle='#393d39';ctx.fill();ctx.shadowBlur=0;
  round(ctx,x+10,y+8,w-20,h-16,5);ctx.fillStyle='#54594e';ctx.fill();
  for(let k=0;k<4;k++)fill(ctx,x+19+k*31,y+13,19,h-26,k%3===0?'#a08e77':'#394e4b');
  stroke(ctx,x+8,y+8,w-16,h-16,'#c1a27d',2);
  circle(ctx,x+w*.23,y+4,6,'#1d2927');circle(ctx,x+w*.77,y+4,6,'#1d2927');
  txt(ctx,'BUS 07',cx,cy+17,9,'#d0c0a0');
  return;
 }
 if(o.type==='car'){
  ctx.save();ctx.translate(cx,cy);if(o.h>o.w)ctx.rotate(Math.PI/2);
  ctx.shadowColor='#1f302eaa';ctx.shadowBlur=12;round(ctx,-w/2+5,-h/2+5,w-10,h-10,8);
  ctx.fillStyle='#3c443e';ctx.fill();ctx.shadowBlur=0;
  round(ctx,-w*.28,-h*.35,w*.55,h*.7,6);ctx.fillStyle='#60665a';ctx.fill();
  fill(ctx,-w*.15,-h*.30,w*.3,h*.60,'#465a53');
  for(const xx of [-w*.35,w*.35])circle(ctx,xx,0,5,'#282f2a');
  ctx.restore();return;
 }
 if(o.type==='dumpster'){
  fill(ctx,x+3,y+5,w-6,h-9,'#576b5d');stroke(ctx,x+3,y+5,w-6,h-9,'#293e36',3);
  fill(ctx,x+8,y+10,w-16,h-20,'#374a41');fill(ctx,x+13,y+12,w-26,4,'#b7b195');
  return;
 }
 if(o.type==='rubble'){
  fill(ctx,x,y,w,h,'#7c8272');for(let i=0;i<12;i++){
   const xx=x+3+hash(i,o.x)*Math.max(1,w-10),yy=y+3+hash(i+40,o.y)*Math.max(1,h-10);
   poly(ctx,[[xx,yy],[xx+9,yy+3],[xx+3,yy+11]],i%2?'#50584e':'#b9ab8f');
  }return;
 }
 fill(ctx,x+2,y+7,w-4,h-14,'#b7ad91');stroke(ctx,x+2,y+7,w-4,h-14,'#546358',3);
 for(let xx=x+8;xx<x+w-7;xx+=13)fill(ctx,xx,y+12,7,h-24,'#c18c69');
}
function staticLayer(){
 const canvas=document.createElement('canvas');canvas.width=W*C;canvas.height=H*C;
 const ctx=canvas.getContext('2d');fill(ctx,0,0,W*C,H*C,'#b0b09a');
 // Pavés granuleux aux bords et asphalte au milieu.
 fill(ctx,0,2*C,W*C,11*C,PALETTE.road);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const n=hash(x*7,y*11);
  if(n>.86)fill(ctx,x*C+8+n*15,y*C+12+n*10,14,1,'#465a5044');
  else if(n<.09)fill(ctx,x*C+9,y*C+33,7,8,'#c5c9b83a');
 }
 // Grille du plan : tracé mesuré, discret.
 ctx.lineWidth=.65;ctx.strokeStyle='#54685a36';
 for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*C,0);ctx.lineTo(x*C,H*C);ctx.stroke()}
 for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(0,y*C);ctx.lineTo(W*C,y*C);ctx.stroke()}
 // Chaussées et marquages centraux.
 for(let x=2;x<22;x+=2){
  fill(ctx,x*C+13,10*C+24,19,2,'#dfd7b775');fill(ctx,x*C+13,3*C+24,16,2,'#dfd7b744')
 }
 for(const x of [8,17]){
  for(let y=2;y<14;y+=2)fill(ctx,x*C+25,y*C+12,2,20,'#dbd5b074')
 }
 for(const [x,y] of [[7,9],[16,10],[8,3],[17,13]]){
  for(let i=0;i<4;i++)fill(ctx,x*C+4+i*11,y*C+5,6,35,'#d4ccaa99')
 }
 for(const b of E.BUILDINGS)building(ctx,b);
 // Peinture des accès après les façades.
 for(const d of E.DOORS){const p=center(d.x,d.y);circle(ctx,p.x,p.y,18,'#455e4e');circle(ctx,p.x,p.y,16,'#b5a071')}
 for(const o of E.OBSTACLES)obstacle(ctx,o);
 // Petits déchets, fissures, bouches d'évacuation.
 for(let i=0;i<180;i++){
  const x=hash(i,23)*W*C,y=hash(19,i*19)*H*C,tileX=Math.floor(x/C),tileY=Math.floor(y/C);
  if(E.BUILDINGS.some(b=>tileX>=b.x&&tileX<b.x+b.w&&tileY>=b.y&&tileY<b.y+b.h))continue;
  ctx.save();ctx.translate(x,y);ctx.rotate(hash(i,44)*6.28);
  fill(ctx,0,0,4+hash(i,12)*8,1.2,i%3?'#4c61504a':'#e3d4a558');ctx.restore();
 }
 // Traits de contrôle et points de repère cartographique.
 for(const [x,y,text] of [[1,9,'RUE DES LILAS'],[18,3,'BOULEVARD SUD'],[4,7,'PASSAGE OUEST'],[18,14,'QUARTIER EST']]){
  txt(ctx,text,x*C,y*C,10,'#5e7564','left','750');
 }
 stroke(ctx,1,1,W*C-2,H*C-2,'#334b3e',4);
 return canvas;
}
export function makePainter(canvas){
 const ctx=canvas.getContext('2d'),base=staticLayer();
 function badge(x,y,symbol,desc,color='#dabb79'){
  const p=center(x,y);ctx.shadowColor='#24392d6e';ctx.shadowBlur=9;
  circle(ctx,p.x,p.y,17,'#293d33');ctx.shadowBlur=0;circle(ctx,p.x,p.y,14,color);
  txt(ctx,symbol,p.x,p.y+1,16,'#263c31');if(desc)labelChip(ctx,desc,p.x,p.y-29,'#314639','#eee3bd',9);
 }
 function drawDoor(d,open){
  const p=center(d.x,d.y);
  if(open){ctx.strokeStyle='#93c9a2';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,20,0,Math.PI*1.45);ctx.stroke();txt(ctx,'✓',p.x,p.y,17,'#a9dcaf')}
  else{
   ctx.shadowColor='#27392966';ctx.shadowBlur=7;fill(ctx,p.x-18,p.y-15,36,30,'#e0ac73');ctx.shadowBlur=0;
   stroke(ctx,p.x-18,p.y-15,36,30,'#8c694f',3);
   fill(ctx,p.x-12,p.y-10,24,20,'#ae815c');
   circle(ctx,p.x+8,p.y,2,'#e9d9a5');
  }
  labelChip(ctx,d.id==='front'?'ENTRÉE':d.id==='rear'?'ARRIÈRE':'GRILLE',p.x,p.y-30,open?'#426753':'#665641','#f3dfb5',9);
 }
 function pawn(pt,zombie,state,ghost=false){
  const p=center(pt.x,pt.y);
  ctx.save();ctx.translate(p.x,p.y);
  if(ghost)ctx.globalAlpha=.48;
  ctx.shadowColor=zombie?'#742c2399':'#153c3099';ctx.shadowBlur=ghost?3:14;
  circle(ctx,0,1,zombie?15:17,zombie?'#9d6457':'#85bd9f');
  ctx.shadowBlur=0;circle(ctx,0,0,zombie?11:13,zombie?'#8a554e':'#426c59');
  poly(ctx,[[-7,6],[0,-10],[7,6]],zombie?'#d3a99b':'#d1dab7');
  circle(ctx,0,-3,3,zombie?'#4b302b':'#e8e0bb');
  ctx.lineWidth=ghost?2:3;ctx.strokeStyle=zombie?'#e0aaa0':'#e1deb0';
  ctx.beginPath();ctx.arc(0,0,zombie?15:17,0,TAU);ctx.stroke();
  if(zombie&&!ghost&&state){
   if(state.phase!=='errant'){ctx.fillStyle=state.phase==='poursuit'?'#f7b29a':'#f3c68e';ctx.beginPath();ctx.arc(13,-12,5,0,TAU);ctx.fill()}
   if(state.hp===1){fill(ctx,-4,19,8,2,'#f0cd9e')}
  }
  ctx.restore();
 }
 function arrow(a,b,color){
  const p=center(a.x,a.y),q=center(b.x,b.y),dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy);
  if(length<2)return;
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  ctx.setLineDash([]);const angle=Math.atan2(dy,dx);
  poly(ctx,[[q.x,q.y],[q.x-11*Math.cos(angle-.48),q.y-11*Math.sin(angle-.48)],[q.x-11*Math.cos(angle+.48),q.y-11*Math.sin(angle+.48)]],color);
  ctx.restore();
 }
 function render(s,opt={}){
  const {preview=null,action=null,hover=null,t=0,progress=1,previous=null}=opt;
  ctx.clearRect(0,0,W*C,H*C);ctx.drawImage(base,0,0);
  // Objectif d'extraction et boîtier de l'alarme.
  badge(E.EXIT.x,E.EXIT.y,'↥','EXTRACTION','#95ceab');
  badge(E.PANEL.x,E.PANEL.y,s.alarm.used?'✓':'⏻','ALARME','#e1bc7c');
  badge(E.ALARM.x,E.ALARM.y,'♫',s.alarm.active?'SIRÈNE ACTIVE':'VOITURE','#cb9d75');
  for(const d of E.DOORS)drawDoor(d,s.doors[d.id]);
  if(!s.player.medicine)badge(E.MED.x,E.MED.y,'✚','MÉDICAMENTS','#e2d7aa');
  else badge(E.MED.x,E.MED.y,'✓','RÉCUPÉRÉS','#a6c9a4');
  if(s.alarm.active>0){
    const at=center(E.ALARM.x,E.ALARM.y);
    circle(ctx,at.x,at.y,11*C,'#b7814630');
    ctx.strokeStyle='#e7b875a6';ctx.lineWidth=2;ctx.setLineDash([10,9]);ctx.beginPath();
    ctx.arc(at.x,at.y,11*C,0,TAU);ctx.stroke();ctx.setLineDash([]);
    labelChip(ctx,'SIRÈNE · '+s.alarm.active+' TOUR'+(s.alarm.active>1?'S':''),at.x,at.y+41,'#72573c','#f7d7a6',10);
  }
  if(hover&&s.status==='playing'){
   const p=center(hover.x,hover.y);
   ctx.strokeStyle='#fff3c9c9';ctx.lineWidth=2;ctx.setLineDash([6,3]);
   ctx.strokeRect(hover.x*C+3,hover.y*C+3,C-6,C-6);ctx.setLineDash([]);
  }
  let next=null;if(preview?.valid)next=preview.next;
  if(next&&action){
   // Affiche la case atteinte en fin d'action et le rayon du son.
   if(action.type==='move'){
    const route=E.plannedPath(s,action.to);
    if(route){
     for(let i=1;i<route.length;i++){
      const p=center(route[i].x,route[i].y);circle(ctx,p.x,p.y,6,i===route.length-1?'#d9c1879c':'#e6e8ca99');
      if(i>1)arrow(route[i-1],route[i],'#cbd9a4a6');
     }
    }
   }
   if(next.lastNoise&&next.lastNoise.radius){
    const e=next.lastNoise,p=center(e.x,e.y);
    circle(ctx,p.x,p.y,e.radius*C,'#d8ab6c24');
    ctx.strokeStyle='#e4ae6fbf';ctx.lineWidth=2;ctx.setLineDash([10,9]);ctx.beginPath();ctx.arc(p.x,p.y,e.radius*C,0,TAU);ctx.stroke();ctx.setLineDash([]);
   }
   if(s.alarm.active||action.type==='interact'&&action.at?.x===E.PANEL.x&&action.at?.y===E.PANEL.y){
    const p=center(E.ALARM.x,E.ALARM.y);circle(ctx,p.x,p.y,11*C,'#b7895320');
   }
   for(let i=0;i<s.zombies.length;i++){
    const z=s.zombies[i],nz=next.zombies[i];
    if(z.hp>0&&nz.hp>0&&(z.x!==nz.x||z.y!==nz.y)){
     const color=nz.phase==='poursuit'?'#b65c4d':'#e9bb72';
     arrow(z,nz,color);pawn(nz,true,nz,true);
    }
   }
   const old=s.player,np=next.player;
   if(old.x!==np.x||old.y!==np.y)pawn(np,false,null,true);
   if(np.hp<old.hp){
    labelChip(ctx,'−'+(old.hp-np.hp)+' SANTÉ',center(np.x,np.y).x,center(np.x,np.y).y-38,'#9f4d44','#fff2db',11);
   }
  }
  // Les infectés neutralisés restent dessinés comme des pions couchés sur le plan.
  for(const z of s.zombies)if(z.hp<=0){
    const at=center(z.x,z.y);
    ctx.save();ctx.translate(at.x,at.y);ctx.rotate(-.45);ctx.globalAlpha=.6;
    circle(ctx,0,0,12,'#6d514a');ctx.strokeStyle='#d7a694';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,8);ctx.moveTo(8,-8);ctx.lineTo(-8,8);ctx.stroke();
    ctx.restore();
  }
  // Pions du tour présent avec interpolation légère après confirmation.
  for(let i=0;i<s.zombies.length;i++){
   const z=s.zombies[i];if(z.hp<=0)continue;
   let pos=z;
   if(previous&&progress<1){
    const was=previous.zombies[i];if(was.hp>0)pos={x:was.x+(z.x-was.x)*progress,y:was.y+(z.y-was.y)*progress};
   }
   pawn(pos,true,z);
   if(z.phase!=='errant'){
    const p=center(pos.x,pos.y);
    ctx.strokeStyle=z.phase==='poursuit'?'#ad5141':'#dfab66';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,20,0,TAU);ctx.stroke();
   }
  }
  const current=s.player,was=previous?.player;
  pawn(was&&progress<1?{x:was.x+(current.x-was.x)*progress,y:was.y+(current.y-was.y)*progress}:current,false);
  if(s.player.medicine){
   const p=center(current.x,current.y);circle(ctx,p.x+12,p.y-12,5,'#f4df9a');
  }
  // Cadre millimétré et coordonnées de plan.
  for(let x=0;x<W;x+=2)txt(ctx,String(x+1).padStart(2,'0'),x*C+13,13,9,'#44594f','left','750');
  for(let y=0;y<H;y+=2)txt(ctx,String.fromCharCode(65+y),7,y*C+27,9,'#465e52','left','750');
 }
 return{render};
}
