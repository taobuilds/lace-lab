function groups(mask,n){
 const labels=new Int32Array(mask.length).fill(-1),pieces=[];
 for(let i=0;i<mask.length;i++)if(mask[i]&&labels[i]<0){const id=pieces.length,queue=[i];labels[i]=id;for(let k=0;k<queue.length;k++){const p=queue[k],x=p%n,y=(p/n)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,q=yy*n+xx;if(xx>=0&&xx<n&&yy>=0&&yy<n&&mask[q]&&labels[q]<0){labels[q]=id;queue.push(q)}}}pieces.push(queue)}
 return {labels,pieces};
}
function thin(input,n){
 const mask=input.slice();let changed=true;
 while(changed){changed=false;for(let phase=0;phase<2;phase++){
  const remove=[];
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
   const p=y*n+x;if(!mask[p])continue;const a=[mask[p-n],mask[p-n+1],mask[p+1],mask[p+n+1],mask[p+n],mask[p+n-1],mask[p-1],mask[p-n-1]];
   const count=a.reduce((s,v)=>s+v,0);if(count<2||count>6)continue;
   let changes=0;for(let i=0;i<8;i++)if(!a[i]&&a[(i+1)%8])changes++;if(changes!==1)continue;
   if(phase===0?(a[0]*a[2]*a[4]||a[2]*a[4]*a[6]):(a[0]*a[2]*a[6]||a[0]*a[4]*a[6]))continue;remove.push(p);
  }for(const p of remove)mask[p]=0;if(remove.length)changed=true;
 }}return mask;
}
function connect(mask,n){
 const {labels,pieces}=groups(mask,n);if(pieces.length<=1)return 0;
 const parent=pieces.map((_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i;};
 const owner=labels.slice(),prev=new Int32Array(mask.length).fill(-1),queue=[];
 for(let i=0;i<mask.length;i++)if(mask[i])queue.push(i);
 let bridges=0;
 for(let k=0;k<queue.length;k++){
  const p=queue[k],x=p%n,y=(p/n)|0;
  for(const q of [x?p-1:-1,x<n-1?p+1:-1,y?p-n:-1,y<n-1?p+n:-1]){
   if(q<0)continue;
   if(owner[q]<0){owner[q]=owner[p];prev[q]=p;queue.push(q)}
   else {const a=root(owner[p]),b=root(owner[q]);if(a===b)continue;parent[b]=a;bridges++;
    for(const start of [p,q]){let t=start;while(t>=0&&!mask[t]){mask[t]=1;t=prev[t]}}
    if(bridges===pieces.length-1)return bridges;
   }
  }
 }return bridges;
}
function trace(mask,n){
 const nodes=new Map();
 for(let p=0;p<mask.length;p++)if(mask[p]){
  const x=p%n,y=(p/n)|0,adj=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy;if((!dx&&!dy)||xx<0||xx>=n||yy<0||yy>=n)continue;const q=yy*n+xx;
   if(mask[q]&&(!(dx&&dy)||(!mask[y*n+xx]&&!mask[yy*n+x])))adj.push(q);
  }nodes.set(p,adj);
 }
 const used=new Set(),paths=[],key=(p,q)=>p<q?p+':'+q:q+':'+p;
 const walk=(start,next)=>{const path=[start];let p=start,q=next;while(true){used.add(key(p,q));path.push(q);const adj=nodes.get(q);if(adj.length!==2||q===start)break;const r=adj[0]===p?adj[1]:adj[0];if(used.has(key(q,r)))break;p=q;q=r;}paths.push(path.map(p=>[p%n,(p/n)|0]));};
 for(const [p,adj] of nodes)if(adj.length!==2){if(!adj.length)paths.push([[p%n,(p/n)|0]]);for(const q of adj)if(!used.has(key(p,q)))walk(p,q)}
 for(const [p,adj] of nodes)for(const q of adj)if(!used.has(key(p,q)))walk(p,q);
 return paths;
}
function simplify(points,tolerance){
 if(points.length<=2)return points;
 const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let max=0,index=0;
 for(let i=1;i<points.length-1;i++){const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0,d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(d>max){max=d;index=i}}
 if(max<=tolerance)return [a,b];return [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];
}
function round(points){
 let result=points;
 for(let pass=0;pass<2;pass++){const next=[result[0]];for(let i=0;i<result.length-1;i++){const a=result[i],b=result[i+1];next.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]])}next.push(result.at(-1));result=next;}return result;
}
export function joinNearbyEnds(mask,n,maxGap){
 const neighbors=p=>{const x=p%n,y=(p/n)|0,a=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,q=yy*n+xx;if((dx||dy)&&xx>=0&&xx<n&&yy>=0&&yy<n&&mask[q]&&(!(dx&&dy)||(!mask[y*n+xx]&&!mask[yy*n+x])))a.push(q);}return a;};
 const ends=[];for(let p=0;p<mask.length;p++)if(mask[p]&&neighbors(p).length===1)ends.push(p);
 let added=0;
 for(const p of ends){if(neighbors(p).length!==1)continue;
  // Exclude the endpoint's own nearby path, but allow closing a gap in
  // a motif that is already part of the same connected component.
  const nearby=new Set([p]),queue=[[p,0]];
  for(let k=0;k<queue.length;k++){const [v,d]=queue[k];if(d>=maxGap*2)continue;for(const q of neighbors(v))if(!nearby.has(q)){nearby.add(q);queue.push([q,d+1]);}}
  const x=p%n,y=(p/n)|0;let best=-1,distance=maxGap;
  for(let yy=Math.max(0,Math.floor(y-maxGap));yy<=Math.min(n-1,Math.ceil(y+maxGap));yy++)for(let xx=Math.max(0,Math.floor(x-maxGap));xx<=Math.min(n-1,Math.ceil(x+maxGap));xx++){
   const q=yy*n+xx,d=Math.hypot(xx-x,yy-y);if(mask[q]&&!nearby.has(q)&&d<distance){best=q;distance=d;}
  }
  if(best<0)continue;const bx=best%n,by=(best/n)|0,steps=Math.ceil(distance*2);
  for(let j=0;j<=steps;j++)mask[Math.round(y+(by-y)*j/steps)*n+Math.round(x+(bx-x)*j/steps)]=1;
  added++;
 }return added;
}
export function prepareLines(input,n,width,height,lineWidth=1.2,smoothing=1,simplification=1){
 const source=groups(input,n);let clean=input.slice(),removed=0;
 // Dense photographic mesh is finer than a printable line. Opening removes
 // those hairline details first, so thickening does not turn them into a slab.
 for(let pass=0;pass<simplification;pass++){
  const eroded=new Uint8Array(clean.length),opened=new Uint8Array(clean.length);
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){const p=y*n+x;if(clean[p]&&clean[p-1]&&clean[p+1]&&clean[p-n]&&clean[p+n])eroded[p]=1;}
  for(let p=0;p<eroded.length;p++)if(eroded[p])for(const q of [p,p-1,p+1,p-n,p+n])opened[q]=1;
  if(opened.reduce((s,v)=>s+v,0)<24)break;clean=opened;
 }
 removed=input.reduce((sum,v,i)=>sum+(v&&!clean[i]?1:0),0);
 const cleaned=groups(clean,n);
 const biggest=Math.max(0,...source.pieces.map(p=>p.length)),minimum=Math.min(biggest,Math.round(4+simplification*4));
 for(const piece of cleaned.pieces)if(piece.length<minimum){removed+=piece.length;for(const p of piece)clean[p]=0;}
 const skeleton=thin(clean,n),originalPaths=trace(skeleton,n),original=skeleton.slice();
 const networkBridges=joinNearbyEnds(skeleton,n,n*.045),bridges=connect(skeleton,n);
 const links=skeleton.map((v,i)=>v&&!original[i]?1:0),paths=trace(links,n),mask=new Uint8Array(n*n);
 const pixel=Math.max(width/n,height/n),radius=Math.max(lineWidth/(2*pixel),1.15+.1*(smoothing-1));
 const stamp=(cx,cy,r=radius)=>{for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(n-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(n-1,Math.ceil(cx+r));x++)if((x-cx)**2+(y-cy)**2<=r*r)mask[y*n+x]=1;};
 const paint=(path,isLink)=>{const curve=round(simplify(path,.25+simplification*.2));const weight=isLink?radius:radius*1.25;if(curve.length===1)stamp(...curve[0],weight);for(let i=1;i<curve.length;i++){const a=curve[i-1],b=curve[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2));for(let j=0;j<=steps;j++)stamp(a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps,weight);}};
 for(const path of originalPaths)paint(path,false);
 for(const path of paths)paint(path,true);
 // Curve rounding can separate junctions by a fraction of a cell. Repair the
 // raster joins once more before the single implicit surface is generated.
 const extra=connect(mask,n);if(extra){const snapshot=mask.slice();for(let p=0;p<snapshot.length;p++)if(snapshot[p])stamp(p%n,(p/n)|0);}
 return {mask,bridges:bridges+extra+networkBridges,sourcePieces:source.pieces.length,removed,lineWidth:radius*2*pixel,paths:paths.length};
}
export function meshConnectedPieces(mesh){
 const parent=new Int32Array(mesh.length),size=new Int32Array(mesh.length).fill(1),vertices=new Map();for(let i=0;i<mesh.length;i++)parent[i]=i;
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i;};
 for(let i=0;i<mesh.length;i++)for(const p of mesh[i]){const key=p.map(x=>x.toFixed(6)).join(','),prior=vertices.get(key);if(prior===undefined)vertices.set(key,i);else{let a=root(i),b=root(prior);if(a!==b){if(size[a]<size[b])[a,b]=[b,a];parent[b]=a;size[a]+=size[b]}}}
 const counts=new Map();for(let i=0;i<mesh.length;i++){const r=root(i);counts.set(r,(counts.get(r)||0)+1)}
 return {count:counts.size,parent,root,counts};
}
