import test from 'node:test';
import assert from 'node:assert/strict';
test('background builder returns the complete preview and a checked STL',async()=>{
 let result,transfers;globalThis.self={postMessage:(data,list)=>{result=data;transfers=list}};
 try{
  await import('../dist/fabrication-worker.js');const n=32,pixels=new Uint8Array(n*n).fill(255);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=Math.hypot(x-15.5,y-15.5);if(r>7&&r<13)pixels[y*n+x]=0;}
  self.onmessage({data:{pixels,n,width:80,height:80,thickness:1.2,threshold:128,light:false,largest:false,frame:false,smoothing:1}});
  assert.equal(result.error,undefined);assert.equal(result.invalidEdges,0);assert.equal(result.components,1);assert.equal(result.packed.length,result.faces*18);
  assert.equal(new DataView(result.stl).getUint32(80,true),result.faces);assert.equal(result.stl.byteLength,84+result.faces*50);
  assert.equal(transfers[0],result.packed.buffer);assert.equal(transfers[1],result.stl);
 }finally{delete globalThis.self}
});
