// Load the 3D engine only after a visitor opens the observatory.
(() => {
  const trigger = document.querySelector("#explore-scene");
  if (!trigger) return;
  trigger.hidden = false;
  const panel = document.createElement("dialog");
  panel.className = "scene-dialog";
  panel.setAttribute("aria-labelledby", "scene-title");
  panel.innerHTML = `
    <header><h2 id="scene-title">The observatory</h2><button type="button" class="close-dialog" aria-label="Close 3D view">×</button></header>
    <div class="stage" role="group" tabindex="0" aria-label="Interactive 3D observatory. Drag to orbit or use the left and right arrow keys."></div>
    <div class="scene-tools"><span class="scene-status" role="status">Loading the model…</span>
      <div><button type="button" data-view="left" aria-label="Rotate left">←</button><button type="button" data-view="right" aria-label="Rotate right">→</button>
      <button type="button" data-view="compass">Compass close-up</button><button type="button" data-view="reset">Reset view</button></div>
    </div>`;
  document.body.append(panel);
  const stage = panel.querySelector(".stage");
  const status = panel.querySelector(".scene-status");
  let engine;
  let viewer;
  function loadEngine() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!engine) engine = new Promise((resolve,reject) => {
      const script = document.createElement("script");
      script.src = "three.min.js";
      script.onload = () => resolve(window.THREE);
      script.onerror = () => { engine = null; script.remove(); reject(new Error("3D library unavailable")); };
      document.head.append(script);
    });
    return engine;
  }
  trigger.addEventListener("click", async () => {
    panel.showModal();
    try {
      const T = await loadEngine();
      if (!panel.open) return;
      if (!viewer) viewer = buildViewer(T, stage);
      viewer.setView("reset");
      status.textContent = "Drag to orbit";
      stage.focus();
    } catch {
      status.textContent = "The 3D view couldn’t load. Close to return to the artwork.";
    }
  });
  panel.querySelector(".close-dialog").addEventListener("click", () => panel.close());
  panel.addEventListener("close", () => trigger.focus());
  for (const button of panel.querySelectorAll("[data-view]")) {
    button.addEventListener("click", () => viewer?.setView(button.dataset.view));
  }

  function buildViewer(T, host) {
    const scene = new T.Scene();
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

    // Rocky exhibition base and a row of distant lunar peaks.
    cylinder(scene,3.85,3.63,.24,material(0x283749,.08),0,-.15,0,64);
    cylinder(scene,3.68,3.68,.045,brass,0,-.285,0,64);
    let seed=208;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<58;i++) {
      const theta=random()*Math.PI*2, r=1.2+random()*2.46;
      const rock=mesh(scene,new T.DodecahedronGeometry(.04+random()*.16),material(i%2?0x455166:0x394658),r*Math.cos(theta),.015,r*Math.sin(theta));
      rock.scale.set(1.35,.48+random()*.3,.86);rock.rotation.y=theta;
    }
    for (let i=0;i<13;i++) {
      const angle=3.48+i*.19;
      const h=.22+random()*.53;
      const peak=mesh(scene,new T.ConeGeometry(.36+random()*.3,h,5),material(0x43566e),3.24*Math.cos(angle),h*.39,3.24*Math.sin(angle));
      peak.rotation.y=angle;
    }
    // Telescope, its mount, the finderscope and tapered wooden tripod.
    const scope=group(scene,.28,0,-.35);
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
    cylinder(tube,.235,.235,.026,material(0x1c5464,.36,.22),0,1.766,0);
    cylinder(tube,.095,.073,.39,ebony,0,-1.29,0);
    cylinder(tube,.10,.10,.07,gold,0,-1.51,0);
    rod(tube,v(-.22,-.82,0),v(-.22,-.05,0),.053,brass);
    box(tube,.16,.06,.07,ebony,-.16,-.54,0);

    // Guitar body, binding, fretboard, tuning pegs and six strings.
    const guitar=group(scene,-1.57,.20,.72);
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
    for(let i=0;i<13;i++) box(guitar,.18,.012,.012,strings,0,1.34+i*.085,.298);
    for(let i=0;i<6;i++) {
      const x=(i-2.5)*.026;
      rod(guitar,v(x,.42,.317),v(x,2.64,.317),.004,strings);
      const side=i%2?1:-1;
      rod(guitar,v(.10*side,2.63+Math.floor(i/2)*.11,.22),v(.185*side,2.63+Math.floor(i/2)*.11,.22),.024,brass);
    }
    cylinder(scene,.49,.49,.13,lacquer,-2.06,1.11,.13);
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      rod(scene,v(-2.06+.41*Math.cos(a),0,.13+.41*Math.sin(a)),v(-2.06+.28*Math.cos(a),1.08,.13+.28*Math.sin(a)),.047,wood);
    }

    // Open wooden compass with brass-edged case, rose, dial and pivoted needle.
    const compass=group(scene,1.88,.12,1.08);
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
    const lid=group(compass,0,.12,-.47);lid.rotation.x=-.24;
    box(lid,1.0,.93,.075,housing,0,.465,0);
    for(const x of [-.48,.48]) box(lid,.028,.93,.08,brass,x,.465,.02);
    for(const y of [.016,.91]) box(lid,.98,.027,.08,brass,0,y,.02);
    ring(lid,.29,.012,brass,0,.46,.053);
    for(let j=0;j<4;j++) {
      const line=box(lid,.014,.59,.014,brass,0,.46,.06);line.rotation.z=j*Math.PI/4;
    }
    box(compass,.16,.10,.045,gold,0,.0,.51);

    const eclipse=group(scene,0,2.55,-3.3);
    mesh(eclipse,new T.SphereGeometry(.88,32,20),material(0x152032,.13),0,0,0);
    ring(eclipse,.905,.047,new T.MeshBasicMaterial({color:0xffb74c}),0,0,.01);
    scene.add(new T.HemisphereLight(0xe3f1ff,0x576174,2.0));
    const key=new T.DirectionalLight(0xffddab,2.45);key.position.set(-3,6,4);scene.add(key);
    const rim=new T.DirectionalLight(0x93dfff,2.1);rim.position.set(4,3,-3);scene.add(rim);

    // A projected-face renderer keeps the same rotatable geometry available without WebGL.
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    let gpu;
    try { gpu=new T.WebGLRenderer({antialias:true, alpha:true}); } catch { gpu=null; }
    const surface=gpu?gpu.domElement:canvas;
    host.append(surface);
    let paintSoftware;
    if (!gpu) {
      const ctx=canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas");
      scene.updateMatrixWorld(true);
      const faces=[];
      const light=v(-.5,.9,.8).normalize();
      scene.traverse(obj=>{
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
    let angle=.23, pitch=.30, distance=10.2, target=v(0,1.35,0), queued=false;
    function draw() {
      queued=false;
      const w=host.clientWidth,h=host.clientHeight;
      if(!w||!h) return;
      camera.aspect=w/h;camera.updateProjectionMatrix();
      const d=distance*Math.max(1,1.12/camera.aspect);
      camera.position.set(target.x+d*Math.sin(angle)*Math.cos(pitch),target.y+d*Math.sin(pitch),target.z+d*Math.cos(angle)*Math.cos(pitch));
      camera.lookAt(target);camera.updateMatrixWorld();
      if(gpu) {
        gpu.setPixelRatio(Math.min(devicePixelRatio,2));gpu.setSize(w,h,false);gpu.render(scene,camera);
      } else {
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        paintSoftware(w,h);
      }
    }
    const render=()=>{if(!queued){queued=true;requestAnimationFrame(draw);}};
    const setView=mode=>{
      if(mode==="compass"){angle=.30;pitch=.72;distance=2.8;target=v(1.88,.48,1.05);}
      else if(mode==="reset"){angle=.23;pitch=.30;distance=10.2;target=v(0,1.35,0);}
      else angle+=(mode==="left"?-.22:.22);
      render();
    };
    let drag=null;
    host.addEventListener("pointerdown",e=>{
      if(!e.isPrimary||e.button!==0)return;
      drag=[e.clientX,e.clientY];host.setPointerCapture(e.pointerId);
    });
    host.addEventListener("pointermove",e=>{
      if(!drag||!e.isPrimary)return;
      angle-=(e.clientX-drag[0])*.009;
      pitch=Math.max(.06,Math.min(1.15,pitch+(e.clientY-drag[1])*.007));
      drag=[e.clientX,e.clientY];render();
    });
    host.addEventListener("lostpointercapture",()=>{drag=null;});
    host.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setView(e.key==="ArrowLeft"?"left":"right");}
    });
    new ResizeObserver(render).observe(host);
    return {setView};
  }
})();
