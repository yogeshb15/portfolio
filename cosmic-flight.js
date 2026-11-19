// An interactive star field with perspective projection, textured spheres and a tilted ring plane.
(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const mix = (a, b, t) => a + (b - a) * t;
  function smooth(a, b, t) {
    const x = clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  }
  function seeded(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  const worlds = [
    {id:"earth", axis:-.27, radius:.19, orbit:1.05, phase:2.10, speed:.032, halo:[109,186,255]},
    {id:"mars", axis:-.16, radius:.142, orbit:1.53, phase:3.97, speed:.023, halo:[241,136,92]},
    {id:"jupiter", axis:.04, radius:.43, orbit:2.30, phase:.84, speed:.012, halo:[241,196,150]},
    {id:"saturn", axis:.28, radius:.32, orbit:3.35, phase:-.70, speed:.007, halo:[242,215,163]}
  ];

  function generateFallback(id) {
    // The compact fallback supplies an illuminated surface while the photographic map loads.
    const w = 384, h = 192, data = new Uint8ClampedArray(w*h*4);
    for (let y=0;y<h;y++) for(let x=0;x<w;x++) {
      const lon=x/w*TAU, lat=(.5-y/h)*Math.PI, p=(y*w+x)*4;
      const warp=Math.sin(3*lon+Math.sin(5*lat))*.55+Math.cos(7*lon-4*lat)*.28;
      const coarse=Math.sin(lon*2+lat*5+warp)+.62*Math.sin(lon*5-lat*7)+.40*Math.cos(7*lon+9*lat+warp);
      const grain=.47*Math.sin(12*lon+8*lat+warp*2)+.30*Math.sin(21*lon-24*lat)+.18*Math.sin(49*lon+47*lat);
      let red,green,blue;
      if(id==="earth") {
        const land=coarse+.4*grain;
        const clouds=smooth(.49,1.28,Math.sin(15*lat+warp*5+2*Math.sin(lon))+grain*.78)*.9;
        const ice=smooth(1.20,1.51,Math.abs(lat)+grain*.04);
        if(land>.09){red=85+37*grain+20*coarse;green=111+28*grain;blue=67+14*grain;}
        else{red=19+13*grain;green=57+21*grain;blue=94+24*grain;}
        const cover=Math.max(clouds,ice);
        red=mix(red,229,cover);green=mix(green,237,cover);blue=mix(blue,242,cover);
      } else if(id==="mars") {
        const t=clamp(.57+.19*coarse+.22*grain,0,1);
        red=104+106*t;green=48+74*t;blue=31+60*t;
        const cap=smooth(1.42,1.53,Math.abs(lat)+grain*.032);
        red=mix(red,218,cap);green=mix(green,206,cap);blue=mix(blue,197,cap);
      } else {
        const gas=id==="jupiter", ripple=lat+(gas ? .020 : .007)*warp;
        const band=Math.sin(21*ripple+Math.cos(5*ripple)*.9)*.52+Math.sin(48*ripple)*.23+Math.cos(87*ripple+warp)*.15+grain*.13;
        red=(gas?200:213)+band*(gas?43:21);green=(gas?157:185)+band*(gas?58:28);blue=(gas?117:135)+band*(gas?61:29);
        if(gas){
          const storm=Math.sqrt((Math.sin((lon-3.15)*.5)*2/.29)**2+((lat+.34)/.10)**2);
          const tint=(1-smooth(.5,1.03,storm))*(.45+.22*Math.cos(storm*17));
          red=mix(red,195,tint);green=mix(green,85,tint);blue=mix(blue,57,tint);
        }
      }
      data[p]=red;data[p+1]=green;data[p+2]=blue;data[p+3]=255;
    }
    return {w,h,data};
  }

  function sphereMap(size, world, tilt, lightX) {
    const surface=document.createElement("canvas"); surface.width=surface.height=size;
    const gfx=surface.getContext("2d");
    const pixels=gfx.createImageData(size,size), n=size*size;
    const u=new Float32Array(n), v=new Float32Array(n), shade=new Float32Array(n);
    const rim=new Float32Array(n), shine=new Float32Array(n), alpha=new Uint8Array(n);
    const cs=Math.cos(world.axis),sn=Math.sin(world.axis),pitch=.09+tilt;
    const cp=Math.cos(pitch),sp=Math.sin(pitch), ly=.36, lz=.48;
    const ll=Math.hypot(lightX,ly,lz),lx=lightX/ll,lightY=ly/ll,lightZ=lz/ll;
    const half=Math.hypot(lx,lightY,lightZ+1),hx=lx/half,hy=lightY/half,hz=(lightZ+1)/half;
    const margin=1, radius=size/2-margin;
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      const i=y*size+x,nx=(x+.5-size/2)/radius,ny=(size/2-y-.5)/radius;
      const rr=nx*nx+ny*ny;
      if(rr>1.012)continue;
      const nz=Math.sqrt(Math.max(0,1-rr)),ax=nx*cs+ny*sn,ay=ny*cs-nx*sn;
      const north=clamp(ay*cp+nz*sp,-1,1),front=nz*cp-ay*sp;
      u[i]=.5+Math.atan2(ax,front)/TAU;v[i]=.5-Math.asin(north)/Math.PI;
      const sun=nx*lx+ny*lightY+nz*lightZ;
      const edge=1-nz, daylight=smooth(-.17,.40,sun);
      shade[i]=.095+.95*Math.sqrt(Math.max(0,sun));
      if(world.id==="saturn"){
        // The inner rings cast a narrow soft shadow on the globe near the equator.
        const belt=Math.abs(ay+.105+.028*ax);
        shade[i]*=1-.27*(1-smooth(.04,.085,belt))*daylight;
      }
      rim[i]=edge**4*(.055+.42*daylight)*(world.id==="earth"?1:.32);
      if(world.id==="earth")shine[i]=Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),58)*.60;
      alpha[i]=Math.round(255*clamp((1-Math.sqrt(rr))*radius+.5,0,1));
    }
    return {size,surface,gfx,pixels,u,v,shade,rim,shine,alpha,tilt,lightX,frame:null};
  }

  function paintSphere(cache, texture, world, spin) {
    const {w,h,data}=texture, p=cache.pixels.data, halo=world.halo;
    const slide=((spin%1)+1)%1, n=cache.u.length;
    for(let i=0;i<n;i++){
      const coverage=cache.alpha[i], dst=i*4;
      if(!coverage)continue;
      const tx=(cache.u[i]+slide)*w;
      const ix=Math.floor(tx)%w;
      const sample=(Math.min(h-1,Math.floor(cache.v[i]*(h-1)))*w+ix)*4;
      const k=cache.shade[i], air=cache.rim[i];
      const highlight=world.id==="earth"&&data[sample+2]>data[sample]*1.18?cache.shine[i]*156:0;
      p[dst]=data[sample]*k+halo[0]*air+highlight;
      p[dst+1]=data[sample+1]*k+halo[1]*air+highlight*.94;
      p[dst+2]=data[sample+2]*k+halo[2]*air+highlight*.86;
      p[dst+3]=coverage;
    }
    cache.gfx.putImageData(cache.pixels,0,0);
  }

  window.createCosmicFlight = function createCosmicFlight(host, {onPick, onLayout}={}) {
    const canvas=document.createElement("canvas"), ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)throw new Error("Cosmic flight requires a 2D canvas");
    canvas.className="cosmic-flight-canvas"; canvas.setAttribute("aria-hidden","true");
    Object.assign(canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",touchAction:"pan-y pinch-zoom"});
    host.prepend(canvas);
    const random=seeded(19931217);
    const grains=Array.from({length:1330},(_,i)=>{
      const r=.016+Math.pow(random(),.82)*1.09;
      const arm=i%4, scatter=(random()+random()+random()-1.5)*(.28+.24*r);
      const a=arm*TAU/4+3.65*Math.log1p(r*4.5)+scatter;
      return {x:r*Math.cos(a),z:r*Math.sin(a),y:(random()+random()-1)*(.014+.041*r),
        tone:random(),dim:.18+random()*.72,radius:.24+random()**3*.96};
    });
    const stars=Array.from({length:335},()=>({x:random(),y:random(),z:random(),
      r:.27+random()**5*1.44,b:.24+random()*.71,t:random()*TAU}));
    const surfaceCache=new Map(), textures=new Map(), requested=new Set();
    let selected="earth", width=1,height=1, dpr=1, depth=0, target=0;
    let yaw=0, pitch=0, time=0,lastTick=0, lastDraw=-1, raf=0, visible=true, dead=false;
    let motion=!matchMedia("(prefers-reduced-motion: reduce)").matches, dirty=true, projections=[];
    let drag=null, suppressClick=false, lastLayout=null;
    const scriptBase=new URL(".",document.currentScript?.src||location.href);

    function textureFor(world) {
      if(!requested.has(world.id)) {
        requested.add(world.id);
        const image=new Image();
        image.onload=()=>{
          if(dead)return;
          try{
            const sheet=document.createElement("canvas");sheet.width=Math.min(1024,image.naturalWidth);
            sheet.height=Math.max(1,Math.round(sheet.width*image.naturalHeight/image.naturalWidth));
            const brush=sheet.getContext("2d",{willReadFrequently:true});
            brush.drawImage(image,0,0,sheet.width,sheet.height);
            textures.set(world.id,{w:sheet.width,h:sheet.height,data:brush.getImageData(0,0,sheet.width,sheet.height).data});
            surfaceCache.delete(world.id);request();
          }catch{ /* A failed image read leaves the procedural texture in place. */ }
        };
        image.src=new URL("assets/world-"+world.id+".webp",scriptBase).href;
      }
      if(!textures.has(world.id))textures.set(world.id,generateFallback(world.id));
      return textures.get(world.id);
    }

    function radial(x,y,r,stops) {
      const glow=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));
      for(const [at,color] of stops)glow.addColorStop(at,color);
      ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    function background(w,h) {
      const travel=smooth(.15,1.2,depth), drift=time*.002;
      const shade=.91*smooth(.27,1.08,depth);
      if(shade){ctx.fillStyle="rgba(3,7,18,"+shade+")";ctx.fillRect(0,0,w,h);}
      const vanX=w*(w<720 ? .56 : .69),vanY=h*.47;
      for(const s of stars) {
        const zoom=1+(.15+.98*s.z)*travel+Math.max(0,depth-1)*s.z*.38;
        const x=((vanX+(s.x*w-vanX)*zoom+(yaw*.10+drift)*w*s.z)%w+w)%w;
        const y=((vanY+(s.y*h-vanY)*zoom+pitch*.10*h*s.z)%h+h)%h;
        const b=(.65+.16*Math.sin(time*.59+s.t))*(.52+.48*travel)*s.b;
        ctx.fillStyle="rgba(191,215,255,"+b+")";
        const r=s.r*(.8+.29*travel)*Math.min(1.12,.70+w/2400);
        ctx.fillRect(x-r*.5,y-r*.5,r,r);
        if(s.r>1.47){
          ctx.fillStyle="rgba(184,210,255,"+(b*.27)+")";
          ctx.fillRect(x-r*1.55,y-.35,r*3.1,.7);ctx.fillRect(x-.35,y-r*1.55,.7,r*3.1);
        }
      }
    }
    function galaxy(w,h) {
      const fade=1-smooth(.10,.83,depth);if(fade<.002)return;
      const narrow=w<720, cx=w*(narrow ? .56 : .68),cy=h*(narrow ? .50 : .48);
      const zoom=1+depth*3.5, radius=Math.min(w*(narrow ? .49 : .37),h*.60)*zoom;
      const azimuth=-.09+time*.0055+yaw*.29, ca=Math.cos(azimuth),sa=Math.sin(azimuth);
      const skew=.38+pitch*.11, twist=-.27,ct=Math.cos(twist),st=Math.sin(twist);
      ctx.save();ctx.globalAlpha=fade;
      for(const grain of grains) {
        const a=grain.x*ca-grain.z*sa, z=grain.x*sa+grain.z*ca;
        const perspective=1/(1-.12*z), bx=a*radius*perspective,by=(z*skew-grain.y)*radius*perspective;
        const x=cx+bx*ct-by*st,y=cy+bx*st+by*ct;
        if(x<0||x>w||y<0||y>h)continue;
        const opacity=(.22+.18*(z+1))*grain.dim;
        ctx.fillStyle=grain.tone>.88?"rgba(255,216,183,"+opacity+")":grain.tone>.6?
          "rgba(205,198,255,"+opacity+")":"rgba(187,217,255,"+opacity+")";
        const r=grain.radius*Math.min(1.15,.60+w/2300)*Math.sqrt(zoom);
        ctx.fillRect(x,y,r,r);
      }
      ctx.restore();
    }

    function ring(x,y,r,front) {
      ctx.save();ctx.translate(x,y);ctx.rotate(-.28);ctx.scale(1,.31+pitch*.09);
      const start=front?0:Math.PI,end=front?Math.PI:TAU;
      const detail=66, dr=.99/detail, opacity=front ? .89 : .76;
      for(let i=0;i<detail;i++){
        const ratio=1.16+dr*i, grain=.5+.5*Math.sin(i*.97+Math.sin(i*.48)*2);
        const cassini=1-smooth(.020,.061,Math.abs(ratio-1.87));
        const density=ratio<1.40?.26+grain*.14:ratio<1.81?.67+grain*.18:.50+grain*.20;
        const li=(.82+.15*grain)*(1-cassini*.65);
        ctx.strokeStyle="rgba("+Math.round(236*li)+","+Math.round(213*li)+","+Math.round(173*li)+","+(density*opacity*(1-cassini*.8))+")";
        ctx.lineWidth=dr*r*1.15;ctx.beginPath();ctx.arc(0,0,r*ratio,start,end);ctx.stroke();
      }
      ctx.restore();
    }

    function globe(world,pos,progress) {
      const {x,y,r}=pos;if(r<2)return;
      const isRing=world.id==="saturn";
      const lightX=Math.round(mix(pos.lightX,-.84,progress)*8)/8;
      const level=[58,94,146,216,306,420,532].find(n=>n>=r*1.80)||532;
      const tilt=Math.round(pitch*12)*.025;
      let cache=surfaceCache.get(world.id);
      if(!cache||cache.size!==level||Math.abs(cache.tilt-tilt)>.001||cache.lightX!==lightX){
        cache=sphereMap(level,world,tilt,lightX);surfaceCache.set(world.id,cache);
      }
      const tex=textureFor(world);
      const spin=({earth:.14,mars:.82,jupiter:.86,saturn:.91})[world.id]+yaw/TAU+.004*time;
      const frame=Math.round(spin*(progress>.40?1200:420));
      if(cache.frame!==frame){paintSphere(cache,tex,world,spin);cache.frame=frame;}
      if(isRing)ring(x,y,r,false);
      const haze=world.halo.join(",");
      radial(x,y,r*1.16,[[0,"rgba("+haze+",0)"],[.83,"rgba("+haze+",.025)"],
        [.88,"rgba("+haze+","+(world.id==="earth" ? .15 : .07)+")"],[1,"rgba("+haze+",0)"]]);
      ctx.drawImage(cache.surface,x-r,y-r,r*2,r*2);
      if(isRing)ring(x,y,r,true);
    }

    function system(w,h) {
      const appear=smooth(.32,.88,depth),close=smooth(1,2,depth),narrow=w<720;
      projections=[];if(appear<.002)return;
      const cx=w*(narrow ? .50 : .675),cy=h*(narrow ? .48 : .49);
      const unit=Math.min(w*(narrow ? .118 : .086),h*.24);
      const systemScale=mix(.28,1,appear), unitNow=unit*systemScale;
      const tilt=.42+pitch*.12, angle=.10+yaw*.42;
      const base=(world)=>{
        const a=world.phase+angle+Math.sin(time*world.speed)*.13;
        const wx=Math.cos(a)*world.orbit,wz=Math.sin(a)*world.orbit;
        const perspective=1/(1-wz*.046);
        return {world,x:cx+wx*unitNow*perspective,y:cy+wz*unitNow*tilt*perspective,
          z:wz,r:unitNow*world.radius*perspective,lightX:clamp(-wx*1.8,-1.1,1.1)};
      };
      const scenes=worlds.map(base), focus=scenes.find(p=>p.world.id===selected);
      const focusX=w*(narrow ? .52 : .72),focusY=h*(narrow ? .48 : .47);
      const focusedRadius=Math.min(w*(narrow ? .347 : .245),h*.315)*(selected==="saturn" ? .65 : 1);
      // Interpolate the view in a common camera frame. Other bodies leave the field during approach.
      const zoom=mix(1,focusedRadius/Math.max(1,focus.r),close);
      const offsetX=mix(cx,focus.x,close),offsetY=mix(cy,focus.y,close);
      const targetX=mix(cx,focusX,close),targetY=mix(cy,focusY,close);
      const project=(x,y)=>({x:targetX+(x-offsetX)*zoom,y:targetY+(y-offsetY)*zoom});
      ctx.save();ctx.globalAlpha=appear;
      const orbitOpacity=(1-smooth(.98,1.72,depth))*.25;
      if(orbitOpacity>.005){
        for(const world of worlds){
          ctx.strokeStyle="rgba(139,190,210,"+orbitOpacity+")";ctx.lineWidth=.8;
          ctx.beginPath();
          for(let j=0;j<=96;j++){
            const a=j*TAU/96,s=Math.sin(a)*world.orbit,p=1/(1-s*.046);
            const pos=project(cx+Math.cos(a)*world.orbit*unitNow*p,cy+s*unitNow*tilt*p);
            if(j)ctx.lineTo(pos.x,pos.y);else ctx.moveTo(pos.x,pos.y);
          }
          ctx.stroke();
        }
      }
      const sun=project(cx,cy),spark=unitNow*.24*zoom;
      const paintSun=()=>{
        if(sun.x+spark*4<0||sun.x-spark*4>w||sun.y+spark*4<0||sun.y-spark*4>h)return;
        radial(sun.x,sun.y,spark*3.9,[[0,"rgba(255,250,217,.95)"],[.13,"rgba(255,219,146,.91)"],[.25,"rgba(255,164,61,.58)"],[.51,"rgba(255,141,53,.105)"],[1,"rgba(255,165,70,0)"]]);
        const ball=ctx.createRadialGradient(sun.x-spark*.25,sun.y-spark*.25,spark*.03,sun.x,sun.y,spark);
        ball.addColorStop(0,"#fffbe8");ball.addColorStop(.65,"#ffe0a1");ball.addColorStop(.94,"#ffbe68");ball.addColorStop(1,"#f29a46");
        ctx.fillStyle=ball;ctx.beginPath();ctx.arc(sun.x,sun.y,Math.max(1,spark),0,TAU);ctx.fill();
      };
      const objects=[...scenes,{z:0,sun:true}].sort((a,b)=>a.z-b.z);
      for(const item of objects){
        if(item.sun){
          const sunlight=1-smooth(.10,.88,close);
          if(sunlight>.002){ctx.globalAlpha=appear*sunlight;paintSun();ctx.globalAlpha=appear;}
          continue;
        }
        const pos=project(item.x,item.y),r=item.r*zoom;
        const isChosen=item.world.id===selected,alpha=isChosen?1:1-smooth(.03,.69,close);
        const outside=pos.x+r*2.2<0||pos.x-r*2.2>w||pos.y+r*2.2<0||pos.y-r*2.2>h;
        if(alpha>.01&&!outside){
          ctx.globalAlpha=appear*alpha;globe(item.world,{...pos,r,lightX:item.lightX},close);ctx.globalAlpha=appear;
        }
        projections.push({id:item.world.id,x:pos.x/w,y:pos.y/h,radius:r/w,visible:appear>.78&&close<.38&&!outside});
      }
      ctx.restore();
    }

    function notify() {
      if(!onLayout)return;
      const pins=projections.map(p=>({...p}));
      const key=pins.map(p=>[p.id,p.visible,Math.round(p.x*width),Math.round(p.y*height),Math.round(p.radius*width)].join(",")).join("|");
      if(lastLayout!==key){onLayout({pins});lastLayout=key;}
    }
    function draw(stamp) {
      raf=0;if(dead||!visible||document.hidden)return;
      const delta=Math.min(.09,(stamp-(lastTick||stamp))/1000);lastTick=stamp;
      const changing=Math.abs(target-depth)>.0008;
      if(changing)depth=motion?mix(depth,target,1-Math.exp(-delta*10)):target;
      else depth=target;
      if(motion)time+=delta;
      if(dirty||(!motion&&changing)||stamp-lastDraw>=(changing?22:45)){
        ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
        background(width,height);galaxy(width,height);system(width,height);notify();
        lastDraw=stamp;dirty=false;
      }
      if(motion||Math.abs(target-depth)>.0008)raf=requestAnimationFrame(draw);
    }
    function request() {dirty=true;if(!dead&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
    function resize() {
      const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
      const scale=Math.min(window.devicePixelRatio||1,1.7,1950/w,1350/h);
      if(w!==width||h!==height||dpr!==scale){width=w;height=h;dpr=scale;canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);}
      request();
    }
    const ro=new ResizeObserver(resize);ro.observe(host);
    const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;lastTick=0;
      if(visible)request();else if(raf){cancelAnimationFrame(raf);raf=0;}});
    io.observe(host);
    const onVisibility=()=>{lastTick=0;if(!document.hidden)request();else if(raf){cancelAnimationFrame(raf);raf=0;}};
    document.addEventListener("visibilitychange",onVisibility);
    function turn(dx,dy=0) {
      if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
      yaw=(yaw+dx)%TAU;pitch=clamp(pitch+dy,-.75,.75);request();
    }
    canvas.addEventListener("pointerdown",e=>{
      if(!e.isPrimary||e.button!==0)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};suppressClick=false;
    });
    canvas.addEventListener("pointermove",e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)suppressClick=true;
      if(suppressClick)turn(-dx*.0085,-dy*.006);
      drag.x=e.clientX;drag.y=e.clientY;
    });
    canvas.addEventListener("pointerup",()=>{drag=null;});
    canvas.addEventListener("pointerleave",()=>{drag=null;});
    canvas.addEventListener("pointercancel",()=>{drag=null;suppressClick=true;});
    canvas.addEventListener("click",e=>{
      if(suppressClick||!onPick)return;
      const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      let nearest=null,shortest=Infinity;
      for(const p of projections){
        if(!p.visible)continue;
        const distance=Math.hypot(x-p.x*width,y-p.y*height);
        if(distance<=Math.max(18,p.radius*width*(p.id==="saturn"?1.5:1))&&distance<shortest){nearest=p;shortest=distance;}
      }
      if(nearest)onPick(nearest.id);
    });
    resize();
    return {
      setDepth(value,id){if(worlds.some(w=>w.id===id))selected=id;if(!Number.isFinite(value))return;
        target=clamp(value,0,2);if(!motion)depth=target;request();},
      setPlanet(id){if(worlds.some(w=>w.id===id)){selected=id;request();}},
      turn,
      setMotion(value){motion=Boolean(value);if(!motion)depth=target;lastTick=0;request();},
      destroy(){dead=true;if(raf)cancelAnimationFrame(raf);ro.disconnect();io.disconnect();
        document.removeEventListener("visibilitychange",onVisibility);canvas.remove();surfaceCache.clear();textures.clear();}
    };
  };
})();
