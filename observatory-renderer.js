// The same selectable 3D geometry is drawn through WebGL or the canvas depth buffer.
window.makeObservatoryViewer = (T, host, positionPins) => {
    const scene = new T.Scene();
    const studio = new T.Group();
    const camera = new T.PerspectiveCamera(39, 1, .05, 80);
    const v = (x,y,z) => new T.Vector3(x,y,z);
    const material = (color,metalness=0,roughness=.64) => new T.MeshStandardMaterial({color,metalness,roughness});
    const brass = material(0xc59348,.53,.30);
    const gold = material(0xf6cc78,.38,.30);
    const wood = material(0x77401e,.04,.48);
    const lacquer = material(0x32221e);
    const ebony = material(0x16222d,.20,.4);
    const strings = material(0xefddae,.33,.35);
    const parchment = material(0xe9cea1,.05);
    const housing = material(0x252833);
    const mesh = (parent, geometry, mat, x=0,y=0,z=0) => {
      const part = new T.Mesh(geometry,mat);
      part.position.set(x,y,z);
      parent.add(part);
      return part;
    };
    const box = (p,w,h,d,m,x,y,z) => mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
    const cylinder = (p,r1,r2,h,m,x,y,z,n=24) => mesh(p,new T.CylinderGeometry(r1,r2,h,n),m,x,y,z);
    const ring = (p,r,t,m,x,y,z) => mesh(p,new T.TorusGeometry(r,t,6,48),m,x,y,z);
    function rod(p,start,end,radius,mat,tip=radius) {
      const axis=end.clone().sub(start);
      const center=start.clone().add(end).multiplyScalar(.5);
      const piece=cylinder(p,tip,radius,axis.length(),mat,center.x,center.y,center.z,16);
      piece.quaternion.setFromUnitVectors(v(0,1,0),axis.normalize());
      return piece;
    }
    const group = (p,x=0,y=0,z=0) => {
      const g=new T.Group();
      g.position.set(x,y,z);p.add(g);return g;
    };

    // Mesh strokes keep cardinal letters readable in the portable canvas renderer.
    function compassLetters(parent,radius,size,mat) {
      const paths={
        N:[[0,0],[0,1],[.72,0],[.72,1]],
        E:[[.72,1],[0,1],[0,0],[.72,0],null,[0,.5],[.57,.5]],
        S:[[.72,.9],[.56,1],[.12,1],[0,.8],[0,.61],[.7,.38],[.7,.16],[.56,0],[.10,0],[0,.10]],
        W:[[0,1],[.13,0],[.4,.56],[.67,0],[.8,1]]
      };
      Object.entries(paths).forEach(([label,points],index)=>{
        const bearing=index*Math.PI/2;
        const x=radius*Math.sin(bearing),y=radius*Math.cos(bearing);
        let previous;
        for(const point of points) {
          if(!point){previous=null;continue;}
          const next=v(x+(point[0]-.36)*size,y+(point[1]-.5)*size,0);
          if(previous)rod(parent,previous,next,size*.064,mat);
          previous=next;
        }
      });
    }
    // Rocky exhibition base and a row of distant lunar peaks.
    cylinder(studio,3.85,3.63,.24,material(0x323a37,.08),0,-.15,0,64);
    cylinder(studio,3.68,3.68,.045,brass,0,-.285,0,64);
    let seed=208;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<58;i++) {
      const theta=random()*Math.PI*2, r=1.2+random()*2.46;
      const rock=mesh(studio,new T.DodecahedronGeometry(.04+random()*.16),material(i%2?0x545a55:0x393f3b),r*Math.cos(theta),.015,r*Math.sin(theta));
      rock.scale.set(1.35,.48+random()*.3,.86);rock.rotation.y=theta;
    }
    for (let i=0;i<13;i++) {
      const angle=3.48+i*.19;
      const h=.22+random()*.53;
      const peak=mesh(studio,new T.ConeGeometry(.36+random()*.3,h,5),material(0x464c47),3.24*Math.cos(angle),h*.39,3.24*Math.sin(angle));
      peak.rotation.y=angle;
    }
    // Telescope, its mount, the finderscope and tapered wooden tripod.
    const scope=group(studio,.28,0,-.35);
    for(let i=0;i<3;i++) {
      const a=-.3+i*Math.PI*2/3;
      const foot=v(1.04*Math.cos(a),.03,1.04*Math.sin(a));
      const top=v(.18*Math.cos(a),1.95,.18*Math.sin(a));
      rod(scope,foot,top,.08,wood,.105);
      rod(scope,foot,foot.clone().lerp(top,.11),.084,brass);
      rod(scope,foot.clone().lerp(top,.40),v(0,.82,0),.025,brass);
    }
    cylinder(scope,.35,.28,.15,brass,0,1.92,0);
    cylinder(scope,.12,.19,.49,ebony,0,2.19,0);
    const hub=ring(scope,.27,.048,brass,0,2.45,.05);
    hub.rotation.z=.3;
    const tube=group(scope,0,2.56,0);
    tube.rotation.z=-.99;
    cylinder(tube,.23,.13,2.85,brass,0,.27,0);
    for (const [y,r] of [[-.99,.15],[-.80,.17],[.55,.213],[1.63,.25],[1.72,.27]]) cylinder(tube,r,r,.075,gold,0,y,0);
    cylinder(tube,.235,.235,.026,material(0x21564c,.36,.22),0,1.766,0);
    cylinder(tube,.095,.073,.39,ebony,0,-1.29,0);
    cylinder(tube,.10,.10,.07,gold,0,-1.51,0);
    rod(tube,v(-.22,-.82,0),v(-.22,-.05,0),.053,brass);
    box(tube,.16,.06,.07,ebony,-.16,-.54,0);

    // Guitar body, binding, fretboard, tuning pegs and six strings.
    const guitar=group(studio,-1.57,.20,.72);
    guitar.rotation.z=.15;guitar.rotation.y=.11;guitar.rotation.x=-.11;
    const shape=new T.Shape();
    shape.moveTo(0,0);
    shape.bezierCurveTo(-.69,-.03,-.75,.53,-.46,.80);
    shape.bezierCurveTo(-.28,.98,-.58,1.13,-.38,1.41);
    shape.bezierCurveTo(-.19,1.62,.19,1.62,.38,1.41);
    shape.bezierCurveTo(.58,1.13,.28,.98,.46,.8);
    shape.bezierCurveTo(.75,.53,.69,-.03,0,0);
    mesh(guitar,new T.ExtrudeGeometry(shape,{depth:.23,bevelThickness:.033,bevelSize:.028,bevelSegments:2,curveSegments:12}),wood);
    const sound=mesh(guitar,new T.CircleGeometry(.175,40),ebony,0,.97,.269);
    ring(guitar,.185,.014,gold,0,.97,sound.position.z+.004);
    box(guitar,.18,1.33,.10,lacquer,0,1.95,.24);
    box(guitar,.24,.39,.12,wood,0,2.76,.23);
    box(guitar,.41,.095,.049,ebony,0,.42,.285);
    for(let i=1;i<=15;i++) box(guitar,.18,.012,.012,strings,0,.42+2.22*Math.pow(2,-i/12),.298);
    box(guitar,.20,.035,.035,parchment,0,2.64,.30);
    box(guitar,.29,.028,.018,parchment,0,.42,.313);
    for(const fret of [3,5,7,9,12]) {
      const y=.42+2.22*Math.pow(2,-(fret-.5)/12);
      mesh(guitar,new T.CircleGeometry(.012,10),parchment,0,y,.301);
    }
    for(let i=0;i<6;i++) {
      const x=(i-2.5)*.026;
      rod(guitar,v(x,.42,.317),v(x,2.64,.317),.004,strings);
      const side=i%2?1:-1;
      rod(guitar,v(.10*side,2.63+Math.floor(i/2)*.11,.22),v(.185*side,2.63+Math.floor(i/2)*.11,.22),.024,brass);
    }
    cylinder(studio,.49,.49,.13,lacquer,-2.06,1.11,.13);
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      rod(studio,v(-2.06+.41*Math.cos(a),0,.13+.41*Math.sin(a)),v(-2.06+.28*Math.cos(a),1.08,.13+.28*Math.sin(a)),.047,wood);
    }

    // Open wooden compass with brass-edged case, rose, dial and pivoted needle.
    const compass=group(studio,1.88,.12,1.08);
    compass.rotation.y=-.23;
    box(compass,1.02,.22,.97,housing,0,.01,0);
    for(const x of [-.49,.49]) box(compass,.035,.24,.98,brass,x,.02,0);
    for(const z of [-.47,.47]) box(compass,1.01,.24,.035,brass,0,.02,z);
    cylinder(compass,.421,.421,.030,parchment,0,.145,0,56);
    const bezel=ring(compass,.433,.022,gold,0,.163,0);bezel.rotation.x=-Math.PI/2;
    for(let i=0;i<48;i++) {
      const a=i*Math.PI/24, long=i%4===0;
      const tick=box(compass,.011,.008,long?.066:.034,ebony,.379*Math.sin(a),.165,.379*Math.cos(a));tick.rotation.y=a;
    }
    function point(p,length,width,angle,mat,y) {
      const polygon=new T.Shape();
      polygon.moveTo(-width/2,0);polygon.lineTo(0,length);polygon.lineTo(width/2,0);polygon.closePath();
      const vane=mesh(p,new T.ShapeGeometry(polygon),mat,0,y,0);
      vane.rotation.order="YXZ";vane.rotation.x=-Math.PI/2;vane.rotation.y=angle;
      mat.side=T.DoubleSide;
    }
    for(let i=0;i<8;i++) point(compass,i%2?.18:.26,.08,i*Math.PI/4,i%2?brass:ebony,.172);
    point(compass,.33,.089,.58,material(0x9a3924),.188);
    point(compass,.30,.080,.58+Math.PI,ebony,.188);
    cylinder(compass,.05,.05,.034,gold,0,.204,0);
    const dialLetters=group(compass,0,.181,0);
    dialLetters.rotation.x=-Math.PI/2;
    compassLetters(dialLetters,.307,.074,ebony);
    const lid=group(compass,0,.12,-.47);lid.rotation.x=-.24;
    box(lid,1.0,.93,.075,housing,0,.465,0);
    for(const x of [-.48,.48]) box(lid,.028,.93,.08,brass,x,.465,.02);
    for(const y of [.016,.91]) box(lid,.98,.027,.08,brass,0,y,.02);
    ring(lid,.29,.012,brass,0,.46,.053);
    for(let j=0;j<4;j++) {
      const line=box(lid,.014,.59,.014,brass,0,.46,.06);line.rotation.z=j*Math.PI/4;
    }
    box(compass,.16,.10,.045,gold,0,.0,.51);

    const eclipse=group(studio,0,2.55,-3.3);
    mesh(eclipse,new T.SphereGeometry(.88,32,20),material(0x181d1b,.13),0,0,0);
    ring(eclipse,.905,.047,new T.MeshBasicMaterial({color:0xd2f8e4}),0,0,.01);
    scene.add(new T.HemisphereLight(0xe9f4ec,0x515d55,2.0));
    const key=new T.DirectionalLight(0xffe6cb,2.45);key.position.set(-3,6,4);scene.add(key);
    const rim=new T.DirectionalLight(0xaaf9d5,2.1);rim.position.set(4,3,-3);scene.add(rim);


    function isolate(original) {
      const copy=original.clone(true);
      copy.position.set(0,0,0);
      return copy;
    }
    const isolated={guitar:isolate(guitar),telescope:isolate(scope),compass:isolate(compass)};
    const labs=window.makeInstrumentLabs(T,{v,material,mesh,box,ring,rod,group,compassLetters});
    const models={reset:studio,...isolated,...labs.models};
    let space;
    function modelFor(id) {
      if(id==="bridge") return isolated.guitar;
      if(id==="rose") return isolated.compass;
      if(models[id]) return models[id];
      if(!space) space=window.makeObservatorySpace(T);
      return space[id==="summit"?"tycho":id];
    }
    const localPoint=(model,x,y,z)=>model.localToWorld(v(x,y,z)).toArray();
    const presets = {
      reset: {look:[0,1.4,0], distance:10.8, yaw:.23, pitch:.29,
        pins:{solar:[.10,3.42,-3.3],guitar:[-1.9,1.4,.88],telescope:[1.57,3.46,-.32],compass:[2.03,.40,1.16]}},
      guitar: {look:localPoint(isolated.guitar,0,1.41,.13),distance:4.9,yaw:.11,pitch:.08,
        pins:{bridge:localPoint(isolated.guitar,0,.45,.32)}},
      bridge: {look:localPoint(isolated.guitar,0,.79,.27),distance:1.87,yaw:-.25,pitch:.17,
        pins:{octave:localPoint(isolated.guitar,0,1.15,.317)}},
      compass: {look:[0,.36,-.02],distance:2.65,yaw:.20,pitch:.65,pins:{rose:localPoint(isolated.compass,0,.16,.08)}},
      rose: {look:localPoint(isolated.compass,0,.16,.02),distance:1.33,yaw:.07,pitch:1.30,
        pins:{declination:localPoint(isolated.compass,0,.20,0)}},
      telescope: {look:[.23,1.93,0],distance:6.15,yaw:.30,pitch:.20,
        pins:{objective:[1.48,3.50,0]}},
      objective:{distance:4.3,yaw:.25,pitch:.14,pins:{eyepiece:[.99,0,0]}},
      eyepiece:{distance:4.25,pins:{saturn:[0,0,.45]}},
      octave:{distance:4.3,pitch:.17},
      declination:{distance:3.7},
      eclipse:{distance:3.8},
      solar:{distance:5.35,pitch:.03,pins:{saturn:[-1.026,.796,-.550],moon:[-.454,-.182,.286],eclipse:[0,0,.05]}},
      saturn:{distance:4.65,pitch:.04,pins:{rings:[1.210,-.474,.552]}},
      rings:{distance:5.05,pitch:.05,pins:{cassini:[.892,.161,-.185]}},
      cassini:{distance:5.1,pitch:.06}, moon:{distance:4.45,pitch:.02,pins:{lunarSurface:[-.206,-.902,.969]}},
      lunarSurface:{distance:4.95,pitch:.06,pins:{tycho:[.125,-.276,.221]}},
      tycho:{distance:5.25,pitch:.04,pins:{summit:[-.013,-.067,-.086]}},
      summit:{look:[-.013,-.067,-.086],distance:2.25,yaw:.13,pitch:-.20}

    };
    let activeModel,activeId,dirtyMeshes=false;
    // A projected-face renderer keeps the same rotatable geometry available without WebGL.
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    let gpu;
    try {
      const deviceCanvas=document.createElement("canvas");
      const options={antialias:true,alpha:true};
      const context=deviceCanvas.getContext("webgl2",options)||deviceCanvas.getContext("webgl",options);
      if(context)gpu=new T.WebGLRenderer({canvas:deviceCanvas,context,...options});
    } catch { gpu=null; }
    const surface=gpu?gpu.domElement:canvas;
    surface.setAttribute("aria-hidden","true");
    host.prepend(surface);
    let paintSoftware;
    if (!gpu) {
      const ctx=canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas");
      const geometryCache=new WeakMap();
      function collectFaces(root) {
        const faces=[];
        root.updateMatrixWorld(true);
        const light=v(-.5,.9,.8).normalize();
        root.traverseVisible(obj=>{
          if(!obj.isMesh) return;
          const geom=obj.geometry, pos=geom.attributes.position, order=geom.index?.array;
          const vertices=Array.from({length:pos.count},(_,i)=>v(0,0,0).fromBufferAttribute(pos,i).applyMatrix4(obj.matrixWorld));
          const count=order?.length??pos.count;
          for(let k=0;k<count;k+=3) {
            const [a,b,c]=[k,k+1,k+2].map(i=>vertices[order?order[i]:i]);
            const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
            const shade=.52+.48*Math.max(0,normal.dot(light));
            const color=obj.material.color.clone().multiplyScalar(obj.material.isMeshBasicMaterial?1:shade);
            const rgb=color.getHex();
            const pixel=(255<<24) | ((rgb&255)<<16) | (rgb&0xff00) | ((rgb>>16)&255);
            faces.push({a,b,c,normal,pixel,double:obj.material.side===T.DoubleSide});
          }
        });
        return faces;
      }
      let image,pixels,depth;
      function raster(a,b,c,color,w,h) {
        const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
        if(Math.abs(area)<.0001)return;
        const left=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x)));
        const right=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x)));
        const top=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y)));
        const bottom=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
        const dx1=(c.y-a.y)/area,dy1=(a.x-c.x)/area;
        const dx2=(a.y-b.y)/area,dy2=(b.x-a.x)/area;
        for(let y=top;y<=bottom;y++) {
          let u=(left+.5-a.x)*dx1+(y+.5-a.y)*dy1;
          let t=(left+.5-a.x)*dx2+(y+.5-a.y)*dy2;
          for(let x=left;x<=right;x++,u+=dx1,t+=dx2) {
            if(u<0||t<0||u+t>1)continue;
            const index=y*w+x,z=a.z+u*(b.z-a.z)+t*(c.z-a.z);
            if(z>=depth[index])continue;
            depth[index]=z;pixels[index]=color;
          }
        }
      }
      paintSoftware=(w,h)=>{
        if (dirtyMeshes || !geometryCache.has(activeModel)) {
          geometryCache.set(activeModel,collectFaces(activeModel));
          dirtyMeshes=false;
        }
        const faces=geometryCache.get(activeModel);
        if(!image||image.width!==w||image.height!==h) {
          image=ctx.createImageData(w,h);pixels=new Uint32Array(image.data.buffer);depth=new Float32Array(w*h);
        }
        pixels.fill(0);depth.fill(Infinity);
        const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
        const projected=new Map();
        const screen=point=>{
          if(!projected.has(point)) {
            const q=point.clone().applyMatrix4(matrix);
            q.x=(q.x+1)*w/2;q.y=(1-q.y)*h/2;projected.set(point,q);
          }
          return projected.get(point);
        };
        for(const f of faces) {
          const n=f.normal,eye=camera.position;
          if(!f.double && n.x*(eye.x-f.a.x)+n.y*(eye.y-f.a.y)+n.z*(eye.z-f.a.z)<=0)continue;
          const a=screen(f.a),b=screen(f.b),c=screen(f.c);
          if(Math.max(a.z,b.z,c.z)>=1||Math.min(a.z,b.z,c.z)<=-1)continue;
          raster(a,b,c,f.pixel,w,h);
        }
        ctx.putImageData(image,0,0);
      };
    }
    let yaw=0,pitch=0,radius=6,relativeZoom=1,frame=0;
    const target=v(0,0,0), projection=v(0,0,0);
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    let easeStart=0,pluckStart=0;
    function render() { if(!frame) frame=requestAnimationFrame(draw); }
    function draw(time) {
      frame=0;
      if(!activeModel || !host.closest("dialog").open) return;
      const w=host.clientWidth,h=host.clientHeight;
      if(!w||!h)return;
      const t=easeStart?Math.min(1,(time-easeStart)/460):1;
      if(t>=1) easeStart=0;
      if(pluckStart) {
        const secs=(time-pluckStart)/1000;
        labs.wave.scale.y=secs<1.25?Math.cos(secs*23)*Math.exp(-secs*2.7):1;
        dirtyMeshes=true;
        if(secs>=1.25) pluckStart=0;
      }
      camera.aspect=w/h;camera.updateProjectionMatrix();
      const d=radius*relativeZoom*(1+.22*(1-t)**3)*Math.max(1,1.35/camera.aspect);
      camera.position.set(target.x+d*Math.sin(yaw)*Math.cos(pitch),target.y+d*Math.sin(pitch),target.z+d*Math.cos(yaw)*Math.cos(pitch));
      camera.lookAt(target);camera.updateMatrixWorld();
      if(gpu) {
        const scale=Math.min(devicePixelRatio,1.75);
        if(surface.width!==Math.floor(w*scale)||surface.height!==Math.floor(h*scale)){
          gpu.setPixelRatio(scale);gpu.setSize(w,h,false);
        }
        gpu.render(scene,camera);
      } else {
        const scale=Math.min(1,680/w,490/h);
        const pw=Math.round(w*scale),ph=Math.round(h*scale);
        if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
        paintSoftware(pw,ph);
      }
      const pinLocations={};
      for (const [id,coords] of Object.entries(presets[activeId].pins||{})) {
        projection.fromArray(coords).project(camera);
        if(projection.z>-1 && projection.z<1 && Math.abs(projection.x)<.94 && Math.abs(projection.y)<.92)
          pinLocations[id]=[(projection.x+1)*50,(1-projection.y)*50];
      }
      positionPins(t < 1 ? {} : pinLocations);
      if(easeStart || pluckStart) render();
    }
    function resetCamera() {
      const p=presets[activeId];
      yaw=p.yaw||0;pitch=p.pitch||0;radius=p.distance;relativeZoom=1;target.fromArray(p.look||[0,0,0]);render();
    }
    function select(id) {
      const next=modelFor(id);
      if(!next)throw new Error("Missing exhibit model");
      if(activeModel) scene.remove(activeModel);
      activeId=id;activeModel=next;scene.add(next);
      if(pluckStart){pluckStart=0;labs.wave.scale.y=1;}
      dirtyMeshes=true;
      easeStart=reduced.matches||document.documentElement.dataset.motion==="off"?0:performance.now();
      resetCamera();
    }
    function zoom(factor) {
      relativeZoom=Math.max(.43,Math.min(2.1,relativeZoom*factor));
      easeStart=0;render();
    }
    function turn(dx,dy=0) {
      yaw+=dx;pitch=Math.max(-1.46,Math.min(1.46,pitch+dy));
      easeStart=0;render();
    }
    function change(value) {
      pluckStart=0;labs.change(activeId,value);dirtyMeshes=true;render();
    }
    function pluck() {
      if(!reduced.matches && document.documentElement.dataset.motion!=="off"){pluckStart=performance.now();render();}
    }
    const pointers=new Map();
    const spread=()=>{const [a,b]=pointers.values();return Math.hypot(a[0]-b[0],a[1]-b[1]);};
    host.addEventListener("pointerdown",e=>{
      if(e.button!==0||e.target.closest("button")) return;
      pointers.set(e.pointerId,[e.clientX,e.clientY]);host.setPointerCapture(e.pointerId);
    });
    host.addEventListener("pointermove",e=>{
      const old=pointers.get(e.pointerId);if(!old)return;
      const before=pointers.size===2?spread():0;
      pointers.set(e.pointerId,[e.clientX,e.clientY]);
      if(pointers.size===1)turn((old[0]-e.clientX)*.009,(e.clientY-old[1])*.008);
      else if(before>2 && spread()>2)zoom(before/spread());
    });
    host.addEventListener("lostpointercapture",e=>pointers.delete(e.pointerId));
    host.addEventListener("wheel",e=>{e.preventDefault();zoom(Math.exp(Math.max(-190,Math.min(190,e.deltaY))*.0015));},{passive:false});
    host.addEventListener("keydown",e=>{
      if(e.target!==host)return;
      const actions={ArrowLeft:()=>turn(-.2),ArrowRight:()=>turn(.2),ArrowUp:()=>turn(0,.15),ArrowDown:()=>turn(0,-.15),
        "+":()=>zoom(.8),"=":()=>zoom(.8),"-":()=>zoom(1.25),Home:resetCamera};
      if(actions[e.key]){e.preventDefault();actions[e.key]();}
    });
    new ResizeObserver(render).observe(host);
    return {select,change,pluck,zoom,turn,resetCamera};
};
