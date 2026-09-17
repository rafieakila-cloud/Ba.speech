// Ikon Bacapi: PNG 256 + ICO (PNG-compressed), murni Node bawaan (zlib).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const S = 256;
const stops = [[0x42,0x85,0xF4],[0x9B,0x72,0xCB],[0xD9,0x65,0x70]];
function lerp(a,b,t){ return a+(b-a)*t; }
function grad(t){ // diagonal 3-stop
  let c;
  if(t<0.5){ const k=t/0.5; c=[lerp(stops[0][0],stops[1][0],k),lerp(stops[0][1],stops[1][1],k),lerp(stops[0][2],stops[1][2],k)]; }
  else { const k=(t-0.5)/0.5; c=[lerp(stops[1][0],stops[2][0],k),lerp(stops[1][1],stops[2][1],k),lerp(stops[1][2],stops[2][2],k)]; }
  return c.map(v=>Math.round(v));
}
function inB(x,y){ // huruf B geometris: stem + 2 mangkuk kanan
  if(x>=64&&x<=104&&y>=36&&y<=220)return true;
  const bowls=[[104,96,50],[104,166,50]];
  for(let k=0;k<bowls.length;k++){
    const cx=bowls[k][0], cy=bowls[k][1], r=bowls[k][2];
    if(x<cx-6)continue;
    if(Math.abs(Math.hypot(x-cx,y-cy)-r)<=18)return true;
  }
  return false;
}
const buf = Buffer.alloc(S*S*4);
const R = 0.22*S;
const OFF=[[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]];
for(let y=0;y<S;y++) for(let x=0;x<S;x++){
  const i=(y*S+x)*4;
  let m=0,w=0;
  for(let s=0;s<4;s++){
    const px=x+OFF[s][0], py=y+OFF[s][1];
    const cx=Math.min(Math.max(px,R),S-R), cy=Math.min(Math.max(py,R),S-R);
    if(Math.hypot(px-cx,py-cy)>R)continue;
    m++;
    if(inB(px,py))w++;
  }
  if(m===0){ buf[i+3]=0; continue; }
  const t=(x+y)/(2*S);
  const g=grad(t), k=(w/4)/(m/4);
  buf[i]=Math.round(lerp(g[0],255,k)); buf[i+1]=Math.round(lerp(g[1],255,k)); buf[i+2]=Math.round(lerp(g[2],255,k)); buf[i+3]=Math.round(255*(m/4));
}
// --- PNG ---
const crcT=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function chunk(type,data){const h=Buffer.alloc(8);h.writeUInt32BE(data.length,0);h.write(type,4,'ascii');const c=Buffer.alloc(4);c.writeUInt32BE(crc(Buffer.concat([Buffer.from(type,'ascii'),data])),0);return Buffer.concat([h,data,c]);}
const raw=Buffer.alloc((S*4+1)*S);
for(let y=0;y<S;y++){raw[y*(S*4+1)]=0;buf.copy(raw,y*(S*4+1)+1,y*S*4,(y+1)*S*4);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(S,0);ihdr.writeUInt32BE(S,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
const dir=__dirname;
fs.writeFileSync(path.join(dir,'..','bacapi-app','icon.png'),png);
// --- ICO (PNG di dalam) ---
const head=Buffer.alloc(6);head.writeUInt16LE(0,0);head.writeUInt16LE(1,2);head.writeUInt16LE(1,4);
const ent=Buffer.alloc(16);ent[0]=0;ent[1]=0;ent[2]=0;ent[3]=0;ent.writeUInt16LE(1,4);ent.writeUInt16LE(32,6);ent.writeUInt32LE(png.length,8);ent.writeUInt32LE(22,12);
fs.writeFileSync(path.join(dir,'..','bacapi-app','icon.ico'),Buffer.concat([head,ent,png]));
console.log('icon.png + icon.ico OK');
