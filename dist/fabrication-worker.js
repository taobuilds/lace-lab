import {smoothLace,applyLaceRelief} from './fabrication-smooth.js';
import {meshCheck,binarySTL} from './fabrication-mesh.js';
import {meshBuffer} from './fabrication-view.js';
import {prepareLines,meshConnectedPieces,repairReliefMask,normalizeLaceInk} from './fabrication-lines.js';
self.onmessage=({data})=>{
 try{
  const {pixels,n,width,height,thickness,threshold,light,frame,smoothing,lineWidth=1.2,simplification=1,relief=false,depth=.8}=data;
  const ink=data.preserveFine?normalizeLaceInk(pixels,light):pixels;
  let mask=new Uint8Array(n*n);
  for(let i=0;i<mask.length;i++)mask[i]=light?ink[i]>=threshold:ink[i]<threshold;
  if(frame)for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(x<2||x>=n-2||y<2||y>=n-2)mask[y*n+x]=1;
  const start=performance.now(),lines=prepareLines(mask,n,width,height,lineWidth,smoothing,simplification);
  if(relief){const repaired=repairReliefMask(mask,n,width,height,lineWidth);lines.mask=repaired.mask;lines.bridges=repaired.bridges;}
  let mesh=smoothLace(lines.mask,n,width,height,thickness,smoothing);
  if(relief)applyLaceRelief(mesh,lines.mask,n,width,height,thickness,depth);
  let parts=meshConnectedPieces(mesh),discardedFaces=0;
  // Smoothing may erase a marginal junction. Remove only residual disconnected
  // shells from the exported geometry and report that cleanup explicitly.
  if(parts.count>1&&!relief){const biggest=[...parts.counts].sort((a,b)=>b[1]-a[1])[0][0],before=mesh.length;mesh=mesh.filter((_,i)=>parts.root(i)===biggest);discardedFaces=before-mesh.length;parts=meshConnectedPieces(mesh);}
  const check=meshCheck(mesh),packed=meshBuffer(mesh),stl=binarySTL(mesh);
  let extent=Math.max(width,height,thickness);for(const t of mesh)for(const p of t)extent=Math.max(extent,Math.abs(p[0])*2,Math.abs(p[1])*2,Math.abs(p[2])*2);
  self.postMessage({packed,stl,extent,faces:mesh.length,invalidEdges:check.invalidEdges,components:parts.count,sourcePieces:lines.sourcePieces,removed:lines.removed,bridges:lines.bridges,lineWidth:lines.lineWidth,discardedFaces,lineMask:lines.mask,n,maxHeight:mesh.reduce((h,t)=>Math.max(h,...t.map(p=>p[2])),0),elapsed:performance.now()-start},[packed.buffer,stl,lines.mask.buffer]);
 }catch(e){self.postMessage({error:e.message})}
};
