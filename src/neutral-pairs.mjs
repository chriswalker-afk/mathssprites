/**
 * Maths Sprites — zero is an observable PHYSICAL event.
 *
 * Pure, deterministic animation plan. Objects are integer counts, never
 * negative quantities in physical storage. Each event removes a matching
 * opposite pair while preserving the room's value for EVERY possible x.
 * The presentation layer uses these same events for animations and replay.
 *
 * The engine calls this BEFORE normalization. It does not mutate the source.
 */
const KINDS=["posX","negX","posX2","posOne","negOne"];
function clone(source={}) {
  return Object.fromEntries(KINDS.map(k=>[k,Number(source[k]||0)]));
}
export function neutralPairSequence(source,side="",onlyType=null) {
  const current=clone(source);
  const events=[];
  const species=[
    {type:"sprites",positive:"posX",negative:"negX",action:"mutual-hop"},
    {type:"constants",positive:"posOne",negative:"negOne",action:"balloon-lift"}
  ];
  for(const pair of species) {
    if(onlyType!==null&&onlyType!==pair.type)continue;
    const count=Math.min(current[pair.positive],current[pair.negative]);
    for(let i=0;i<count;i++){
      const before=clone(current);
      current[pair.positive]-=1;
      current[pair.negative]-=1;
      events.push({
        id:(side||"room")+":"+pair.type+":"+(i+1),
        side,type:pair.type,action:pair.action,
        positive:pair.positive,negative:pair.negative,
        index:i,count,
        before,after:clone(current)
      });
    }
  }
  return events;
}
/** No HTML or engine dependency. The zero-pair change cannot alter value. */
export function neutralPairValue(room,x) {
  const p=clone(room);
  return p.posX2*x*x+(p.posX-p.negX)*x+(p.posOne-p.negOne);
}
export function neutralPairSummary(events=[]) {
  const sprites=events.filter(e=>e.type==="sprites").length;
  const constants=events.filter(e=>e.type==="constants").length;
  const parts=[];
  if(sprites)parts.push(sprites+" black/white "+(sprites===1?"pair":"pairs"));
  if(constants)parts.push(constants+" weight/balloon "+(constants===1?"pair":"pairs"));
  return parts.join("; ");
}
