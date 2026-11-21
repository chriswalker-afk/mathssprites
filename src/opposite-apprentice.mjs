/** World 2 paper-first Algebra Apprentice: four chapters of four puzzles. */
export const OPPOSITE_APPRENTICE_RAW=[
 ["The first signed line",[1,0,0,2],[0,0,3,0],5,"add:posOne:2","The editor needs a change to both sides, not the weight of the sprite."],
 ["A written lift",[1,0,0,4],[0,0,2,0],6,"add:posOne:4","Which sign represents a balloon, and which represents a brass weight?"],
 ["One signed group",[2,0,0,2],[0,0,8,0],5,"add:posOne:2|divide:2","Think about what must happen before a complete equal division is possible."],
 ["Your first signed strategy",[3,0,0,3],[0,0,12,0],5,"add:posOne:3|divide:3","A good algebraic line should correspond to a real move in each room."],
 ["Write a pale visitor",[2,0,3,0],[1,0,10,2],5,"add:negX:1|add:negOne:3","Use parentheses to distinguish adding a negative from subtracting a positive."],
 ["The variable, then weight",[3,0,0,1],[1,0,9,0],5,"add:negX:1|add:posOne:1|divide:2","A signed sprite term and a signed constant are different expressions."],
 ["White sprite on the right",[1,0,3,0],[0,1,13,0],5,"add:posX:1|add:negOne:3|divide:2","A negative variable term does not mean the sprite's weight is negative."],
 ["Take away the balloons",[3,0,0,4],[1,0,10,4],5,"remove:negOne:4|add:negX:1|divide:2","Subtracting a negative amount increases the expression's value."],
 ["Three different decisions",[3,0,0,3],[1,0,7,0],5,"add:posOne:3|add:negX:1|divide:2","Does your route account for both sorts of cancellation?"],
 ["The mirror equation",[0,1,18,0],[2,0,3,0],5,"add:posX:1|add:negOne:3|divide:3","The final lone sprite may appear on either side of the equals sign."],
 ["The crowded balance",[4,0,0,4],[1,0,11,0],5,"add:posOne:4|add:negX:1|divide:3","Write a legal change to both sides rather than jumping straight to the solution."],
 ["The final signed notebook",[0,2,26,0],[3,0,6,0],4,"add:posX:2|add:negOne:6|divide:5","Consider the entire sequence before committing your first written step."],
 // Paper first: the editor must preserve the bracketed physical group and
 // let the student explicitly choose "Expand west/east" as one checked step.
 ["A sealed signed line",[0,0,0,2],[0,0,10,0],5,
   "divide:2|unpack:left",
   "On paper, the closed group stays inside brackets until you choose to expand it.",
   {crates:{count:2,contents:{posX:1,posOne:1}}}],
 ["A white visitor inside",[0,0,0,0],[0,0,18,0],5,
   "divide:3|unpack:left|remove:posOne:1",
   "Inside a bracket, black and white sprites keep opposite signs.",
   {crates:{count:3,contents:{posX:2,negX:1,posOne:1}}}],
 ["Expand the eastern room",[1,0,4,0],[0,0,0,0],6,
   "unpack:right|remove:posX:1|add:posOne:2",
   "Decide which bracket needs opening; a lone sprite can finish on the right.",
   {rightCrates:{count:2,contents:{posX:1,negOne:1}}}],
 ["The full signed expression",[1,0,2,0],[1,0,12,0],6,
   "unpack:left|remove:posX:1|divide:2",
   "Notice how the terms inside the brackets differ from those outside them.",
   {crates:{count:2,contents:{posX:2,negX:1,negOne:1}}}]
];
