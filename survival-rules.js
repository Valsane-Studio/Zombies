/* Règles d'équilibrage indépendantes du rendu. */
export const WEAPONS={
  pistol:{name:'PISTOLET',caliber:'9 MM',magazine:12,damage:27,rate:2.2,range:15,accuracy:.83,noise:29,reload:1.5,falloff:.015},
  carbine:{name:'CARABINE',caliber:'5,56 MM',magazine:25,damage:35,rate:3.2,range:26,accuracy:.8,noise:41,reload:2.25,falloff:.008},
  shotgun:{name:'FUSIL À POMPE',caliber:'CAL. 12',magazine:6,damage:82,rate:.7,range:9,accuracy:.92,noise:45,reload:2.6,falloff:.038}
};
export const MODES={
  sneak:{name:'ACCROUPI',speed:2.0,footstep:2.2,stamina:5,accuracy:.09,awareness:-.1},
  walk:{name:'MARCHE',speed:3.7,footstep:6.8,stamina:6,accuracy:0,awareness:0},
  sprint:{name:'COURSE',speed:6.0,footstep:17,stamina:-15,accuracy:-.28,awareness:.25}
};
export function profile(p,world,cover=false){
  const w=WEAPONS[p.weapon]||WEAPONS.pistol;
  const high=world.heightAt(p.x,p.z)>1.5;
  const mode=MODES[p.mode]||MODES.walk;
  const accuracy=Math.min(.97,Math.max(.21,w.accuracy+mode.accuracy+(high?.05:0)+(cover?.12:0)-(p.walking?.12:0)-(p.stamina<18?.12:0)));
  const range=w.range+(high?4:0);
  const rate=w.rate*(cover?1.19:1)*(p.stamina<15?.82:1);
  return{...w,accuracy,range,rate,cover,high};
}
export function canUseMedkit(p){return!!(p.alive&&p.medkits>0&&p.hp<p.maxHp&&p.action===null)}
export function remainingAmmo(p){
  return p.ammo+p.reserve;
}
