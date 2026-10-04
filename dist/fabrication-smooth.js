// Extract one closed surface from a filtered image field. Shared cube diagonals
// give adjacent tetrahedra exactly the same interpolated edge vertices.
export function smoothLace(mask,n,width,height,thickness,smoothing=2){
 const size=n+4,area=size*size,stepX=width/n,stepY=height/n;
 let field=new Float64Array(area);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)field[(y+2)*size+x+2]=mask[y*n+x];
 for(let pass=0;pass<Math.max(1,smoothing);pass++){
  const next=new Float64Array(area);
  for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
   const i=y*size+x;next[i]=(4*field[i]+2*(field[i-1]+field[i+1]+field[i-size]+field[i+size])+field[i-size-1]+field[i-size+1]+field[i+size-1]+field[i+size+1])/16;
  }if(smoothing===0)for(let i=0;i<area;i++)next[i]=field[i]*.75+next[i]*.25;field=next;
 }
 const layers=4,zStep=thickness/(layers-2),zStart=-zStep/2,values=new Float64Array(area*(layers+1));
 const blend=Math.min(thickness*.18,Math.min(stepX,stepY)*.35);
 for(let z=0;z<=layers;z++)for(let i=0;i<area;i++){
  const a=(field[i]-.48731)*Math.min(stepX,stepY)*2,b=Math.min(zStart+z*zStep,thickness-zStart-z*zStep);
  const h=Math.max(blend-Math.abs(a-b),0)/blend;
  values[z*area+i]=Math.min(a,b)-h*h*blend*.25+1e-7;
 }
 const mesh=[],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const corner=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 for(let z=0;z<layers;z++)for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){
  const ids=corner.map(([a,b,c])=>(z+c)*area+(y+b)*size+x+a),v=ids.map(i=>values[i]);
  if(v.every(a=>a<=0)||v.every(a=>a>0))continue;
  const points=corner.map(([a,b,c])=>[(x+a-1.5)*stepX-width/2,(y+b-1.5)*stepY-height/2,zStart+(z+c)*zStep]);
  const edge=(a,b)=>{if(ids[a]>ids[b])[a,b]=[b,a];const t=v[a]/(v[a]-v[b]);return points[a].map((p,k)=>p+(points[b][k]-p)*t)};
  for(const tet of tets){
   const inside=tet.filter(i=>v[i]>0),outside=tet.filter(i=>v[i]<=0);if(!inside.length||!outside.length)continue;
   const center=group=>[0,1,2].map(k=>group.reduce((sum,i)=>sum+points[i][k],0)/group.length);
   const a=center(inside),b=center(outside),direction=b.map((p,k)=>p-a[k]);
   const add=(p,q,r)=>{const u=q.map((p,k)=>p-r[k]),v=p.map((p,k)=>p-r[k]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    // (q-r) x (p-r) is the reverse of the triangle's outward normal.
    if(normal.reduce((sum,v,k)=>sum+v*direction[k],0)>0)[q,r]=[r,q];mesh.push([p,q,r]);};
   if(inside.length===1){const i=inside[0];add(...outside.map(o=>edge(i,o)));}
   else if(outside.length===1){const o=outside[0];add(...inside.map(i=>edge(i,o)));}
   else {const [a,b]=inside,[c,d]=outside,p=edge(a,c),q=edge(a,d),r=edge(b,d),s=edge(b,c);add(p,q,r);add(p,r,s);}
  }
 }
 return mesh;
}
// A shared continuous height field deforms every coincident vertex identically.
// Wide ornamental strokes rise above thin mesh; the bottom remains planar.
export function applyLaceRelief(mesh,mask,n,width,height,thickness,depth){
 const distance=new Float64Array(n*n);
 for(let i=0;i<distance.length;i++)distance[i]=mask[i]?n:0;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(!mask[i])continue;distance[i]=Math.min(distance[i],x?distance[i-1]+1:1,y?distance[i-n]+1:1);}
 for(let y=n-1;y>=0;y--)for(let x=n-1;x>=0;x--){const i=y*n+x;if(!mask[i])continue;distance[i]=Math.min(distance[i],x<n-1?distance[i+1]+1:1,y<n-1?distance[i+n]+1:1);}
 const sample=(x,y)=>{x=Math.max(0,Math.min(n-1,x));y=Math.max(0,Math.min(n-1,y));const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,c=Math.min(n-1,a+1),d=Math.min(n-1,b+1);return distance[b*n+a]*(1-u)*(1-v)+distance[b*n+c]*u*(1-v)+distance[d*n+a]*(1-u)*v+distance[d*n+c]*u*v;};
 const visited=new WeakSet();
 for(const triangle of mesh)for(const p of triangle){if(visited.has(p))continue;visited.add(p);const d=sample((p[0]+width/2)*n/width-.5,(p[1]+height/2)*n/height-.5);const rise=depth*(1-Math.exp(-Math.max(0,d-.65)/2));p[2]*=1+rise/thickness;}
 return mesh;
}
