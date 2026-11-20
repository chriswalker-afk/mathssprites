/**
 * World 2 guided curriculum: five four-level chapters.
 * [title, west counts, east counts, positive solution, solution route, hint]
 * Count order: black, white, brass weight, balloon.
 */
export const OPPOSITE_GUIDED_RAW=[
 ["One rising balloon",[1,0,0,1],[0,0,3,0],4,"add:posOne:1","Add one weight to both chambers; watch the balloon lift its partner."],
 ["A pair of balloons",[1,0,0,2],[0,0,3,0],5,"add:posOne:2","Each balloon needs one opposite brass weight. Make two zero pairs."],
 ["The eastern lift",[0,0,2,0],[1,0,0,3],5,"add:posOne:3","The final sprite may stay in the east. Match three added weights."],
 ["Four floating friends",[1,0,0,4],[0,0,2,0],6,"add:posOne:4","Count the four balloons; each one can lift exactly one weight."],
 ["First white visitor",[1,0,0,0],[0,1,6,0],3,"add:posX:1|divide:2","A white sprite has the opposite effect of a dark sprite. How could they meet?"],
 ["Two pale visitors",[2,0,1,0],[0,1,13,0],4,"add:posX:1|remove:posOne:1|divide:3","Watch what happens to the white sprite when a matching dark one arrives."],
 ["A visitor on the right",[1,0,6,0],[0,1,14,0],4,"add:posX:1|remove:posOne:6|divide:2","A dark sprite will meet the white one. Then clear and share."],
 ["Three against one",[2,0,5,0],[0,1,14,0],3,"add:posX:1|remove:posOne:5|divide:3","Make a sprite zero pair before creating three complete baskets."],
 ["Two kinds together",[1,0,0,1],[0,1,5,0],3,"add:posOne:1|add:posX:1|divide:2","Both a balloon and a white sprite are present. Look for two different zero pairs."],
 ["Two sorts of visitors",[2,0,0,2],[0,1,10,0],4,"add:posOne:2|add:posX:1|divide:3","The two signs represent different kinds of opposites. What would each cancel?"],
 ["Three in the west",[3,0,0,2],[1,0,8,0],5,"add:posOne:2|add:negX:1|divide:2","Clear the balloons, cancel one dark sprite, then divide by two."],
 ["The six-weight mystery",[3,0,0,4],[1,0,8,0],6,"add:posOne:4|add:negX:1|divide:2","Two different cancellations make the eventual whole baskets possible."],
 ["Opposite arrival",[1,0,4,0],[0,1,12,0],4,"add:posX:1|remove:posOne:4|divide:2","Add a dark sprite where the white one is waiting."],
 ["The mirror is reversed",[0,1,13,0],[1,0,3,0],5,"add:posX:1|remove:posOne:3|divide:2","The final dark sprite can end up on the right."],
 ["Two dark, one pale",[2,0,0,3],[0,1,12,0],5,"add:posX:1|add:posOne:3|divide:3","Use one dark sprite and three weights before dividing."],
 ["The double opposite",[0,2,20,0],[2,0,4,0],4,"add:posX:2|remove:posOne:4|divide:4","Two white sprites can meet two dark visitors; then share four ways."],
 ["The clever shortcut",[4,0,0,4],[2,0,6,0],5,"add:posOne:4|add:negX:2|divide:2","Lift four balloons, cancel the shared dark sprites, then halve."],
 ["Removing the negative",[3,0,0,2],[1,0,8,2],4,"remove:negOne:2|add:negX:1|divide:2","There are balloons in both rooms. Taking away a negative is different from taking away a weight."],
 ["A crowded moonlit room",[4,0,0,1],[1,0,14,0],5,"add:posOne:1|add:negX:1|divide:3","Add a weight, then an opposite sprite, then make three equal groups."],
 ["Master of the opposites",[6,0,0,7],[3,0,8,0],5,"add:posOne:7|add:negX:3|divide:3","The hand can clear the seven balloons, then cancel three sprite terms."]
];
