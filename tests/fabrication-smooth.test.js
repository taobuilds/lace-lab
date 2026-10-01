import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothLace} from '../dist/fabrication-smooth.js';
import {meshCheck} from '../dist/fabrication-mesh.js';
test('rounded ring is watertight with an open center and positive volume',()=>{
 const n=32,mask=new Uint8Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.hypot(x-15.5,y-15.5);mask[y*n+x]=r<13&&r>7?1:0;}
 const mesh=smoothLace(mask,n,80,80,1.2,2);assert.ok(mesh.length>0);assert.equal(meshCheck(mesh).invalidEdges,0);
 assert.ok(mesh.flat().every(p=>Math.hypot(p[0],p[1])>15));
 let volume=0;for(const [a,b,c] of mesh)volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;assert.ok(volume>0);
 assert.ok(mesh.flat().some(p=>Math.abs(p[0]/2.5-Math.round(p[0]/2.5))>.01));
});
test('diagonal pixel contacts are rebuilt without non-manifold edges',()=>{
 const mask=new Uint8Array(16*16);for(let y=2;y<14;y++)for(let x=2;x<14;x++)if((x+y)%4<2)mask[y*16+x]=1;
 const mesh=smoothLace(mask,16,40,40,1.2,1);assert.ok(mesh.length);assert.equal(meshCheck(mesh).invalidEdges,0);
});
