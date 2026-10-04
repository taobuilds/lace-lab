import {createRequire} from 'node:module';
import {normalizeLaceInk,repairReliefMask,meshConnectedPieces} from '../dist/fabrication-lines.js';
import {smoothLace} from '../dist/fabrication-smooth.js';
import {meshCheck} from '../dist/fabrication-mesh.js';
import {writeFileSync} from 'node:fs';
const {loadImage,createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
const img=await loadImage(process.argv[2]),n=256,s=n*4,c=createCanvas(s,s),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,s,s);ctx.drawImage(img,0,0,s,s);
const rgba=ctx.getImageData(0,0,s,s).data,pixels=new Uint8Array(n*n);
for(let y=0;y<n;y++)for(let x=0;x<n;x++){let lo=255;for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const i=((y*4+dy)*s+x*4+dx)*4;lo=Math.min(lo,.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2]);}pixels[y*n+x]=lo;}
const ink=normalizeLaceInk(pixels),mask=ink.map(v=>v<128?1:0),repaired=repairReliefMask(mask,n,150,150,.9),mesh=smoothLace(repaired.mask,n,150,150,.8,0);
console.log(JSON.stringify({originalCells:mask.reduce((s,v)=>s+v,0),repairedCells:repaired.mask.reduce((s,v)=>s+v,0),pieces:meshConnectedPieces(mesh).count,invalidEdges:meshCheck(mesh).invalidEdges,faces:mesh.length}));
const preview=createCanvas(n,n),pctx=preview.getContext('2d'),data=pctx.createImageData(n,n);for(let i=0;i<n*n;i++){const v=repaired.mask[i]?35:255;data.data.set([v,v,v,255],i*4);}pctx.putImageData(data,0,0);writeFileSync('output/fine-thread-mask.png',preview.toBuffer('image/png'));
