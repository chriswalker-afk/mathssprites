/**
 * PR39/PR56 — a crate is a genuine physical group. The plan contains
 * counts for the four signed, whole-object kinds, without replacing the
 * existing positive-only World 1 scene and storyboard contracts.
 */
const KINDS=Object.freeze(["posX","negX","posOne","negOne"]);
const physicalInteger=n=>Number.isInteger(n)&&n>=0&&n<=12;
const plural=(n,one,many=one+"s")=>n+" "+(n===1?one:many);
const productTerm=(n,variable)=>n===1?variable:String(n)+variable;

export function crateContentsDescription(value){
  const crate=value?.crates;
  if(!crate?.count)return "";
  const c=crate.contents||{};
  const signed=!!(c.negX||c.negOne);
  const pieces=[
    c.posX&&plural(c.posX,signed?"dark sprite":"sprite"),
    c.posOne&&plural(c.posOne,"weight"),
    c.negX&&plural(c.negX,"white sprite"),
    c.negOne&&plural(c.negOne,"balloon")
  ].filter(Boolean);
  return "Each crate: "+pieces.join(" + ");
}

export function crateExpansionPlan(value){
  const crates=value?.crates;
  if(!crates||!physicalInteger(crates.count)||crates.count<1)
    throw new RangeError("Expansion requires one or more sealed crates.");
  const contents=crates.contents||{};
  const perCrate=Object.freeze(Object.fromEntries(
    KINDS.map(kind=>[kind,contents[kind]??0])));
  if(!KINDS.every(kind=>physicalInteger(perCrate[kind]))||
      (contents.posX2||0)!==0||
      !KINDS.some(kind=>perCrate[kind]>0))
    throw new RangeError("Crates may release only whole dark/white sprites, weights and balloons.");
  const count=crates.count;
  const totals=Object.freeze(Object.fromEntries(KINDS.map(kind=>[
    kind,count*perCrate[kind]
  ])));
  const spritesPerCrate=perCrate.posX;
  const whiteSpritesPerCrate=perCrate.negX;
  const weightsPerCrate=perCrate.posOne;
  const balloonsPerCrate=perCrate.negOne;
  const totalSprites=totals.posX;
  const totalWhiteSprites=totals.negX;
  const totalWeights=totals.posOne;
  const totalBalloons=totals.negOne;
  const signed=whiteSpritesPerCrate>0||balloonsPerCrate>0;
  const spriteUnit=productTerm(spritesPerCrate,"x");
  const spriteResult=productTerm(totalSprites,"x");
  const spriteMath=count+" × "+spriteUnit+" = "+spriteResult;
  const weightMath=count+" × "+weightsPerCrate+" = "+totalWeights;
  // For signed crates, both colours jump together. Later the signed units
  // tumble and float out after the panels fall. World 1 phase names and order
  // stay byte-for-byte equivalent to their existing reference storyboard.
  const physicalPhases=Object.freeze([
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({phase:"open",crateIndex})),
    Object.freeze({phase:"sprites-bouncing",
      count:totalSprites+totalWhiteSprites}),
    Object.freeze({phase:"sprites-landed",
      count:totalSprites+totalWhiteSprites}),
    Object.freeze({phase:"panels-falling"}),
    Object.freeze({phase:signed?"units-revealed":"weights-revealed"}),
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:signed?"units-tumbling":"weights-tumbling",crateIndex,
      count:weightsPerCrate+balloonsPerCrate
    })),
    Object.freeze({phase:"settle"})
  ]);
  const steps=[
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"open",crateIndex,
      description:"Open crate "+(crateIndex+1)+" of "+count+" using the crowbar."
    })),
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"sprites",crateIndex,count:spritesPerCrate,
      description:"Release the "+plural(spritesPerCrate,"sprite")+" from crate "+(crateIndex+1)+"."
    })),
    ...(!signed?[]:Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"white-sprites",crateIndex,count:whiteSpritesPerCrate,
      description:"Release the "+plural(whiteSpritesPerCrate,"white sprite")+" from crate "+(crateIndex+1)+"."
    }))),
    {phase:"sprite-total",count:totalSprites,math:spriteMath,
      description:plural(count,"crate")+" give "+plural(totalSprites,"sprite")+". "+spriteMath},
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"weights",crateIndex,count:weightsPerCrate,
      description:"Release "+plural(weightsPerCrate,"weight")+" from crate "+(crateIndex+1)+"."
    })),
    ...(!signed?[]:Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"balloons",crateIndex,count:balloonsPerCrate,
      description:"Release "+plural(balloonsPerCrate,"balloon")+" from crate "+(crateIndex+1)+"."
    }))),
    {phase:"weight-total",count:totalWeights,math:weightMath,
      description:plural(count,"crate")+" give "+plural(totalWeights,"weight")+". "+weightMath},
    {phase:"settle",description:"The crates are empty. The same value is now shown as loose objects."}
  ];
  return Object.freeze({
    count,signed,perCrate,totalByKind:totals,
    spritesPerCrate,whiteSpritesPerCrate,weightsPerCrate,balloonsPerCrate,
    totalSprites,totalWhiteSprites,totalWeights,totalBalloons,
    spriteMath,weightMath,sharedLabel:crateContentsDescription(value),
    physicalPhases,steps:Object.freeze(steps.map(s=>Object.freeze(s)))
  });
}

/** Positive World 1 replay notes remain unchanged; signed notes describe the
 * physical four kinds of contents without replacing the real algebra model. */
export function crateExpansionReplayNotes(value){
  const plan=crateExpansionPlan(value);
  const noun=plan.count===1?"One crate gives":"Two crates give";
  const fallback=plan.count>2?plan.count+" crates give":noun;
  const summary=plan.signed
    ?fallback+" "+[
      plan.totalSprites&&plural(plan.totalSprites,"dark sprite"),
      plan.totalWhiteSprites&&plural(plan.totalWhiteSprites,"white sprite"),
      plan.totalWeights&&plural(plan.totalWeights,"weight"),
      plan.totalBalloons&&plural(plan.totalBalloons,"balloon")
    ].filter(Boolean).join(", ")+"."
    :fallback+" "+plural(plan.totalSprites,"sprite")+" and "+
      plan.count+" "+(plan.count===1?"group":"groups")+" of "+
      plural(plan.weightsPerCrate,"weight")+".";
  return Object.freeze({
    opening:plan.count===1?"Open the remaining crate with a crowbar.":
      "Open each of the "+plan.count+" crates with a crowbar.",
    sprites:plan.spriteMath,weights:plan.weightMath,summary
  });
}
