/** Exact JSON-safe reduced rational pairs; BigInt is used only for arithmetic intermediates. */
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;}
function reduce(n,d){
  if(d===0n)throw new RangeError("Zero denominator");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  const nn=Number(n),dd=Number(d);
  if(!Number.isSafeInteger(nn)||!Number.isSafeInteger(dd))throw new RangeError("Rational outside safe serialization range");
  return Object.freeze({n:nn,d:dd});
}
export function rational(value, denominator){
  let n,d;
  if(denominator!==undefined){n=value;d=denominator;}
  else if(typeof value==="number"){n=value;d=1;}
  else if(value&&typeof value==="object"){({n,d}=value);}
  if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d))throw new TypeError("Use integer numerator and denominator, not decimal approximations");
  return reduce(BigInt(n),BigInt(d));
}
export function radd(a,b){a=rational(a);b=rational(b);return reduce(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));}
export function rsub(a,b){a=rational(a);b=rational(b);return reduce(BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));}
export function rmul(a,b){a=rational(a);b=rational(b);return reduce(BigInt(a.n)*BigInt(b.n),BigInt(a.d)*BigInt(b.d));}
export function rdiv(a,b){a=rational(a);b=rational(b);return reduce(BigInt(a.n)*BigInt(b.d),BigInt(a.d)*BigInt(b.n));}
export function rcompare(a,b){a=rational(a);b=rational(b);const difference=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return difference<0n?-1:difference>0n?1:0;}
export function req(a,b){return rcompare(a,b)===0;}
export function rtext(a){a=rational(a);return a.d===1?String(a.n):`${a.n}/${a.d}`;}
