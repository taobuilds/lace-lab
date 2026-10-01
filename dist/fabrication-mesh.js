// A raster-height extrusion: planar faces and exposed boundary walls only.
export function largestComponent(mask, n) {
  const seen=new Uint8Array(mask.length);let best=[],count=0;
  for(let i=0;i<mask.length;i++)if(mask[i]&&!seen[i]){count++;const group=[i];seen[i]=1;for(let k=0;k<group.length;k++){const p=group[k],x=p%n,y=Math.floor(p/n);for(const q of [x? p-1:-1,x<n-1?p+1:-1,y?p-n:-1,y<n-1?p+n:-1])if(q>=0&&mask[q]&&!seen[q]){seen[q]=1;group.push(q)}}if(group.length>best.length)best=group}
  const result=new Uint8Array(mask.length);for(const i of best)result[i]=1;return {mask:result,count,removed:mask.reduce((a,b)=>a+b,0)-best.length};
}
export function extrude(mask,n,width,height,thickness){
  const triangles=[],dx=width/n,dy=height/n;
  const quad=(a,b,c,d)=>triangles.push([a,b,c],[a,c,d]);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(mask[y*n+x]){
    const x0=x*dx-width/2,x1=x0+dx,y0=y*dy-height/2,y1=y0+dy;
    const a=[x0,y0,0],b=[x1,y0,0],c=[x1,y1,0],d=[x0,y1,0],A=[x0,y0,thickness],B=[x1,y0,thickness],C=[x1,y1,thickness],D=[x0,y1,thickness];
    quad(A,B,C,D);quad(d,c,b,a);
    if(y===0||!mask[(y-1)*n+x])quad(a,b,B,A);
    if(x===n-1||!mask[y*n+x+1])quad(b,c,C,B);
    if(y===n-1||!mask[(y+1)*n+x])quad(c,d,D,C);
    if(x===0||!mask[y*n+x-1])quad(d,a,A,D);
  }return triangles;
}
export function filamentNetwork(mask,n,width,height,thickness){
  const out=[],dx=width/n,dy=height/n,r=Math.max(thickness*.32,.22);
  const add=(x0,y0,x1,y1,z0,z1)=>{const vx=x1-x0,vy=y1-y0,L=Math.hypot(vx,vy)||1,px=-vy/L*r,py=vx/L*r;const a=[x0+px,y0+py,z0],b=[x1+px,y1+py,z0],c=[x1-px,y1-py,z0],d=[x0-px,y0-py,z0],A=[a[0],a[1],z1],B=[b[0],b[1],z1],C=[c[0],c[1],z1],D=[d[0],d[1],z1];const q=(u,v,w,t)=>out.push([u,v,w],[u,w,t]);q(A,B,C,D);q(d,c,b,a);q(a,b,B,A);q(b,c,C,B);q(c,d,D,C);q(d,a,A,D)};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(!mask[i])continue;const x0=x*dx-width/2+dx*.5,y0=y*dy-height/2+dy*.5,wiggle=((((i*17)%13)-6)/6)*Math.min(dx,dy)*.22; if(x<n-1&&mask[i+1])add(x0,y0,x0+dx,y0+wiggle,0,thickness);if(y<n-1&&mask[i+n])add(x0,y0,x0+wiggle,y0+dy,0,thickness);if(x<n-2&&y<n-2&&mask[i+n+1]&&((i*31)%5===0))add(x0,y0,x0+dx+wiggle,y0+dy-wiggle,thickness*.05,thickness*1.15)}
  return out;
}
export function roundedFilamentNetwork(mask,n,width,height,thickness){
  const out=[],dx=width/n,dy=height/n,r=Math.max(thickness*.5,.3),sides=8;
  const add=(x0,y0,x1,y1,z0,z1)=>{const vx=x1-x0,vy=y1-y0,L=Math.hypot(vx,vy)||1,nx=-vy/L,ny=vx/L, rings=[];for(const [x,y] of [[x0,y0],[x1,y1]]){const ring=[];for(let k=0;k<sides;k++){const a=k*Math.PI*2/sides;ring.push([x+nx*Math.cos(a)*r,y+ny*Math.cos(a)*r,z0+(z1-z0)*.5+Math.sin(a)*r])}rings.push(ring)}for(let k=0;k<sides;k++){const q=(u,v,w,t)=>out.push([u,v,w],[u,w,t]);q(rings[0][k],rings[0][(k+1)%sides],rings[1][(k+1)%sides],rings[1][k])}};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(!mask[i])continue;const x0=x*dx-width/2+dx*.5,y0=y*dy-height/2+dy*.5;if(x<n-1&&mask[i+1])add(x0,y0,x0+dx,y0,0,thickness);if(y<n-1&&mask[i+n])add(x0,y0,x0,y0+dy,0,thickness);if(x<n-2&&y<n-2&&mask[i+n+1])add(x0,y0,x0+dx,y0+dy,thickness*.08,thickness*1.08)}
  return out;
}
export function meshCheck(triangles){
  const edges=new Map();const key=p=>p.map(v=>v.toFixed(6)).join(',');
  for(const t of triangles)for(let i=0;i<3;i++){const a=key(t[i]),b=key(t[(i+1)%3]),k=a<b?a+'|'+b:b+'|'+a;edges.set(k,(edges.get(k)||0)+1)}
  return {triangles:triangles.length,invalidEdges:[...edges.values()].filter(v=>v!==2).length};
}
export function binarySTL(triangles){
  const data=new ArrayBuffer(84+triangles.length*50),v=new DataView(data);v.setUint32(80,triangles.length,true);
  triangles.forEach((t,i)=>{let offset=84+i*50;const u=t[1].map((x,k)=>x-t[0][k]),w=t[2].map((x,k)=>x-t[0][k]),normal=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...normal)||1;for(const x of [...normal.map(x=>x/len),...t.flat()]){v.setFloat32(offset,x,true);offset+=4}});return data;
}
