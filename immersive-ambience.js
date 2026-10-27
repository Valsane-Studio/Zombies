/* ZONE ZÉRO — ambiance sonore discrète et non musicale.
   Démarrage après geste utilisateur (politique autoplay), synthèse locale Web Audio.
   Vent, frottements métalliques, pas, portes, grincements et silence d'intérieur. */
export function createImmersiveAmbience({host=window}={}){
 const AudioCtor=host.AudioContext||host.webkitAudioContext;
 let ctx=null,enabled=true,started=false,stepClock=0,wind=null,windGain=null,windFilter=null,phase=0;
 function noiseBuffer(seconds=1.75){
  const size=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(1,size,ctx.sampleRate);
  const a=b.getChannelData(0);
  let seed=17313;
  for(let i=0;i<size;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;a[i]=((seed>>>0)/2147483648-1)*.8}
  return b;
 }
 let noise=null;
 function ensure(){
  if(!enabled||!AudioCtor)return false;
  try{
   if(!ctx){ctx=new AudioCtor();noise=noiseBuffer()}
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   if(!started){
    started=true;
    wind=ctx.createBufferSource();wind.buffer=noise;wind.loop=true;
    windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=340;
    windGain=ctx.createGain();windGain.gain.value=0;
    wind.connect(windFilter);windFilter.connect(windGain);windGain.connect(ctx.destination);
    wind.start();
   }
   return true;
  }catch{return false}
 }
 function switchOnOff(v){
  enabled=Boolean(v);
  if(enabled)ensure();
  if(windGain&&ctx)windGain.gain.setTargetAtTime(enabled?.055:0,ctx.currentTime,.20);
  return enabled;
 }
 function transient(kind='step',intensity=1){
  if(!started||!enabled||!ctx)return;
  try{
   const t=ctx.currentTime;
   const duration=kind==='door'?.55:kind==='metal'?1.1:kind==='paper'?.28:kind==='window'?.45:.14;
   const source=ctx.createBufferSource();source.buffer=noise;
   const filter=ctx.createBiquadFilter();
   filter.type='bandpass';
   filter.frequency.value=kind==='step'?(950+Math.random()*550):kind==='paper'?2200:kind==='metal'?730:kind==='window'?1500:620;
   filter.Q.value=kind==='metal'?1.7:.68;
   const gain=ctx.createGain(),amount=(kind==='step'?.045:kind==='door'?.085:kind==='metal'?.055:.05)*intensity;
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.linearRampToValueAtTime(amount,t+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
   source.start(t,0);source.stop(t+Math.min(duration,noise.duration));
   if(kind==='metal'||kind==='door'||kind==='window'){
    const osc=ctx.createOscillator(),oscAmp=ctx.createGain();
    osc.type=kind==='metal'?'sine':'triangle';
    const freq=kind==='metal'?410:kind==='window'?235:130;
    osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(55,freq*.64),t+duration);
    oscAmp.gain.setValueAtTime(.001,t);
    oscAmp.gain.linearRampToValueAtTime(kind==='metal'?.019:.022,t+.04);
    oscAmp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(oscAmp);oscAmp.connect(ctx.destination);osc.start(t);osc.stop(t+duration+.02);
   }
  }catch{}
 }
 function cue(action){
  if(!ensure())return;
  transient(
   ['entrance','aptDoor','blocked'].includes(action)?'door':
   ['stairsUp','stairsDown','roofUp','roofDown'].includes(action)?'step':
   action==='window'?'window':
   action==='note'?'paper':'metal',.92
  );
 }
 function update(dt,{moving=false,running=false,inside=false,level=0}={}){
  if(!started||!enabled||!ctx)return;
  phase+=dt;
  if(windGain){
   const target=inside?.018:.048;
   windGain.gain.setTargetAtTime(target*(1+.12*Math.sin(phase*.43)),ctx.currentTime,.32);
   windFilter.frequency.setTargetAtTime(inside?190:365+55*Math.sin(phase*.27),ctx.currentTime,.8);
  }
  if(moving){
   stepClock+=dt;
   const interval=running?.27:.43;
   if(stepClock>interval){stepClock%=interval;transient('step',inside?.8:1)}
  }else stepClock=0;
 }
 return {activate:ensure,update,cue,setEnabled:switchOnOff,get enabled(){return enabled},get started(){return started}};
}
