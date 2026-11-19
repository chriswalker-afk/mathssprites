/** World 2 Independent: four chapters of four puzzles each. */
export const OPPOSITE_INDEPENDENT_RAW=[
 ["First independent lift",[1,0,0,2],[0,0,4,0],6,"add:posOne:2","Place two matching weights, one room at a time; do not leave the balance tilted."],
 ["Three matching weights",[1,0,0,3],[0,0,2,0],5,"add:posOne:3","Whatever happens to the west, the east must receive the same operation."],
 ["The opposite direction",[0,0,6,0],[1,0,0,2],8,"add:posOne:2","The unknown is in the east; starting in either chamber is allowed."],
 ["The careful carrier",[1,0,0,4],[0,0,3,0],7,"add:posOne:4","An action matches when the object, count and operation agree."],
 ["Cancel from both rooms",[2,0,2,0],[1,0,7,0],5,"add:negX:1|remove:posOne:2","White sprites make different zero pairs in the two rooms."],
 ["A balloon shortcut",[1,0,3,0],[0,0,11,0],8,"add:negOne:3","Three negative units added to BOTH chambers cancel existing weights."],
 ["One white, two dark",[1,0,5,0],[0,1,15,0],5,"add:posX:1|remove:posOne:5|divide:2","Clear the white sprite with a dark one; then make two whole groups."],
 ["East and west reversed",[0,1,12,0],[1,0,4,0],4,"add:posX:1|remove:posOne:4|divide:2","A white sprite in the west does not mean the unknown has a negative value."],
 ["Two signed groups",[2,0,0,2],[0,0,6,0],4,"add:posOne:2|divide:2","Remove the balloons by cancellation before sharing two complete baskets."],
 ["Three groups after lifting",[3,0,0,3],[0,0,9,0],4,"add:posOne:3|divide:3","The hand must complete the same action separately in both rooms."],
 ["The double difference",[3,0,0,1],[1,0,9,0],5,"add:posOne:1|add:negX:1|divide:2","Use both kinds of zero pair, then share into two groups."],
 ["Across the signed hall",[2,0,0,5],[0,1,10,0],5,"add:posX:1|add:posOne:5|divide:3","Cancel the white sprite and balloons before making three baskets."],
 ["Four sprites, two balloons",[4,0,0,2],[2,0,8,0],5,"add:posOne:2|add:negX:2|divide:2","Try choosing the order of two mathematically valid cancellations."],
 ["The moonlit route",[3,0,0,4],[1,0,8,0],6,"add:posOne:4|add:negX:1|divide:2","Match the hand's first visit, even if zero pairs form only in one room."],
 ["Subtracting a negative",[0,0,9,2],[1,0,0,2],9,"remove:negOne:2","Removing a balloon subtracts a negative number, not a positive weight."],
 ["Two pale sprites",[0,2,25,0],[3,0,5,0],4,"add:posX:2|remove:posOne:5|divide:5","Cancel the two white sprites, clear five weights, then divide by five."]
];
