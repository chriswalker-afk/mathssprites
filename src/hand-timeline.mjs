/**
 * Pure timings for the articulated hand. A mathematical state change happens
 * exactly ONCE, during the contact beat, never while tiles are being staged.
 * The in-room box uses several discrete hand movements rather than a detached
 * single animated diagram.
 */
export const HAND_BEATS=Object.freeze({
  hover:510,descend:480,aim:190,
  frame:320,edge:420,column:450,quadratic:510,mixed:630,units:480,
  close:290,contact:450,lift:430,withdraw:680
});
export const HAND_BEATS_REDUCED=Object.freeze({
  hover:90,descend:110,aim:80,
  // Motion reduced: stationary snapshots remain long enough to notice each
  // construction region; no hopping, tracing or rapid flying movements.
  frame:210,edge:220,column:220,quadratic:250,mixed:280,units:250,
  close:90,contact:380,lift:115,withdraw:150
});

export const CROWBAR_BEATS=Object.freeze({
  hover:270,descend:355,aim:150,close:220,contact:390,lift:260,withdraw:330
});
export const CROWBAR_BEATS_REDUCED=Object.freeze({
  hover:95,descend:125,aim:95,close:105,contact:230,lift:95,withdraw:120
});

export function handMotionPlan(action,reducedMotion=false,area=null){
  if (!["add","remove","multiply","divide","square","sqrt","unpack"].includes(action?.op))
    throw new TypeError("Unknown laboratory hand action");
  const placing=["add","multiply","square"].includes(action.op);
  const timing=action.op==="unpack"
    ?(reducedMotion?CROWBAR_BEATS_REDUCED:CROWBAR_BEATS)
    :(reducedMotion?HAND_BEATS_REDUCED:HAND_BEATS);
  const geom=action.op==="square"||action.op==="sqrt";
  const hasArea=geom&&area&&area.side>0;
  const a=area?.kind==="mixed"?area.spriteSide:area?.symbolic?area.side:0;
  const b=area?.kind==="mixed"?area.weightSide:area&&!area.symbolic?area.side:0;
  const stageNames=!hasArea?[]:action.op==="square"
    ? ["frame","edge","column",
      ...(a?["quadratic"]:[]),...(a&&b?["mixed"]:[]),...(b?["units"]:[])]
    : ["frame",
      ...(b?["units"]:[]),...(a&&b?["mixed"]:[]),...(a?["quadratic"]:[]),
      "column","edge"];
  return {
    placing,cargoOnApproach:placing,
    phases:[
      {name:"approach",delay:timing.hover},
      {name:"reach",delay:timing.descend},
      {name:"aim",delay:timing.aim},
      ...stageNames.map(name=>({name,delay:timing[name]})),
      {name:"grip",delay:timing.close},
      {name:"contact",delay:timing.contact,applyChange:true},
      {name:"lift",delay:timing.lift},
      {name:"exit",delay:timing.withdraw}
    ]
  };
}
