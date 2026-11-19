// Perspective and a depth buffer for the museum on devices without WebGL.
window.makeGalleryPainter = (T, canvas) => {
  const context=canvas.getContext("2d",{alpha:true});
  if(!context) throw new Error("Canvas unavailable");
  const objects=new WeakMap();
  let frameBuffer,pixels,depth;
  const frustum=new T.Frustum();
  const projection=new T.Matrix4(), modelView=new T.Matrix4();
  const light=new T.Vector3(-.55,.77,.58).normalize(), rim=new T.Vector3(.73,.32,-.54).normalize();
  const eye=new T.Vector3(), normal=new T.Vector3(), reflected=new T.Vector3(), view=new T.Vector3(), location=new T.Vector3();
  function geometryFor(mesh) {
    if(objects.has(mesh))return objects.get(mesh);
    const geometry=mesh.geometry, pos=geometry.getAttribute("position"),uv=geometry.getAttribute("uv");
    const indices=geometry.index?geometry.index.array:Array.from({length:pos.count},(_,i)=>i);
    const triangles=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3();
    for(let k=0;k<indices.length;k+=3){
      const i=indices[k],j=indices[k+1],l=indices[k+2];
      a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,j);c.fromBufferAttribute(pos,l);
      n.crossVectors(b.clone().sub(a),c.clone().sub(a));
      if(n.lengthSq()<1e-12)continue;
      n.normalize();triangles.push({i,j,l,n:n.clone(),x:(a.x+b.x+c.x)/3,y:(a.y+b.y+c.y)/3,z:(a.z+b.z+c.z)/3});
    }
    const normals=geometry.getAttribute("normal");
    const smooth=normals&&!mesh.material.isMeshBasicMaterial&&!mesh.material.userData.grain&&mesh.material.side!==T.DoubleSide;
    const info={pos,uv,triangles,normals,light:smooth?new Float32Array(pos.count*2):null,coords:new Float32Array(pos.count*4)};
    objects.set(mesh,info);return info;
  }
  function raster(info,face,color,texture,w,h,double) {
    const {coords,uv}=info,ia=face.i*4,ib=face.j*4,ic=face.l*4;
    const ax=coords[ia],ay=coords[ia+1],az=coords[ia+2],aw=coords[ia+3];
    const bx=coords[ib],by=coords[ib+1],bz=coords[ib+2],bw=coords[ib+3];
    const cx=coords[ic],cy=coords[ic+1],cz=coords[ic+2],cw=coords[ic+3];
    if(aw<=0||bw<=0||cw<=0||Math.max(az,bz,cz)>1||Math.min(az,bz,cz)<-1)return;
    const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
    if(!double&&area>=0||Math.abs(area)<.018)return;
    const left=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),right=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.5));
    const top=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),bottom=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.5));
    const du=(cy-ay)/area,dv=(ay-by)/area,eu=(ax-cx)/area,ev=(bx-ax)/area;
    const lighting=info.light, iaLight=face.i*2, ibLight=face.j*2, icLight=face.l*2;
    const lum=lighting?lighting[iaLight]:0, glint=lighting?lighting[iaLight+1]:0;
    const lu=lighting?lighting[ibLight]-lum:0,lv=lighting?lighting[icLight]-lum:0;
    const gu=lighting?lighting[ibLight+1]-glint:0,gv=lighting?lighting[icLight+1]-glint:0;
    const cr=color&255,cg=color>>8&255,cb=color>>16&255;
    for(let y=top;y<=bottom;y++){
      let u=(left+.5-ax)*du+(y+.5-ay)*eu,v=(left+.5-ax)*dv+(y+.5-ay)*ev;
      for(let x=left;x<=right;x++,u+=du,v+=dv){
        if(u<-.00001||v<-.00001||u+v>1.00001)continue;
        const w0=1-u-v,z=w0*az+u*bz+v*cz,idx=y*w+x;
        if(z>=depth[idx])continue;
        if(texture&&uv){
          const inv=1/(w0*aw+u*bw+v*cw);
          const tx=(w0*aw*uv.getX(face.i)+u*bw*uv.getX(face.j)+v*cw*uv.getX(face.l))*inv;
          const ty=(w0*aw*uv.getY(face.i)+u*bw*uv.getY(face.j)+v*cw*uv.getY(face.l))*inv;
          const sx=Math.min(texture.w-1,Math.max(0,Math.round(tx*(texture.w-1))));
          const sy=Math.min(texture.h-1,Math.max(0,Math.round((1-ty)*(texture.h-1))));
          const rgba=texture.data[sy*texture.w+sx];
          if(color===-1)pixels[idx]=rgba;
          else {
            const r=(rgba&255)*(color&255)/255|0,g=(rgba>>8&255)*(color>>8&255)/255|0,b=(rgba>>16&255)*(color>>16&255)/255|0;
            pixels[idx]=0xff000000|(b<<16)|(g<<8)|r;
          }
        }else if(lighting){
          const k=lum+u*lu+v*lv,s=glint+u*gu+v*gv;
          const r=Math.min(255,cr*k+s)|0,g=Math.min(255,cg*k+s*.88)|0,b=Math.min(255,cb*k+s*.73)|0;
          pixels[idx]=0xff000000|(b<<16)|(g<<8)|r;
        }else pixels[idx]=color;
        depth[idx]=z;
      }
    }
  }
  function captureTexture(image){
    const bitmap=document.createElement("canvas"),size=Math.min(650,image.naturalWidth);
    bitmap.width=size;bitmap.height=Math.round(size*image.naturalHeight/image.naturalWidth);
    const brush=bitmap.getContext("2d");brush.drawImage(image,0,0,bitmap.width,bitmap.height);
    return {w:bitmap.width,h:bitmap.height,data:new Uint32Array(brush.getImageData(0,0,bitmap.width,bitmap.height).data.buffer)};
  }
  function draw(world,camera,width,height,fast) {
    const ratio=Math.min(fast ? .76 : 1, (fast?820:1340)/width, (fast?520:810)/height);
    const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
    if(!frameBuffer||canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;frameBuffer=context.createImageData(w,h);pixels=new Uint32Array(frameBuffer.data.buffer);depth=new Float32Array(w*h);}
    pixels.fill(0);depth.fill(Infinity);
    world.updateMatrixWorld(true);projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection);
    eye.setFromMatrixPosition(camera.matrixWorld);
    world.traverseVisible(mesh=>{
      if(!mesh.isMesh||!frustum.intersectsObject(mesh))return;
      const info=geometryFor(mesh),{pos,coords}=info,mat=mesh.material;
      modelView.multiplyMatrices(projection,mesh.matrixWorld);
      const m=modelView.elements;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const invW=1/(m[3]*x+m[7]*y+m[11]*z+m[15]),o=i*4;
        coords[o]=((m[0]*x+m[4]*y+m[8]*z+m[12])*invW+1)*w/2;
        coords[o+1]=(1-(m[1]*x+m[5]*y+m[9]*z+m[13])*invW)*h/2;
        coords[o+2]=(m[2]*x+m[6]*y+m[10]*z+m[14])*invW;coords[o+3]=invW;
      }
      const normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const hex=mat.color.getHex(),red=hex>>16,green=hex>>8&255,blue=hex&255,metal=mat.metalness||0;
      if(info.light){
        for(let i=0;i<pos.count;i++){
          normal.fromBufferAttribute(info.normals,i).applyNormalMatrix(normalMatrix);
          location.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
          view.copy(eye).sub(location).normalize();
          reflected.copy(normal).multiplyScalar(2*view.dot(normal)).sub(view);
          const key=Math.max(0,normal.dot(light)),fill=Math.max(0,normal.dot(rim));
          const strip=Math.pow(Math.max(0,1-Math.abs(reflected.x*.86+reflected.z*.24-.18)*2.6),3);
          info.light[i*2]=.38+.61*key+.15*fill+metal*(.19+.34*Math.max(0,reflected.y)+.25*strip);
          info.light[i*2+1]=metal*(93*Math.pow(Math.max(0,reflected.dot(light)),14)+52*strip);
        }
        const baseColor=0xff000000|(blue<<16)|(green<<8)|red;
        for(const face of info.triangles)raster(info,face,baseColor,null,w,h,false);
        return;
      }
      for(const face of info.triangles){
        const a=face.i*4,b=face.j*4,c=face.l*4;
        const area=(coords[b]-coords[a])*(coords[c+1]-coords[a+1])-(coords[b+1]-coords[a+1])*(coords[c]-coords[a]);
        if(area>=0&&mat.side!==T.DoubleSide)continue;
        normal.copy(face.n).applyMatrix3(normalMatrix).normalize();
        if(area>0)normal.negate();
        location.set(face.x,face.y,face.z).applyMatrix4(mesh.matrixWorld);
        view.copy(eye).sub(location).normalize();
        reflected.copy(normal).multiplyScalar(2*view.dot(normal)).sub(view);
        const diffuse=.43+.51*Math.max(0,normal.dot(light))+.20*Math.max(0,normal.dot(rim));
        const sheen=metal*(.24+.65*Math.max(0,reflected.y))*(.70+.3*Math.sin(5.9*reflected.x-3.1*reflected.z));
        const spec=metal*(76*Math.pow(Math.max(0,reflected.dot(light)),10)+42*Math.pow(Math.max(0,reflected.dot(rim)),8));
        const k=mat.isMeshBasicMaterial?1:diffuse+sheen;
        const r=Math.min(255,red*k+spec)|0,g=Math.min(255,green*k+spec*.87)|0,bl=Math.min(255,blue*k+spec*.7)|0;
        raster(info,face,(255<<24)|(bl<<16)|(g<<8)|r,mesh.userData.cpuTexture||mat.userData.grain,w,h,mat.side===T.DoubleSide);
      }
    });
    context.putImageData(frameBuffer,0,0);
  }
  return {draw,captureTexture};
};
