import{serializable as V,Behaviour as z,TypeStore as L}from"./needle-engine-232ead98.js";import{O as E,D as S,R as k,F as G,a as W,U as O,I as X,b as Y,B as Z,c as q,d as N,S as Q,C as J,e as H,V as K,M as $,Q as ee,f as U,g as I}from"./three.module-b6c48c7c.js";import"./index-d79caa74.js";var te=Object.defineProperty,oe=Object.getOwnPropertyDescriptor,P=(C,i,r,n)=>{for(var d=n>1?void 0:n?oe(i,r):i,h=C.length-1,v;h>=0;h--)(v=C[h])&&(d=(n?v(i,r,d):v(d))||d);return n&&d&&te(i,r,d),d};class F extends z{constructor(){super(...arguments),this.path=""}start(){this.path&&(this._splatting=new re().gaussian_splatting,this._splatting.initGL(this.context.mainCamera,this.gameObject,this.context.renderer),this._splatting.loadData(this.path),this._splatting.cutout=this.cutout,setInterval(()=>{this._splatting.tick()},100))}update(){}}P([V()],F.prototype,"path",2);P([V(E)],F.prototype,"cutout",2);const y=2048;class re{constructor(){this.gaussian_splatting={schema:{src:{type:"string",default:"train.splat"}},init:function(){const i=this;i.el.sceneEl.renderer.setPixelRatio(1),i.el.sceneEl.renderer.xr.setFramebufferScaleFactor(.5),this.initGL(i.el.sceneEl.camera.el.components.camera.camera,i.el.object3D,i.el.sceneEl.renderer),this.loadData(i.data.src)},initGL:function(i,r,n){this.camera=i,this.object=r,this.renderer=n,this.textureReady=!1,this.object.frustumCulled=!1,this.centerAndScaleData=new Float32Array(y*y*4),this.covAndColorData=new Uint32Array(y*y*4),this.centerAndScaleTexture=new S(this.centerAndScaleData,y,y,k,G),this.centerAndScaleTexture.needsUpdate=!0,this.covAndColorTexture=new S(this.covAndColorData,y,y,W,O),this.covAndColorTexture.internalFormat="RGBA32UI",this.covAndColorTexture.needsUpdate=!0;let d=new Uint32Array(y*y);const h=new X(d,1,!1);h.setUsage(Y);const v=new Z,w=new Float32Array(6*3),e=new q(w,3);v.setAttribute("position",e),e.setXYZ(2,-2,2,0),e.setXYZ(1,2,2,0),e.setXYZ(0,-2,-2,0),e.setXYZ(5,-2,-2,0),e.setXYZ(4,2,2,0),e.setXYZ(3,2,-2,0),e.needsUpdate=!0;const t=new N().copy(v);t.setAttribute("splatIndex",h),t.instanceCount=1;const u=new Q({uniforms:{viewport:{value:new Float32Array([1980,1080])},focal:{value:1e3},centerAndScaleTexture:{value:this.centerAndScaleTexture},covAndColorTexture:{value:this.covAndColorTexture},gsProjectionMatrix:{value:this.getProjectionMatrix()},gsModelViewMatrix:{value:this.getModelViewMatrix()}},vertexShader:`
				precision highp usampler2D;

				out vec4 vColor;
				out vec2 vPosition;
				uniform vec2 viewport;
				uniform float focal;
				uniform mat4 gsProjectionMatrix;
				uniform mat4 gsModelViewMatrix;

				attribute uint splatIndex;
				uniform sampler2D centerAndScaleTexture;
				uniform usampler2D covAndColorTexture;

				vec2 unpackInt16(in uint value) {
					int v = int(value);
					int v0 = v >> 16;
					int v1 = (v & 0xFFFF);
					if((v & 0x8000) != 0)
						v1 |= 0xFFFF0000;
					return vec2(float(v1), float(v0));
				}

				void main () {
					ivec2 texPos = ivec2(splatIndex%uint(2048),splatIndex/uint(2048));
					vec4 centerAndScaleData = texelFetch(centerAndScaleTexture, texPos, 0);

					vec4 center = vec4(centerAndScaleData.xyz, 1);
					vec4 camspace = gsModelViewMatrix * center;
					vec4 pos2d = gsProjectionMatrix * camspace;

					float bounds = 1.2 * pos2d.w;
					if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
						|| pos2d.y < -bounds || pos2d.y > bounds) {
						gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
						return;
					}

					uvec4 covAndColorData = texelFetch(covAndColorTexture, texPos, 0);
					vec2 cov3D_M11_M12 = unpackInt16(covAndColorData.x) * centerAndScaleData.w;
					vec2 cov3D_M13_M22 = unpackInt16(covAndColorData.y) * centerAndScaleData.w;
					vec2 cov3D_M23_M33 = unpackInt16(covAndColorData.z) * centerAndScaleData.w;
					mat3 Vrk = mat3(
						cov3D_M11_M12.x, cov3D_M11_M12.y, cov3D_M13_M22.x,
						cov3D_M11_M12.y, cov3D_M13_M22.y, cov3D_M23_M33.x,
						cov3D_M13_M22.x, cov3D_M23_M33.x, cov3D_M23_M33.y
					);

					mat3 J = mat3(
						focal / camspace.z, 0., -(focal * camspace.x) / (camspace.z * camspace.z), 
						0., -focal / camspace.z, (focal * camspace.y) / (camspace.z * camspace.z), 
						0., 0., 0.
					);

					mat3 W = transpose(mat3(gsModelViewMatrix));
					mat3 T = W * J;
					mat3 cov = transpose(T) * Vrk * T;

					vec2 vCenter = vec2(pos2d) / pos2d.w;

					float diagonal1 = cov[0][0] + 0.3;
					float offDiagonal = cov[0][1];
					float diagonal2 = cov[1][1] + 0.3;

					float mid = 0.5 * (diagonal1 + diagonal2);
					float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
					float lambda1 = mid + radius;
					float lambda2 = max(mid - radius, 0.1);
					vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
					vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
					vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

					uint colorUint = covAndColorData.w;
					vColor = vec4(
						float(colorUint & uint(0xFF)) / 255.0,
						float((colorUint >> uint(8)) & uint(0xFF)) / 255.0,
						float((colorUint >> uint(16)) & uint(0xFF)) / 255.0,
						float(colorUint >> uint(24)) / 255.0
					);
					vPosition = position.xy;

					gl_Position = vec4(
						vCenter 
							+ position.x * v2 / viewport * 2.0 
							+ position.y * v1 / viewport * 2.0, pos2d.z / pos2d.w, 1.0);
				}
				`,fragmentShader:`
				in vec4 vColor;
				in vec2 vPosition;

				void main () {
					float A = -dot(vPosition, vPosition);
					if (A < -4.0) discard;
					float B = exp(A) * vColor.a;
					gl_FragColor = vec4(vColor.rgb, B);
				}
			`,blending:J,blendSrcAlpha:H,depthTest:!0,depthWrite:!1,transparent:!0}),p=u;p.onBeforeRender=(o,_,c,m,f,a)=>{let x=this.getProjectionMatrix(c);l.material.uniforms.gsProjectionMatrix.value=x,l.material.uniforms.gsModelViewMatrix.value=this.getModelViewMatrix(c);let g=new K;o.getCurrentViewport(g);const A=g.w/2*Math.abs(x.elements[5]);u.uniforms.viewport.value[0]=g.z,u.uniforms.viewport.value[1]=g.w,u.uniforms.focal.value=A};const l=new $(t,u);l.frustumCulled=!1,this.object.add(l),this.worker=new Worker(URL.createObjectURL(new Blob(["(",this.createWorker.toString(),")(self)"],{type:"application/javascript"}))),this.worker.onmessage=o=>{let _=new Uint32Array(o.data.sortedIndexes);const c=l.geometry.attributes.splatIndex;c.set(_),c.needsUpdate=!0,l.geometry.instanceCount=_.length,this.sortReady=!0},this.sortReady=!0},loadData:function(i){this.loadedVertexCount=0,this.rowLength=3*4+3*4+4+4,this.worker.postMessage({method:"clear"}),fetch(i).then(async r=>{var l;const n=(l=r.body)==null?void 0:l.getReader();if(!n){console.error("Failed to get reader");return}let d=0,h=0,v=r.headers.get("Content-Length"),w=v?parseInt(v):void 0;const e=new Array,t=Date.now();let u=0,p=i.endsWith(".ply");for(;;)try{const{value:o,done:_}=await n.read();if(_){console.log("Completed download.");break}if(d+=o.length,w!=null){const m=d/1024/1024/((Date.now()-t)/1e3),f=d/w*100;f-u>1&&(console.log("download progress:",f.toFixed(2)+"%",m.toFixed(2)+" Mbps"),u=f)}else console.log("download progress:",d,", unknown total");e.push(o),!this.textureReady&&this.renderer.properties.get(this.centerAndScaleTexture)&&this.renderer.properties.get(this.covAndColorTexture)&&(this.textureReady=!0);const c=d-h;if(!p&&this.textureReady&&c>this.rowLength){let m=Math.floor(c/this.rowLength);const f=new Uint8Array(c);let a=0;for(const g of e)f.set(g,a),a+=g.length;if(e.length=0,c>m*this.rowLength){const g=new Uint8Array(c-m*this.rowLength);g.set(f.subarray(c-g.length,c),0),e.push(g)}const x=new Uint8Array(m*this.rowLength);x.set(f.subarray(0,x.byteLength),0),this.pushDataBuffer(x.buffer,m),h+=m*this.rowLength}}catch(o){console.error(o);break}if(d-h>0){let o=new Uint8Array(e.reduce((c,m)=>c+m.length,0)),_=0;for(const c of e)o.set(c,_),_+=c.length;p&&(o=new Uint8Array(this.processPlyBuffer(o.buffer))),this.pushDataBuffer(o.buffer,Math.floor(o.byteLength/this.rowLength))}})},pushDataBuffer:function(i,r){if(this.loadedVertexCount+r>y*y&&(console.log("vertexCount limited to maxSize*maxSize",r),r=y*y-this.loadedVertexCount),r<=0)return;let n=new Uint8Array(i),d=new Float32Array(i),h=new Float32Array(r*16);const v=new Uint8Array(this.covAndColorData.buffer),w=new Int16Array(this.covAndColorData.buffer);for(let t=0;t<r;t++){let u=new ee((n[32*t+28+1]-128)/128,(n[32*t+28+2]-128)/128,-(n[32*t+28+3]-128)/128,(n[32*t+28+0]-128)/128),p=new U(d[8*t+0],d[8*t+1],-d[8*t+2]),l=new U(d[8*t+3+0],d[8*t+3+1],d[8*t+3+2]),o=new I;o.makeRotationFromQuaternion(u),o.transpose(),o.scale(l);let _=o.clone();o.transpose(),o.premultiply(_),o.setPosition(p);let c=[0,1,2,5,6,10],m=0;for(let a=0;a<c.length;a++)Math.abs(o.elements[c[a]])>m&&(m=Math.abs(o.elements[c[a]]));let f=this.loadedVertexCount*4+t*4;this.centerAndScaleData[f+0]=p.x,this.centerAndScaleData[f+1]=p.y,this.centerAndScaleData[f+2]=p.z,this.centerAndScaleData[f+3]=m/32767,f=this.loadedVertexCount*8+t*4*2;for(let a=0;a<c.length;a++)w[f+a]=parseInt(o.elements[c[a]]*32767/m);f=this.loadedVertexCount*16+(t*4+3)*4,v[f+0]=n[32*t+24+0],v[f+1]=n[32*t+24+1],v[f+2]=n[32*t+24+2],v[f+3]=n[32*t+24+3],o.elements[15]=Math.max(l.x,l.y,l.z)*n[32*t+24+3]/255;for(let a=0;a<16;a++)h[t*16+a]=o.elements[a]}const e=this.renderer.getContext();for(;r>0;){let t=0,u=0,p=this.loadedVertexCount%y,l=Math.floor(this.loadedVertexCount/y);this.loadedVertexCount%y!=0?(t=Math.min(y,p+r)-p,u=1):Math.floor(r/y)>0?(t=y,u=Math.floor(r/y)):(t=r%y,u=1);const o=this.renderer.properties.get(this.centerAndScaleTexture);e.bindTexture(e.TEXTURE_2D,o.__webglTexture),e.texSubImage2D(e.TEXTURE_2D,0,p,l,t,u,e.RGBA,e.FLOAT,this.centerAndScaleData,this.loadedVertexCount*4);const _=this.renderer.properties.get(this.covAndColorTexture);e.bindTexture(e.TEXTURE_2D,_.__webglTexture),e.texSubImage2D(e.TEXTURE_2D,0,p,l,t,u,e.RGBA_INTEGER,e.UNSIGNED_INT,this.covAndColorData,this.loadedVertexCount*4),this.loadedVertexCount+=t*u,r-=t*u}this.worker.postMessage({method:"push",matrices:h.buffer},[h.buffer])},tick:function(i,r){if(this.sortReady){this.sortReady=!1;let n=this.getModelViewMatrix().elements,d=new Float32Array([n[2],n[6],n[10],n[14]]),h=new I;this.cutout&&(h.copy(this.cutout.matrixWorld),h.invert(),h.multiply(this.object.matrixWorld)),this.worker.postMessage({method:"sort",view:d.buffer,cutout:this.cutout?new Float32Array(h.elements):void 0},[d.buffer])}},getProjectionMatrix:function(i){i||(i=this.camera);let r=i.projectionMatrix.clone();return r.elements[4]*=-1,r.elements[5]*=-1,r.elements[6]*=-1,r.elements[7]*=-1,r},getModelViewMatrix:function(i){i||(i=this.camera);const r=i.matrixWorld.clone();r.elements[1]*=-1,r.elements[4]*=-1,r.elements[6]*=-1,r.elements[9]*=-1,r.elements[13]*=-1;const n=this.object.matrixWorld.clone();return n.invert(),n.elements[1]*=-1,n.elements[4]*=-1,n.elements[6]*=-1,n.elements[9]*=-1,n.elements[13]*=-1,n.multiply(r),n.invert(),n},createWorker:function(i){let r,n;const d=function(e,t,u,p){const l=1/(e[3]*t+e[7]*u+e[11]*p+e[15]);return[(e[0]*t+e[4]*u+e[8]*p+e[12])*l,(e[1]*t+e[5]*u+e[9]*p+e[13])*l,(e[2]*t+e[6]*u+e[10]*p+e[14])*l]},h=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]},v=function(e,t,u=void 0){const p=e.length/16;let l=-1e-4,o=-1/0,_=1/0,c=new Float32Array(p),m=new Int32Array(c.buffer),f=new Int32Array(p),a=0;for(let s=0;s<p;s++){let D=t[0]*e[s*16+12]+t[1]*e[s*16+13]+t[2]*e[s*16+14]+t[3],T=!0;if(u!==void 0){let R=e[s*16+12],j=e[s*16+13],B=e[s*16+14];const b=d(u,R,-j,B);h(b,b),(b[0]<-.5||b[0]>.5||b[1]<-.5||b[1]>.5||b[2]<-.5||b[2]>.5)&&(T=!1)}D<0&&e[s*16+15]>l*D&&T&&(c[a]=D,f[a]=s,a++,D>o&&(o=D),D<_&&(_=D))}let x=(256*256-1)/(o-_),g=new Uint32Array(256*256);for(let s=0;s<a;s++)m[s]=(c[s]-_)*x|0,g[m[s]]++;let A=new Uint32Array(256*256);for(let s=1;s<65536;s++)A[s]=A[s-1]+g[s-1];let M=new Uint32Array(a);for(let s=0;s<a;s++)M[A[m[s]]++]=f[s];return M};i.onmessage=w=>{if(w.data.method=="clear"&&(r=void 0),w.data.method=="push"){const e=new Float32Array(w.data.matrices);r===void 0?r=e:(n=new Float32Array(r.length+e.length),n.set(r),n.set(e,r.length),r=n)}if(w.data.method=="sort")if(r===void 0){const e=new Uint32Array(1);i.postMessage({sortedIndexes:e},[e.buffer])}else{const e=new Float32Array(w.data.view),t=w.data.cutout!==void 0?new Float32Array(w.data.cutout):void 0,u=v(r,e,t);i.postMessage({sortedIndexes:u},[u.buffer])}}},processPlyBuffer:function(i){const r=new Uint8Array(i),n=new TextDecoder().decode(r.slice(0,1024*10)),d=`end_header
`,h=n.indexOf(d);if(h<0)throw new Error("Unable to read .ply file header");const v=parseInt(/element vertex (\d+)\n/.exec(n)[1]);console.log("Vertex Count",v);let w=0,e={},t={};const u={double:"getFloat64",int:"getInt32",uint:"getUint32",float:"getFloat32",short:"getInt16",ushort:"getUint16",uchar:"getUint8"};for(let a of n.slice(0,h).split(`
`).filter(x=>x.startsWith("property "))){const[x,g,A]=a.split(" "),M=u[g]||"getInt8";t[A]=M,e[A]=w,w+=parseInt(M.replace(/[^\d]/g,""))/8}console.log("Bytes per row",w,t,e);let p=new DataView(i,h+d.length),l=0;const o=new Proxy({x:0,y:0,z:0,scale_0:0,scale_1:0,scale_2:0,opacity:0,rot_0:0,rot_1:0,rot_2:0,rot_3:0,f_dc_0:0,f_dc_1:0,f_dc_2:0,red:0,green:0,blue:0},{get(a,x){if(!t[x])throw new Error(x.toString()+" not found");return p[t[x]](l*w+e[x],!0)}});console.time("calculate importance");let _=new Float32Array(v),c=new Uint32Array(v);for(l=0;l<v;l++){if(c[l]=l,!t.scale_0)continue;const a=Math.exp(o.scale_0)*Math.exp(o.scale_1)*Math.exp(o.scale_2),x=1/(1+Math.exp(-o.opacity));_[l]=a*x}console.timeEnd("calculate importance"),console.time("sort"),c.sort((a,x)=>_[x]-_[a]),console.timeEnd("sort");const m=3*4+3*4+4+4,f=new ArrayBuffer(m*v);console.time("build buffer");for(let a=0;a<v;a++){l=c[a];const x=new Float32Array(f,a*m,3),g=new Float32Array(f,a*m+4*3,3),A=new Uint8ClampedArray(f,a*m+4*3+4*3,4),M=new Uint8ClampedArray(f,a*m+4*3+4*3+4,4);if(t.scale_0){const s=Math.sqrt(o.rot_0**2+o.rot_1**2+o.rot_2**2+o.rot_3**2);M[0]=o.rot_0/s*128+128,M[1]=o.rot_1/s*128+128,M[2]=o.rot_2/s*128+128,M[3]=o.rot_3/s*128+128,g[0]=Math.exp(o.scale_0),g[1]=Math.exp(o.scale_1),g[2]=Math.exp(o.scale_2)}else g[0]=.01,g[1]=.01,g[2]=.01,M[0]=255,M[1]=0,M[2]=0,M[3]=0;if(x[0]=o.x,x[1]=o.y,x[2]=o.z,t.f_dc_0){const s=.28209479177387814;A[0]=(.5+s*o.f_dc_0)*255,A[1]=(.5+s*o.f_dc_1)*255,A[2]=(.5+s*o.f_dc_2)*255}else A[0]=o.red,A[1]=o.green,A[2]=o.blue;t.opacity?A[3]=1/(1+Math.exp(-o.opacity))*255:A[3]=255}return console.timeEnd("build buffer"),f}}}}L.add("SplatRenderer",F);
