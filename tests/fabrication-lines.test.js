import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLines,meshConnectedPieces,joinNearbyEnds,repairReliefMask} from '../dist/fabrication-lines.js';
import {smoothLace} from '../dist/fabrication-smooth.js';
import {meshCheck} from '../dist/fabrication-mesh.js';
test('separate motifs are simplified, rounded and joined into one actual mesh',()=>{
 const n=64,mask=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(const cx of [15,46]){const r=Math.hypot(x-cx,y-32);if(r>8&&r<11)mask[y*n+x]=1;}mask[5*n+5]=1;
 const lines=prepareLines(mask,n,80,80,2,1,1);assert.equal(lines.sourcePieces,3);assert.ok(lines.removed>0);assert.ok(lines.bridges>=1);
 assert.ok(lines.mask.reduce((s,v)=>s+v,0)<n*n*.5,'open space must survive');
 const mesh=smoothLace(lines.mask,n,80,80,1.2,1);assert.equal(meshCheck(mesh).invalidEdges,0);assert.equal(meshConnectedPieces(mesh).count,1);
});
test('mesh connectivity check distinguishes two sealed but separate parts',()=>{
 const n=24,mask=new Uint8Array(n*n);for(let y=3;y<8;y++)for(let x=3;x<8;x++)mask[y*n+x]=1;for(let y=16;y<21;y++)for(let x=16;x<21;x++)mask[y*n+x]=1;
 const mesh=smoothLace(mask,n,40,40,1.2,1);assert.equal(meshCheck(mesh).invalidEdges,0);assert.equal(meshConnectedPieces(mesh).count,2);
});
test('nearby open ends close a gap even within an already connected motif',()=>{
 const n=40,mask=new Uint8Array(n*n);
 for(let x=8;x<=30;x++){mask[8*n+x]=1;mask[30*n+x]=1;}
 for(let y=8;y<=30;y++){mask[y*n+8]=1;if(y<17||y>21)mask[y*n+30]=1;}
 assert.ok(joinNearbyEnds(mask,n,8)>0);
 for(let y=17;y<=21;y++)assert.equal(mask[y*n+30],1);
 assert.equal(mask[19*n+19],0,'the enclosed opening remains empty');
});
test('relief repairs short cracks while preserving ornaments and large holes',()=>{
 const n=48,mask=new Uint8Array(n*n);for(let y=7;y<41;y++)for(let x=7;x<41;x++)if(x<10||x>37||y<10||y>37)mask[y*n+x]=1;
 for(let y=20;y<23;y++)for(let x=37;x<41;x++)mask[y*n+x]=0;
 const repaired=repairReliefMask(mask,n,48,48,.9);
 assert.ok(mask.every((v,i)=>!v||repaired.mask[i]));assert.equal(repaired.mask[21*n+39],1);assert.equal(repaired.mask[24*n+24],0);
 const mesh=smoothLace(repaired.mask,n,48,48,.8,1);assert.equal(meshCheck(mesh).invalidEdges,0);assert.equal(meshConnectedPieces(mesh).count,1);
});
