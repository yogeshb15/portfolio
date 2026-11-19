// All stations occupy persistent positions in one world. A moving camera frames the active work.
window.makePortfolioWorld = (host, names, onLayout, onPick) => {
  const T=window.THREE;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(39,1,.08,96);
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const mat=(color,metalness=.1,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const gold=mat(0xd9a34c,.77,.23),bronze=mat(0x674632,.7,.43),edge=mat(0xf3d391,.64,.27);
  const marble=mat(0x263f3c,.22,.28),base=mat(0x172b2b,.35,.40),walnut=mat(0x533025,.20,.34);
  const stone=mat(0x34433e,.13,.7),mould=mat(0x324f48,.41,.42);
  const add=(parent,geom,material,x=0,y=0,z=0)=>{
    const obj=new T.Mesh(geom,material);obj.position.set(x,y,z);parent.add(obj);return obj;
  };
  const cube=(p,w,h,d,m,x,y,z)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
  const disk=(p,top,bottom,h,m,y,n=64)=>add(p,new T.CylinderGeometry(top,bottom,h,n),m,0,y,0);
  const hoop=(p,r,t,m,y)=>{const o=add(p,new T.TorusGeometry(r,t,6,72),m,0,y,0);o.rotation.x=-Math.PI/2;return o;};
  let cpu,gpu,canvas;
  try{
    const device=document.createElement("canvas");
    const options={alpha:true,antialias:true,powerPreference:"low-power"};
    const gl=device.getContext("webgl2",options)||device.getContext("webgl",options);
    if(gl)gpu=new T.WebGLRenderer({canvas:device,context:gl,...options});
  }catch{}
  if(gpu){
    canvas=gpu.domElement;gpu.setClearColor(0,0);gpu.outputColorSpace=T.SRGBColorSpace;gpu.toneMapping=T.ACESFilmicToneMapping;gpu.toneMappingExposure=1.08;
  }else{canvas=document.createElement("canvas");cpu=window.makeGalleryPainter(T,canvas);}
  canvas.setAttribute("aria-hidden","true");host.prepend(canvas);
  // Tileable, neutral material maps let the same stone and wood respond to each renderer's light.
  function grain(material,wood){
    const tile=document.createElement("canvas");tile.width=tile.height=256;
    const ctx=tile.getContext("2d"),image=ctx.createImageData(256,256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const u=x*Math.PI/128,w=y*Math.PI/128;
      const warp=Math.sin(w+Math.sin(u*2))+.35*Math.sin(3*u+2*w);
      const streak=Math.sin((wood?13:2)*u+(wood?1:3)*w+3*warp);
      const grain=wood?16*streak+7*Math.sin(53*u+7*warp):13*Math.sin(u+w+warp)+34*Math.pow(Math.max(0,1-Math.abs(streak)),12);
      const i=(y*256+x)*4,level=Math.min(255,211+grain+4*Math.sin(71*u+57*w));
      image.data[i]=image.data[i+1]=image.data[i+2]=level;image.data[i+3]=255;
    }
    ctx.putImageData(image,0,0);
    if(gpu){const t=new T.CanvasTexture(tile);t.colorSpace=T.SRGBColorSpace;material.map=t;}
    else material.userData.grain={w:256,h:256,data:new Uint32Array(image.data.buffer)};
  }
  grain(stone,false);grain(marble,false);grain(walnut,true);
  const sculptures=window.makePortfolioSculptures(T);
  const N=names.length,R=8.8,step=Math.PI*2/N;
  const stations=[],shadowPos=v(),proj=v(),look=v(),targetPos=v();
  let pictureMesh,frame=0,width=0,height=0,rotation=0,tilt=0,magnification=1;
  let index=0,orbit=0,destination=0,map=0,mapTarget=0,reading=false,readMix=0;
  let wasFast=false,clock=0,last=0,spin=0,drag=null,forced=true,motion=true,mapYaw=.13;
  const tiltLimit=.37;
  const studio=new T.Group();scene.add(studio);
  function framePortrait(parent){
    const mount=new T.Group();mount.position.set(.29,1.16,-.18);mount.rotation.y=-.37;parent.add(mount);
    const side=2.02,thick=.115;
    cube(mount,side+.19,side+.19,.12,walnut,0,0,-.03);
    cube(mount,side+.105,side+.105,.09,gold,0,0,.041);
    cube(mount,side+.043,side+.043,.07,bronze,0,0,.09);
    pictureMesh=add(mount,new T.PlaneGeometry(side,side),new T.MeshBasicMaterial({color:0xffffff}),0,0,.137);
    for(const sign of [-1,1]){
      cube(mount,side+.24,thick*.38,.05,edge,0,sign*(side/2+.101),.08);
      cube(mount,thick*.38,side+.24,.05,edge,sign*(side/2+.101),0,.08);
      cube(mount,side+.10,.017,.05,gold,0,sign*(side/2+.024),.131);
      cube(mount,.017,side+.10,.05,gold,sign*(side/2+.024),0,.131);
      cube(mount,.10,.30,.23,bronze,sign*.70,-1.12,-.03);
    }
  }
  names.forEach((id,i)=>{
    const a=i*step,root=new T.Group(),display=new T.Group(),pivot=new T.Group();
    root.position.set(R*Math.sin(a),0,-R*Math.cos(a));root.rotation.y=-a;
    studio.add(root);root.add(display);display.add(pivot);
    disk(display,1.40,1.53,.10,base,.065);disk(display,1.43,1.40,.055,gold,.144);
    disk(display,1.27,1.38,.12,mould,.225);disk(display,1.18,1.24,.32,marble,.44);
    disk(display,1.28,1.18,.09,gold,.647);disk(display,1.32,1.31,.09,bronze,.737);
    disk(display,1.285,1.32,.052,stone,.805);hoop(display,1.26,.018,edge,.829);
    for(let j=0;j<28;j++){
      const theta=j*Math.PI/14;
      const f=cube(display,.024,.27,.021,bronze,1.211*Math.sin(theta),.44,1.211*Math.cos(theta));
      f.rotation.y=theta;
    }
    pivot.position.y=.842;
    const item=sculptures[id];
    if(!item)throw new Error("A gallery sculpture is missing.");
    if(id==="about"){
      framePortrait(pivot);
      item.scale.setScalar(.58);item.position.set(-.98,0,.53);
    }else item.scale.setScalar(1.18);
    pivot.add(item);
    stations.push({id,root,pivot,display,item,a});
  });
  // A segmented brass arcade and inlaid floors occupy real positions around the gallery.
  const architecture=new T.Group();scene.add(architecture);
  const railMetal=mat(0x816747,.65,.42), iron=mat(0x283e3a,.46,.48);
  const rod=(p,from,to,r,m)=>{
    const direction=to.clone().sub(from);
    const o=add(p,new T.CylinderGeometry(r,r,direction.length(),8),m);
    o.position.copy(from).lerp(to,.5);o.quaternion.setFromUnitVectors(v(0,1,0),direction.normalize());
    return o;
  };
  for(const station of stations){
    const bay=new T.Group();const a=station.a+step/2,b=a+step,radius=13.7;
    const point=(angle,y)=>v(radius*Math.sin(angle),y,-radius*Math.cos(angle));
    architecture.add(bay);
    const column=point(a,0),plinth=new T.Group();plinth.position.copy(column);bay.add(plinth);
    disk(plinth,.28,.34,.17,bronze,.08,12);disk(plinth,.22,.26,.32,iron,.31,12);
    disk(plinth,.11,.18,4.28,railMetal,2.58,16);disk(plinth,.22,.16,.17,gold,4.76,16);
    for(const y of [.73,1.0])rod(bay,point(a,y),point(b,y),.034,railMetal);
    for(let i=1;i<12;i++){const c=point(a,0).lerp(point(b,0),i/12);rod(bay,c.clone().add(v(0,.12,0)),c.clone().add(v(0,.73,0)),.018,iron);}
    const curve=[];
    for(let i=0;i<=20;i++){const t=i/20;curve.push(point(a+(b-a)*t,4.83+1.62*Math.sin(Math.PI*t)));}
    add(bay,new T.TubeGeometry(new T.CatmullRomCurve3(curve),24,.075,8,false),railMetal);
    const pad=new T.Group();station.root.add(pad);
    disk(pad,2.0,2.03,.036,walnut,-.005,64);hoop(pad,1.96,.019,edge,.016);hoop(pad,1.65,.011,railMetal,.016);
    for(let j=0;j<32;j++){
      const theta=j*Math.PI/16, radius=j%4===0?1.82:1.90;
      const tick=cube(pad,.018,.008,j%4===0?.18:.065,railMetal,radius*Math.sin(theta),.018,radius*Math.cos(theta));tick.rotation.y=theta;
    }
  }
  const mapFloor=new T.Group();scene.add(mapFloor);
  disk(mapFloor,R+2,R+2,.15,base,-.15,96);disk(mapFloor,R+1.94,R+1.94,.03,stone,-.06,96);
  for(const rad of [3.2,6.3,R-1.6,R+1.6])hoop(mapFloor,rad,.024,gold,-.027);
  for(const s of stations){
    const ray=cube(mapFloor,.032,.015,R+1.9,bronze,Math.sin(s.a)*(R+1.9)/2,-.025,-Math.cos(s.a)*(R+1.9)/2);
    ray.rotation.y=-s.a;
  }
  const centre=disk(mapFloor,1.03,1.28,.18,walnut,.038);
  hoop(centre,.96,.026,edge,.10);
  scene.add(new T.HemisphereLight(0xffeed8,0x52696e,2.1));
  const key=new T.DirectionalLight(0xffdfac,2.8);key.position.set(-5,8,6);scene.add(key);
  const rimLight=new T.DirectionalLight(0x91e5ff,2);rimLight.position.set(4,4,-6);scene.add(rimLight);
  const fill=new T.DirectionalLight(0xffb870,.8);fill.position.set(4,3,6);scene.add(fill);
  function texture(path,callback) {
    const img=new Image();img.onload=()=>callback(img);img.src=path;
  }
  texture("assets/yogesh-bhardwaj.jpg",img=>{
    if(gpu){const t=new T.Texture(img);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;pictureMesh.material.map=t;pictureMesh.material.needsUpdate=true;}
    else pictureMesh.userData.cpuTexture=cpu.captureTexture(img);
    request();
  });
  if(gpu)texture("assets/gallery-at-twilight.webp",img=>{
    const t=new T.Texture(img);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;
    scene.environment=t;request();
  });
  const raycaster=new T.Raycaster();
  function pickAt(x,y){
    const bounds=host.getBoundingClientRect();
    raycaster.setFromCamera(new T.Vector2((x-bounds.left)/bounds.width*2-1,1-(y-bounds.top)/bounds.height*2),camera);
    const hits=raycaster.intersectObjects(stations.filter(s=>s.root.visible).map(s=>s.root),true);
    if(!hits.length)return;
    let hit=hits[0].object;
    while(hit && !stations.some(s=>s.root===hit))hit=hit.parent;
    const found=stations.findIndex(s=>s.root===hit);if(found>=0)onPick(found,!!mapTarget);
  }
  function request() { forced=true;if(!frame)frame=requestAnimationFrame(draw); }
  function draw(now){
    frame=0;
    if(document.hidden || !host.isConnected)return;
    const dt=Math.min(.085,Math.max(0,(now-(last||now))/1000));
    const anim=Math.abs(orbit-destination)>.0008||Math.abs(map-mapTarget)>.001||Math.abs(readMix-Number(reading))>.001;
    const idle=motion&&!reading&&!mapTarget&&!drag&&!document.querySelector("dialog[open]");
    const interval=cpu?(anim||drag?31:105):21;
    if(now-clock<interval&&!forced&&!wasFast){if(anim||idle)frame=requestAnimationFrame(draw);return;}
    if(!forced&&!anim&&!idle&&!wasFast)return;
    last=now;clock=now;forced=false;
    const lerp=motion?Math.min(1,1-Math.exp(-dt*7.6)):1;
    orbit+= (destination-orbit)*lerp;map+=(mapTarget-map)*lerp;readMix+=(Number(reading)-readMix)*lerp;
    if(Math.abs(orbit-destination)<.0008)orbit=destination;
    if(Math.abs(map-mapTarget)<.001)map=mapTarget;
    if(Math.abs(readMix-Number(reading))<.001)readMix=Number(reading);
    if(idle&&dt)spin+=dt*.17;
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    const narrow=w<720;
    if(width!==w||height!==h){
      width=w;height=h;camera.aspect=w/h;camera.updateProjectionMatrix();
      if(gpu){gpu.setPixelRatio(Math.min(devicePixelRatio,1.65));gpu.setSize(w,h,false);}
    }
    const angle=orbit*step,sa=Math.sin(angle),ca=Math.cos(angle);
    const tangent=v(ca,0,sa),inward=v(-sa,0,ca);
    const center=v(R*sa,0,-R*ca);
    const lookY=narrow?1.52:1.63;
    const distance=(narrow?6.65:7.05)*Math.max(1,1.02/camera.aspect)*magnification;
    const offset=narrow?0:distance*Math.tan(camera.fov*Math.PI/360)*camera.aspect*(-.412+.84*readMix);
    const yawOffset=rotation+.105*Math.sin(spin);
    const screenRight=tangent.clone().multiplyScalar(Math.cos(yawOffset)).addScaledVector(inward,-Math.sin(yawOffset));
    look.copy(center).addScaledVector(screenRight,offset);look.y=lookY;
    targetPos.copy(look).addScaledVector(inward,distance*Math.cos(yawOffset)*Math.cos(tilt))
      .addScaledVector(tangent,distance*Math.sin(yawOffset)*Math.cos(tilt));targetPos.y=lookY+1.06+distance*Math.sin(tilt);
    const fit=Math.max(1,1.24/camera.aspect);
    const mapDistance=34*fit,mapHeight=27.8*fit;
    const shift=narrow?0:-2.2;
    const mapLook=v(Math.cos(mapYaw)*shift,0,-Math.sin(mapYaw)*shift);
    targetPos.lerp(v(Math.sin(mapYaw)*mapDistance*.55,mapHeight,Math.cos(mapYaw)*mapDistance*.55).add(mapLook),map);
    look.lerp(mapLook,map);
    camera.position.copy(targetPos);camera.lookAt(look);camera.updateMatrixWorld();
    mapFloor.visible=map>.71;architecture.visible=map<.68;
    const activeStation=stations[index];
    stations.forEach((s,i)=>{
      const delta=Math.abs(Math.atan2(Math.sin(s.a-angle),Math.cos(s.a-angle)));
      s.root.visible=map>.08||delta<1.05;
      if(s.id!=="about")s.item.rotation.y=.16*Math.sin(spin+i)+.07;
      else s.item.rotation.y=spin*.55;
    });
    wasFast=anim||!!drag;
    if(gpu)gpu.render(scene,camera);else cpu.draw(scene,camera,w,h,wasFast);
    const pins=[];
    const project=(point)=>{proj.copy(point).project(camera);return {x:(proj.x+1)*50,y:(1-proj.y)*50,shown:proj.z>-1&&proj.z<1};};
    if(mapTarget)for(const s of stations)pins.push(project(s.root.localToWorld(v(0,.38,.95))));
    shadowPos.copy(activeStation.root.position);shadowPos.y=.025;
    const shadow=project(shadowPos),right=project(activeStation.root.localToWorld(v(1.65,.02,0)));
    const yaw=angle+yawOffset;
    onLayout({pins,shadow,shadowWidth:Math.abs(right.x-shadow.x)*2,angle:yaw,map,reading:readMix,transit:anim,
      parallax:Math.sin(yaw)*8, vertical:tilt*13+map*4});
    if(anim||idle)frame=requestAnimationFrame(draw);
  }
  function go(newIndex,overview=false){
    const near=destination+(newIndex-((destination%N)+N)%N);
    let delta=near-destination;
    if(delta>N/2)delta-=N;if(delta< -N/2)delta+=N;
    destination+=delta;index=newIndex;mapTarget=Number(overview);rotation=0;tilt=0;magnification=1;request();
  }
  function orbitBy(dx,dy){if(mapTarget)mapYaw+=dx;else{rotation=(rotation+dx)%(Math.PI*2);tilt=Math.max(-.14,Math.min(tiltLimit,tilt+dy));}request();}
  function zoom(factor){if(!mapTarget){magnification=Math.max(.63,Math.min(1.35,magnification*factor));request();}}
  host.addEventListener("pointerdown",e=>{
    if(e.button!==0||!e.isPrimary)return;
    drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove",e=>{
    if(!drag||!e.isPrimary)return;
    if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)drag.moved=true;
    if(drag.moved)orbitBy((drag.x-e.clientX)*.0065,(e.clientY-drag.y)*.004);
    drag.x=e.clientX;drag.y=e.clientY;
  });
  host.addEventListener("pointerup",e=>{if(!drag)return;const click=!drag.moved;drag=null;if(click)pickAt(e.clientX,e.clientY);request();});
  host.addEventListener("lostpointercapture",()=>{drag=null;request();});
  host.addEventListener("wheel",e=>{e.preventDefault();zoom(Math.exp(Math.min(100,Math.max(-100,e.deltaY))*.002));},{passive:false});
  new ResizeObserver(request).observe(host);
  document.addEventListener("visibilitychange",request);
  new MutationObserver(request).observe(document.body,{subtree:true,attributes:true,attributeFilter:["open"]});
  request();
  return {go,orbitBy,zoom,reset:()=>go(index,!!mapTarget),setReading(value){reading=value;request();},
    setMotion(value){motion=value;request();}};
};
