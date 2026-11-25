/** Exact independent breadth-first search, with no engine calls.
 * The finite graph contains six nonnegative whole-object counts in
 * [0,48]. Each room has sum <=48. Equal add/remove by 1..12, exact
 * whole copies/shares by 2..5, valid complete squares and roots are all
 * legal edges. BFS enumerates every reachable shorter state, including
 * alternate routes, extra objects, reversed orientation and empty rooms.
 * Compare its certificate against actual engine witnesses in unit tests.
 */
const KINDS=["posX2","posX","posOne"];
const tuple=r=>KINDS.map(k=>r[k]??0);
const sum=r=>r[0]+r[1]+r[2];
const key=r=>r.reduce((n,v)=>n*64+v,0); // six 6-bit counts: exactly representable
const square=([a,b,c])=>a===0&&(b+c)**2<=48?[b*b,2*b*c,c*c]:null;
const root=([a,b,c])=>{
  const h=Math.sqrt(a),k=Math.sqrt(c);
  return Number.isInteger(h)&&Number.isInteger(k)&&b===2*h*k?[0,h,k]:null;
};
export function shortestSquareRoute(level,maxDepth,{maxVisited=Infinity}={}){
  if(!Number.isInteger(maxDepth)||maxDepth<1)throw new TypeError("Supply a finite witness depth");
  if(maxVisited!==Infinity&&(!Number.isSafeInteger(maxVisited)||maxVisited<1))throw new TypeError("Supply a positive search budget");
  const start=[...tuple(level.left),...tuple(level.right)];
  const goal=level.goal==="area"?[...tuple(level.target.left),...tuple(level.target.right)]:
    [0,1,0,0,0,level.solution];
  const goals=new Set([key(goal)]);
  if(level.goal!=="area")goals.add(key([...goal.slice(3),...goal.slice(0,3)]));
  if(goals.has(key(start)))return {moves:0,route:[],visited:1};
  const parents=new Map([[key(start),null]]);
  let frontier=[start];
  for(let depth=1;depth<=maxDepth;depth++){
    const next=[];
    for(const p of frontier){
      const from=key(p),L=p.slice(0,3),R=p.slice(3),max=Math.max(sum(L),sum(R));
      let found=null,budgetHit=false;
      function visit(z,action){
        const k=key(z);
        if(parents.has(k))return false;
        if(parents.size>=maxVisited){budgetHit=true;return false;}
        parents.set(k,{from,action});
        if(goals.has(k)){found=k;return true;}
        next.push(z);return false;
      }
      search: {
        for(let k=0;k<3;k++)for(let n=-Math.min(12,L[k],R[k]);n<=Math.min(12,48-max);n++){
          if(!n)continue;
          const z=p.slice();z[k]+=n;z[k+3]+=n;
          if(visit(z,{op:n>0?"add":"remove",kind:KINDS[k],count:Math.abs(n)}))break search;
        }
        for(let d=2;d<=5;d++){
          if(p.every(v=>v%d===0)&&visit(p.map(v=>v/d),{op:"divide",factor:d}))break search;
          if(max*d<=48&&visit(p.map(v=>v*d),{op:"multiply",factor:d}))break search;
        }
        for(const [op,fn] of [["square",square],["sqrt",root]]){
          const a=fn(L),b=fn(R);
          if(a&&b&&visit([...a,...b],{op}))break search;
        }
      }
      if(found!==null){
        const route=[];let k=found;
        while(parents.get(k)){const parent=parents.get(k);route.unshift(parent.action);k=parent.from;}
        return {moves:depth,route,visited:parents.size};
      }
      if(budgetHit)return null;
    }
    frontier=next;
    if(!frontier.length)break;
  }
  return null;
}
