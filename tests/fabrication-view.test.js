import test from 'node:test';
import assert from 'node:assert/strict';
import {meshBuffer,createModelView} from '../dist/fabrication-view.js';
import {extrude} from '../dist/fabrication-mesh.js';
test('complete plate geometry reaches the GPU with no dropped faces',()=>{
 const mesh=extrude(new Uint8Array(96*96).fill(1),96,80,80,1.2);
 const packed=meshBuffer(mesh);assert.equal(packed.length,mesh.length*18);
 for(let i=0;i<mesh.length;i++)for(let p=0;p<3;p++)for(let d=0;d<3;d++)assert.ok(Math.abs(packed[i*18+p*6+d]-mesh[i][p][d])<.00001);
 const calls={};const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>0,getUniformLocation:()=>0,bufferData:(_,data)=>calls.upload=data.length,drawArrays:(_,first,count)=>calls.draw=count},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 const canvas={width:0,height:0,getContext:()=>gl,getBoundingClientRect:()=>({width:800,height:580})};
 const view=createModelView(canvas);assert.equal(view.setMesh(mesh),mesh.length*3);view.draw(-.65,-.35,1);
 assert.equal(calls.draw,mesh.length*3);assert.equal(calls.upload,packed.length);
 view.draw(0,0,2);assert.equal(calls.draw,mesh.length*3);
});
test('unavailable WebGL yields an actionable message',()=>{
 assert.throws(()=>createModelView({getContext:()=>null}),/hardware acceleration/);
});
