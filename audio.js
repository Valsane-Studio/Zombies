/* ZONE ZÉRO — Audio procédural, sans fichiers son externes. */
export function createSoundscape(){
  let context=null,master=null,noiseBuffer=null,muted=false;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  function setup(){
    if(context||!AudioCtor)return;
    try{
      context=new AudioCtor();
      master=context.createGain();master.gain.value=muted?0:.62;
      const limiter=context.createDynamicsCompressor();
      limiter.threshold.value=-15;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.002;limiter.release.value=.16;
      master.connect(limiter);limiter.connect(context.destination);
      const duration=2.5,rate=context.sampleRate;
      noiseBuffer=context.createBuffer(1,Math.round(duration*rate),rate);
      const data=noiseBuffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
      // Souffle du vent et ronflement mécanique en fond, très discrets.
      const wind=context.createBufferSource();wind.buffer=noiseBuffer;wind.loop=true;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=220;
      const windVolume=context.createGain();windVolume.gain.value=.075;
      wind.connect(filter);filter.connect(windVolume);windVolume.connect(master);wind.start();
      const hum=context.createOscillator();hum.type='sine';hum.frequency.value=52;
      const humVolume=context.createGain();humVolume.gain.value=.022;
      hum.connect(humVolume);humVolume.connect(master);hum.start();
      const wobble=context.createOscillator();wobble.type='sine';wobble.frequency.value=.12;
      const amount=context.createGain();amount.gain.value=.018;
      wobble.connect(amount);amount.connect(windVolume.gain);wobble.start();
    }catch(e){context=null;master=null}
  }
  function unlock(){
    setup();
    if(context&&context.state!=='running')context.resume().catch(()=>{});
  }
  function gainAt(start,peak,attack,release){
    const g=context.createGain();
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak),start+Math.max(.001,attack));
    g.gain.exponentialRampToValueAtTime(.0001,start+release);
    g.connect(master);return g;
  }
  function noise(frequency,q,peak,attack,duration,type='bandpass'){
    if(!context||context.state!=='running'||muted)return;
    const t=context.currentTime;
    const source=context.createBufferSource();source.buffer=noiseBuffer;
    source.playbackRate.value=.95+Math.random()*.18;
    const filter=context.createBiquadFilter();filter.type=type;
    filter.frequency.value=frequency;filter.Q.value=q;
    const volume=gainAt(t,peak,attack,duration);
    source.connect(filter);filter.connect(volume);
    source.start(t,Math.random()*1.4,duration+.03);source.stop(t+duration+.04);
  }
  function tone(freq,fall,peak,duration,wave='sine'){
    if(!context||context.state!=='running'||muted)return;
    const t=context.currentTime,o=context.createOscillator();
    o.type=wave;o.frequency.setValueAtTime(freq,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,fall),t+duration);
    const g=gainAt(t,peak,.002,duration);
    o.connect(g);o.start(t);o.stop(t+duration+.01);
  }
  function shoot(weapon='pistol'){
    if(weapon==='shotgun'){
      noise(530,.58,.29,.001,.17);noise(125,.7,.21,.002,.26,'lowpass');tone(115,41,.095,.26,'sawtooth');
    }else if(weapon==='carbine'){
      noise(1400+Math.random()*300,.66,.18,.001,.062);noise(260,.7,.12,.001,.08,'lowpass');tone(260,90,.05,.08,'square');
    }else{
      noise(1050+Math.random()*250,.48,.18,.001,.082);noise(190,.72,.13,.001,.12,'lowpass');tone(155,64,.068,.105,'triangle');
    }
  }
  function step(mode='walk'){
    noise(mode==='sneak'?270:mode==='sprint'?590:400,.8,mode==='sneak'?.023:.036,.004,mode==='sprint'?.1:.075,'lowpass');
  }
  function reload(){noise(900,1.2,.035,.006,.15);tone(350,160,.023,.13,'triangle')}
  function pickup(){tone(600,740,.045,.12,'sine');tone(490,620,.018,.2,'triangle')}
  function decoy(){noise(2600,1.4,.12,.001,.18);noise(1050,1.6,.09,.01,.29);tone(830,190,.05,.22,'triangle')}
  function impact(){noise(450,1.1,.10,.002,.085);tone(120,75,.02,.06)}
  function death(){noise(175,.8,.08,.018,.24,'lowpass');tone(85,43,.045,.24,'sawtooth')}
  function startWave(){tone(220,140,.028,.25,'triangle')}
  function setMuted(value){
    muted=!!value;if(master&&context){master.gain.setTargetAtTime(muted?0:.62,context.currentTime,.03)}
    return muted;
  }
  return {unlock,shoot,step,reload,pickup,decoy,impact,death,startWave,setMuted,get muted(){return muted}};
}
