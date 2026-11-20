/**
 * World 2 guided curriculum: five four-level chapters.
 * [title, west counts, east counts, positive solution, solution route, hint]
 * Count order: black, white, brass weight, balloon.
 */
export const OPPOSITE_GUIDED_RAW=[
 ["One rising balloon",[1,0,0,1],[0,0,3,0],4,"add:posOne:1","A balloon and a weight have opposite values. Imagine them together."],
 ["A pair of balloons",[1,0,0,2],[0,0,3,0],5,"add:posOne:2","The number of balloons matters, but neither chamber can be changed alone."],
 ["The eastern lift",[0,0,2,0],[1,0,0,3],5,"add:posOne:3","A lone sprite can finish in the eastern room too."],
 ["Four floating friends",[1,0,0,4],[0,0,2,0],6,"add:posOne:4","Each balloon needs an opposite weight before it can disappear."],
 ["First white visitor",[1,0,0,0],[0,1,6,0],3,"add:posX:1|divide:2","A pale sprite means the opposite of a dark one. What happens when they meet?"],
 ["Two pale visitors",[2,0,1,0],[0,1,13,0],4,"add:posX:1|remove:posOne:1|divide:3","Could a dark sprite neutralise a pale visitor in the other room?"],
 ["A visitor on the right",[1,0,6,0],[0,1,14,0],4,"add:posX:1|remove:posOne:6|divide:2","Think about the pale sprite before deciding how to form groups."],
 ["Three against one",[2,0,5,0],[0,1,14,0],3,"add:posX:1|remove:posOne:5|divide:3","More dark sprites do not change what a white sprite represents."],
 ["Two kinds together",[1,0,0,1],[0,1,5,0],3,"add:posOne:1|add:posX:1|divide:2","There are two different kinds of opposites. Which pairs could disappear?"],
 ["Two sorts of visitors",[2,0,0,2],[0,1,10,0],4,"add:posOne:2|add:posX:1|divide:3","Look for both a balloon-and-weight pair and a white-and-dark sprite pair."],
 ["Three in the west",[3,0,0,2],[1,0,8,0],5,"add:posOne:2|add:negX:1|divide:2","Both numbers and sprites have opposites. What should be cleared first?"],
 ["The six-weight mystery",[3,0,0,4],[1,0,8,0],6,"add:posOne:4|add:negX:1|divide:2","Making one kind of zero pair may reveal another useful possibility."],
 ["Opposite arrival",[1,0,4,0],[0,1,12,0],4,"add:posX:1|remove:posOne:4|divide:2","Opposite sprites are valuable clues, even when they begin in different rooms."],
 ["The mirror is reversed",[0,1,13,0],[1,0,3,0],5,"add:posX:1|remove:posOne:3|divide:2","The remaining dark sprite need not finish in the western room."],
 ["Two dark, one pale",[2,0,0,3],[0,1,12,0],5,"add:posX:1|add:posOne:3|divide:3","There are opposites among sprites and weights. Which could cancel?"],
 ["The double opposite",[0,2,20,0],[2,0,4,0],4,"add:posX:2|remove:posOne:4|divide:4","The pale sprites affect the total just as much as the dark ones."],
 ["The clever shortcut",[4,0,0,4],[2,0,6,0],5,"add:posOne:4|add:negX:2|divide:2","Compare more than one possible route before choosing an operation."],
 ["Removing the negative",[3,0,0,2],[1,0,8,2],4,"remove:negOne:2|add:negX:1|divide:2","Taking away an opposite object is not the same as taking away its positive partner."],
 ["A crowded moonlit room",[4,0,0,1],[1,0,14,0],5,"add:posOne:1|add:negX:1|divide:3","The first attractive move is not always the shortest route."],
 ["Master of the opposites",[6,0,0,7],[3,0,8,0],5,"add:posOne:7|add:negX:3|divide:3","Look at both kinds of object before planning your sequence."]
];
