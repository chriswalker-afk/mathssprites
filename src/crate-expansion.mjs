/**
 * PR39 — A group has contents, not an algebra label printed on its wood.
 * Pure plans make the multiplication demonstration depend on the LIVE
 * number of remaining whole crates (two before division, one after).
 */
const positiveInteger=n=>Number.isInteger(n)&&n>=0&&n<=12;
const plural=(n,one,many=one+"s")=>n+" "+(n===1?one:many);
const productTerm=(n,variable)=>n===1?variable:String(n)+variable;

export function crateContentsDescription(value){
  const crate=value?.crates;
  if(!crate?.count)return "";
  const c=crate.contents||{};
  const pieces=[
    c.posX&&plural(c.posX,"sprite"),
    c.posOne&&plural(c.posOne,"weight"),
    c.negX&&plural(c.negX,"white sprite"),
    c.negOne&&plural(c.negOne,"balloon")
  ].filter(Boolean);
  return "Each crate: "+pieces.join(" + ");
}

export function crateExpansionPlan(value){
  const crates=value?.crates;
  if(!crates||!positiveInteger(crates.count)||crates.count<1)
    throw new RangeError("Expansion requires one or more sealed crates.");
  const {contents}=crates;
  const spritesPerCrate=contents?.posX||0;
  const weightsPerCrate=contents?.posOne||0;
  if(!positiveInteger(spritesPerCrate)||!positiveInteger(weightsPerCrate)||
     !spritesPerCrate||!weightsPerCrate||
     (contents.negX||0)||(contents.negOne||0)||(contents.posX2||0))
    throw new RangeError("This prototype demonstrates positive sprites and whole weights only.");
  const count=crates.count;
  const totalSprites=count*spritesPerCrate;
  const totalWeights=count*weightsPerCrate;
  const spriteUnit=productTerm(spritesPerCrate,"x");
  const spriteResult=productTerm(totalSprites,"x");
  const spriteMath=count+" × "+spriteUnit+" = "+spriteResult;
  const weightMath=count+" × "+weightsPerCrate+" = "+totalWeights;
  // In-room physical storyboard. All lids open sequentially, the creatures
  // emerge together, the wooden panels fold, the hidden weights become visible,
  // then weights tumble out as identifiable crate-by-crate packets.
  const physicalPhases=Object.freeze([
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({phase:"open",crateIndex})),
    Object.freeze({phase:"sprites-bouncing",count:totalSprites}),
    Object.freeze({phase:"sprites-landed",count:totalSprites}),
    Object.freeze({phase:"panels-falling"}),
    Object.freeze({phase:"weights-revealed",count:totalWeights}),
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"weights-tumbling",crateIndex,count:weightsPerCrate
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
    {phase:"sprite-total",count:totalSprites,math:spriteMath,
      description:plural(count,"crate")+" give "+plural(totalSprites,"sprite")+". "+spriteMath},
    ...Array.from({length:count},(_,crateIndex)=>Object.freeze({
      phase:"weights",crateIndex,count:weightsPerCrate,
      description:"Release "+plural(weightsPerCrate,"weight")+" together from crate "+(crateIndex+1)+"."
    })),
    {phase:"weight-total",count:totalWeights,math:weightMath,
      description:plural(count,"crate")+" give "+plural(totalWeights,"weight")+". "+weightMath},
    {phase:"settle",description:"The crates are empty. The same value is now shown as loose objects."}
  ];
  return Object.freeze({
    count,spritesPerCrate,weightsPerCrate,totalSprites,totalWeights,
    spriteMath,weightMath,sharedLabel:crateContentsDescription(value),
    physicalPhases,
    steps:Object.freeze(steps.map(s=>Object.freeze(s)))
  });
}

/** Used by the handwritten comic, where expansion is STILL one undoable
 * identity rewrite even though the children saw several visual beats. */
export function crateExpansionReplayNotes(value){
  const plan=crateExpansionPlan(value);
  const noun=plan.count===1?"One crate gives":"Two crates give";
  const fallback=plan.count>2?plan.count+" crates give":noun;
  return Object.freeze({
    opening:plan.count===1?"Open the remaining crate with a crowbar.":
      "Open each of the "+plan.count+" crates with a crowbar.",
    sprites:plan.spriteMath,
    weights:plan.weightMath,
    summary:fallback+" "+plural(plan.totalSprites,"sprite")+" and "+
      plan.count+" "+(plan.count===1?"group":"groups")+" of "+
      plural(plan.weightsPerCrate,"weight")+"."
  });
}
