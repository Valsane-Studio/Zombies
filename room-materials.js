/* ZONE ZÉRO · Matières procédurales haute résolution (aucune dépendance image).
   Les cartes sont utilisées sur de vrais maillages 3D avec ombres et éclairage PBR. */
export function createRoomMaterials(T){
 let seed=908124;
 const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const pick=a=>a[Math.floor(rnd()*a.length)];
 const canvas=(w=512,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]};
 const tex=(c,repX=1,repY=1)=>{
   const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
   t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repX,repY);
   t.anisotropy=8;return t;
 };
 function grime(g,w,h,n=3200,alpha=.1){
  for(let i=0;i<n;i++){
   const x=rnd()*w,y=rnd()*h,r=.5+rnd()*9;
   g.globalAlpha=alpha*rnd();g.fillStyle=rnd()>.5?'#15190f':'#ebd8ad';
   g.beginPath();g.ellipse(x,y,r,r*(.3+rnd()*1.7),rnd()*6.28,0,Math.PI*2);g.fill();
  }g.globalAlpha=1;
 }
 function wall(){
  const[c,g]=canvas(1024);g.fillStyle='#908f82';g.fillRect(0,0,1024,1024);
  const grad=g.createLinearGradient(0,0,0,1024);
  grad.addColorStop(0,'#918f81');grad.addColorStop(.6,'#77796c');grad.addColorStop(1,'#575a50');
  g.globalAlpha=.42;g.fillStyle=grad;g.fillRect(0,0,1024,1024);g.globalAlpha=1;
  for(let i=0;i<620;i++){
   const x=rnd()*1024,y=rnd()*1024;
   g.fillStyle=pick(['#5e6155','#b1a895','#aaa18c','#454c44','#696954']);
   g.globalAlpha=.03+rnd()*.24;g.beginPath();g.ellipse(x,y,2+rnd()*38,2+rnd()*62,rnd()*6,0,6.28);g.fill();
  }
  g.globalAlpha=1;
  for(let i=0;i<39;i++){
   const x=rnd()*1024,y=rnd()*900;
   g.strokeStyle=pick(['#2e3730','#4c4b40','#c0b49b']);g.lineWidth=.5+rnd()*1.5;
   g.globalAlpha=.25+rnd()*.4;g.beginPath();g.moveTo(x,y);
   let px=x,py=y;for(let j=0;j<8;j++){px+=(rnd()-.5)*26;py+=5+rnd()*18;g.lineTo(px,py)}g.stroke();
  }g.globalAlpha=1;grime(g,1024,1024,4500,.1);return tex(c,3,1);
 }
 function wood(){
  const[c,g]=canvas(1024);g.fillStyle='#705746';g.fillRect(0,0,1024,1024);
  for(let i=0;i<1900;i++){
   const y=rnd()*1024,len=40+rnd()*1024;
   g.globalAlpha=.04+rnd()*.20;g.strokeStyle=pick(['#34251e','#ccad79','#241c19','#a27d5b']);
   g.lineWidth=.5+rnd()*2.5;g.beginPath();g.moveTo(rnd()*1024,y);
   g.bezierCurveTo(rnd()*1024,y+8,(rnd()-.5)*1024,y-6,rnd()*1024+len,y+rnd()*4);g.stroke();
  }
  g.globalAlpha=1;grime(g,1024,1024,2100,.13);return tex(c,1.2,1.2);
 }
 function cloth(color,detail=1){
  const[c,g]=canvas(512);g.fillStyle=color;g.fillRect(0,0,512,512);
  for(let i=0;i<512;i+=3){
   g.strokeStyle=i%2?'#0f1d15':'#c8b89a';g.globalAlpha=i%2?.075:.04;
   g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();
   g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();
  }g.globalAlpha=1;
  for(let i=0;i<820;i++){
   const x=rnd()*512,y=rnd()*512,r=2+rnd()*19*detail;
   g.globalAlpha=.03+rnd()*.21;g.fillStyle=rnd()>.52?'#13170f':'#c4bda9';
   g.beginPath();g.ellipse(x,y,r,r*.68,rnd()*6,0,6.28);g.fill();
  }g.globalAlpha=1;return tex(c,2,2);
 }
 function stainedGlass(){
  const[c,g]=canvas(512);g.fillStyle='#9fa6a0';g.fillRect(0,0,512,512);
  grime(g,512,512,1250,.28);return tex(c);
 }
 function rug(){
  const[c,g]=canvas(1024);
  g.fillStyle='#40352e';g.fillRect(0,0,1024,1024);
  for(let y=0;y<1024;y+=30)for(let x=0;x<1024;x+=30){
   g.strokeStyle=pick(['#9e735b','#6e5149','#59493b','#af9472','#524a46']);
   g.globalAlpha=.35+rnd()*.32;g.lineWidth=2+rnd()*3;
   g.strokeRect(x+3,y+3,24,24);
   if(rnd()>.55){g.beginPath();g.moveTo(x+15,y+2);g.lineTo(x+27,y+15);g.lineTo(x+15,y+27);g.lineTo(x+3,y+15);g.closePath();g.stroke()}
  }
  g.globalAlpha=1;g.lineWidth=12;g.strokeStyle='#9b7f61';g.strokeRect(37,37,950,950);
  g.lineWidth=14;g.strokeStyle='#392c26';g.strokeRect(58,58,908,908);
  grime(g,1024,1024,7500,.24);return tex(c);
 }
 function leaf(){
  const[c,g]=canvas(64,128);g.clearRect(0,0,64,128);
  g.fillStyle='#6d8655';g.beginPath();g.moveTo(32,120);
  g.bezierCurveTo(4,93,4,37,33,7);
  g.bezierCurveTo(65,37,62,90,32,120);g.fill();
  g.strokeStyle='#b2bf75';g.globalAlpha=.65;g.lineWidth=2;g.beginPath();g.moveTo(32,119);g.lineTo(33,17);g.stroke();
  g.globalAlpha=1;return tex(c);
 }
 function grass(){
  const[c,g]=canvas(256,256);
  const shades=['#788d54','#5e7a4d','#94a56b','#536c45','#889c60'];
  for(let i=0;i<80;i++){
   const root=105+rnd()*45,tip=root+(rnd()-.5)*215,h=80+rnd()*164;
   g.fillStyle=pick(shades);g.globalAlpha=.52+rnd()*.45;
   g.beginPath();g.moveTo(root-3,256);
   g.quadraticCurveTo(root+(tip-root)*.15,256-h*.45,tip,256-h);
   g.quadraticCurveTo(tip+2,256-h*.52,root+3,256);g.fill();
  }g.globalAlpha=1;return tex(c);
 }
 function moss(){
  const[c,g]=canvas(512);
  for(let i=0;i<14000;i++){
   const x=rnd()*512,y=rnd()*512,nx=(x-256)/250,ny=(y-256)/250;
   const angle=Math.atan2(ny,nx),radius=Math.hypot(nx,ny);
   if(radius>.58+.15*Math.sin(angle*13)+.1*Math.sin(angle*27))continue;
   g.globalAlpha=.04+rnd()*.37;g.fillStyle=pick(['#334b30','#5c7544','#7a8553','#a5a177','#182f28']);
   g.beginPath();g.arc(x,y,1+rnd()*9,0,6.28);g.fill();
  }g.globalAlpha=1;return tex(c);
 }
 function rust(){
  const[c,g]=canvas();g.fillStyle='#444d48';g.fillRect(0,0,512,512);
  for(let i=0;i<1700;i++){
   g.fillStyle=pick(['#994f32','#724831','#a16f46','#35352c','#9a8160']);
   g.globalAlpha=.13+rnd()*.7;g.beginPath();
   g.ellipse(rnd()*512,rnd()*512,2+rnd()*22,2+rnd()*35,rnd()*6,0,6.28);g.fill();
  }g.globalAlpha=1;return tex(c,1.5,1.5);
 }
 function paper(){
  const[c,g]=canvas();g.fillStyle='#bdb29a';g.fillRect(0,0,512,512);
  grime(g,512,512,1200,.1);return tex(c);
 }
 const wallMap=wall(),woodMap=wood(),clothMap=cloth('#4b5946'),rugMap=rug();
 const matte=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.9,metalness:0,...extra});
 const stone=matte('#94948a',{map:wallMap,roughness:.99,bumpMap:wallMap,bumpScale:.026});
 const plank=matte('#d5c4a8',{map:woodMap,roughness:.88,bumpMap:woodMap,bumpScale:.025});
 const furniture=matte('#baa78d',{map:woodMap,roughness:.83,bumpMap:woodMap,bumpScale:.021});
 const greenSofa=matte('#b0b4a0',{map:clothMap,roughness:1,bumpMap:clothMap,bumpScale:.018});
 const wornChair=matte('#9c8b78',{map:cloth('#6f4d3d'),roughness:.98});
 const wallpaper=matte('#c0b6a5',{map:wallMap,roughness:1,bumpMap:wallMap,bumpScale:.024});
 const m={
  plaster:wallpaper,ceiling:stone,plank,furniture,sofa:greenSofa,chair:wornChair,
  brick:matte('#76544b',{roughness:.95}),darkWood:matte('#4e3326',{map:woodMap,roughness:.84}),
  rust:matte('#b9a7a1',{map:rust(),roughness:.9,metalness:.16}),
  metal:matte('#54605b',{metalness:.66,roughness:.58}),black:matte('#272d29',{roughness:.9}),
  trim:matte('#b3a890'),dust:matte('#9c9180'),ceramic:matte('#aaa99b',{roughness:.4}),
  paper:matte('#f2e4c9',{map:paper(),roughness:1}),glass:new T.MeshPhysicalMaterial({
   color:'#a2b6ad',roughness:.12,metalness:0,transmission:.82,transparent:true,opacity:.49,depthWrite:false,side:T.DoubleSide
  }),
  windowShade:matte('#7a705d',{map:cloth('#b9b09c'),side:T.DoubleSide,transparent:true,opacity:.68}),
  leaf:matte('#8aa173',{map:leaf(),transparent:true,alphaTest:.12,side:T.DoubleSide,depthWrite:false}),
  grass:matte('#b1be91',{map:grass(),transparent:true,alphaTest:.13,side:T.DoubleSide,depthWrite:false}),
  moss:new T.MeshStandardMaterial({map:moss(),transparent:true,opacity:.97,depthWrite:false,side:T.DoubleSide,roughness:1,polygonOffset:true,polygonOffsetFactor:-1}),
  rug:matte('#999087',{map:rugMap,side:T.DoubleSide,roughness:1}),
  darkGlass:new T.MeshPhysicalMaterial({color:'#566b64',metalness:.24,roughness:.17,transparent:true,opacity:.55,depthWrite:false}),
  gold:matte('#998466',{metalness:.5,roughness:.5}),soot:matte('#201e1b'),
  stone2:matte('#6d7068',{roughness:.98})
 };
 return{m,rnd,pick,matte,tex,canvas,cloth};
}
