export function meshBuffer(triangles) {
  const buffer=new Float32Array(triangles.length*18);
  let offset=0;
  for(const [a,b,c] of triangles){
    const u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...normal)||1;
    for(const point of [a,b,c]){buffer.set(point,offset);buffer.set(normal.map(x=>x/length),offset+3);offset+=6;}
  }
  return buffer;
}
export function createModelView(canvas) {
  const gl=canvas.getContext('webgl',{antialias:true,alpha:true});
  if(!gl)throw new Error('3D preview needs WebGL. Enable browser hardware acceleration and reload.');
  const vertex=`attribute vec3 position; attribute vec3 normal;
    uniform vec2 rotation; uniform vec2 scale; uniform float depthScale;
    varying vec3 litNormal; varying vec3 modelPosition;
    vec3 rotate(vec3 p){float c=cos(rotation.y),s=sin(rotation.y);p=vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);c=cos(rotation.x);s=sin(rotation.x);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
    void main(){vec3 p=rotate(position);gl_Position=vec4(p.x*scale.x,-p.y*scale.y,-p.z*depthScale,1.0);litNormal=rotate(normal);modelPosition=position;}`;
  const fragment=`precision mediump float; varying vec3 litNormal; varying vec3 modelPosition;
    void main(){vec3 n=normalize(litNormal);if(!gl_FrontFacing)n=-n;
    float lighting=.48+.52*max(0.0,dot(n,normalize(vec3(-.4,-.6,1.0))));
    float layer=1.0-.035*smoothstep(.72,.98,fract(modelPosition.z/.2));
    vec3 resin=vec3(.24,.34,.39);gl_FragColor=vec4(resin*lighting*layer+.08,1.0);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('3D shader could not compile: '+gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('3D preview could not initialise.');
  const buffer=gl.createBuffer();let vertices=0,extent=80;
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset] of [['position',0],['normal',12]]){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,24,offset);}
  const rotation=gl.getUniformLocation(program,'rotation'),scale=gl.getUniformLocation(program,'scale'),depth=gl.getUniformLocation(program,'depthScale');
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.frontFace(gl.CW);gl.clearColor(0,0,0,0);
  return {
    setPacked(data,modelExtent){vertices=data.length/6;extent=modelExtent;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);},
    setMesh(triangles){const data=meshBuffer(triangles);vertices=data.length/6;extent=1;for(const t of triangles)for(const p of t)extent=Math.max(extent,Math.abs(p[0])*2,Math.abs(p[1])*2,Math.abs(p[2])*2);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return vertices;},
    draw(rx,rz,zoom){const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;const dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const size=Math.min(box.width,box.height)*.68/extent*zoom;gl.uniform2f(rotation,rx,rz);gl.uniform2f(scale,2*size/box.width,2*size/box.height);gl.uniform1f(depth,1/(extent*3));gl.drawArrays(gl.TRIANGLES,0,vertices);}
  };
}
