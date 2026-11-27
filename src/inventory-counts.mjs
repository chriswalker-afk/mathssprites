/** Count plaques are annotations, not physical objects.
 * Keep the SAME plaque node (including the live crate count) but move it
 * outside the transformed floor. Do not duplicate labels or tokens.
 * The containing room is replaced on redraw, so old badges never linger.
 */
const badgeSelector=".weight-stack-count,.crate-stack-count,.fw-count-plaque";
export function liftInventoryCounts(room,sources){
  const labels=sources.flatMap(source=>[...source.querySelectorAll(badgeSelector)]);
  let rail=room.querySelector(":scope > .inventory-counts");
  if(labels.length){
    if(!rail){
      rail=room.ownerDocument.createElement("div");
      rail.className="inventory-counts";
      room.append(rail);
    }
    for(const label of labels)rail.append(label);
  }
  return rail;
}
export function inventoryCountInset(room){
  const rail=room?.querySelector(":scope > .inventory-counts");
  return rail?.children.length?rail.offsetHeight+6:0;
}
