const fs=require('fs');
const path=require('path');
const root=__dirname;
const output=path.join(root,'dist');
fs.mkdirSync(path.join(output,'server'),{recursive:true});
fs.mkdirSync(path.join(output,'.openai'),{recursive:true});
fs.copyFileSync(path.join(root,'worker','index.js'),path.join(output,'server','index.js'));
fs.copyFileSync(path.join(root,'.openai','hosting.json'),path.join(output,'.openai','hosting.json'));
console.log('Sites build ready: static assets and Worker entrypoint');
