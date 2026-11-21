/** World 2 Independent: five four-level chapters (PR58 adds signed crates). */
export const OPPOSITE_INDEPENDENT_RAW=[
 ["First independent lift",[1,0,0,2],[0,0,4,0],6,"add:posOne:2","A signed change must be repeated in the other room before the step is finished."],
 ["Three matching weights",[1,0,0,3],[0,0,2,0],5,"add:posOne:3","Two rooms can react differently to exactly the same hand action."],
 ["The opposite direction",[0,0,6,0],[1,0,0,2],8,"add:posOne:2","The lone sprite can finish in the eastern room."],
 ["The careful carrier",[1,0,0,4],[0,0,3,0],7,"add:posOne:4","Consider how weights and balloons affect one another."],
 ["Matching the white visitor",[2,0,0,0],[0,1,9,0],3,"add:posX:1|divide:3","A white sprite might disappear in one room while the other gains a dark one."],
 ["A balloon shortcut",[2,0,3,0],[0,0,13,2],4,"add:negOne:3|divide:2","The same signed move can create different zero pairs in each room."],
 ["One white, two dark",[1,0,5,0],[0,1,15,0],5,"add:posX:1|remove:posOne:5|divide:2","Look at the pale sprite before deciding how to share whole objects."],
 ["East and west reversed",[0,1,12,0],[1,0,4,0],4,"add:posX:1|remove:posOne:4|divide:2","Which room should eventually contain the lone dark sprite?"],
 ["Two signed groups",[2,0,0,2],[0,0,6,0],4,"add:posOne:2|divide:2","A balanced split cannot leave half a sprite or balloon behind."],
 ["Three groups after lifting",[3,0,0,3],[0,0,9,0],4,"add:posOne:3|divide:3","Every object left after cancellation must fit into whole equal groups."],
 ["The double difference",[3,0,0,1],[1,0,9,0],5,"add:posOne:1|add:negX:1|divide:2","Variable and constant opposites may both need attention before sharing."],
 ["Across the signed hall",[2,0,0,5],[0,1,10,0],5,"add:posX:1|add:posOne:5|divide:3","Two hand visits must match even if the resulting rooms look different."],
 ["Four sprites, two balloons",[4,0,0,2],[2,0,8,0],5,"add:posOne:2|add:negX:2|divide:2","Several routes may work; compare their complete pairs of hand visits."],
 ["The moonlit route",[3,0,0,4],[1,0,8,0],6,"add:posOne:4|add:negX:1|divide:2","One operation can simplify the two rooms in different ways."],
 ["Subtracting a negative",[4,0,0,3],[2,0,12,3],6,"remove:negOne:3|add:negX:2|divide:2","Taking away a balloon has a different numerical effect from taking away a weight."],
 ["Two pale sprites",[0,2,25,0],[3,0,5,0],4,"add:posX:2|remove:posOne:5|divide:5","The white sprites count negatively, but the mystery weight remains positive."],
 // New sealed-group chapter. Independent students still match EACH genuine
 // algebraic operation in the two chambers; unpacking changes representation
 // within only one chamber, even though it is recorded as a checked step.
 ["The careful unsealing",[0,0,2,0],[0,0,8,0],4,
   "divide:2|unpack:left",
   "Whole groups may be divided before opening. Watch what is still loose.",
   {crates:{count:2,contents:{posX:1,negOne:1}}}],
 ["Visitors outside the crate",[1,1,0,0],[0,0,12,0],5,
   "divide:3|unpack:left|add:posOne:1",
   "A black and a white sprite can meet without changing the sealed groups.",
   {crates:{count:3,contents:{posX:1,negOne:1}}}],
 ["East-side surprises",[1,0,3,0],[0,0,0,0],5,
   "unpack:right|remove:posX:1|add:posOne:2",
   "Sometimes the unopened groups belong to the eastern room.",
   {rightCrates:{count:2,contents:{posX:1,negOne:1}}}],
 ["Two hands, sealed negatives",[1,0,3,0],[1,0,11,0],6,
   "unpack:left|remove:posX:1|add:posOne:1|divide:2",
   "Choose when to reveal negative objects; then make each matching hand move.",
   {crates:{count:2,contents:{posX:1,negOne:2}}}]
];
