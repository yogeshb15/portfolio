// A continuous museum floor. The original portfolio sections serve as each station's reading material.
(() => {
  const stations=window.PortfolioStations;
  const main=document.querySelector("main"),directory=main.classList.contains("directory");
  const originalHeader=document.querySelector(".mast"),originalFooter=document.querySelector("body>footer");
  const gallery=document.createElement("div");gallery.className="museum";
  gallery.innerHTML=`
    <div class="museum-panorama" aria-hidden="true"></div>
    <div class="museum-shadow" aria-hidden="true"></div>
    <div class="museum-stage" tabindex="0" role="region" aria-label="3D gallery. Drag to orbit. Use left and right arrows to move between exhibits, A and D to turn, and plus or minus to zoom."></div>
    <div class="museum-shade" aria-hidden="true"></div>
    <header class="museum-bar">
      <a class="museum-brand" href="./"><span aria-hidden="true">✳</span> Yogesh Bhardwaj</a>
      <div><button type="button" class="museum-map"><span aria-hidden="true">⌘</span> Gallery map</button>
      <button type="button" class="museum-pause">Pause motion</button></div>
    </header>
    <div class="museum-pins" aria-label="3D gallery destinations"></div>
    <section class="museum-legend" aria-labelledby="museum-title">
      <p class="museum-label"></p><h1 id="museum-title"><span></span><em></em></h1>
      <p class="museum-description"></p>
      <div class="museum-actions"><button class="museum-action" type="button"></button>
      <button class="museum-more" type="button">Profile details</button></div>
    </section>
    <div class="museum-tools" role="group" aria-label="3D camera controls">
      <button type="button" data-orbit="left" aria-label="Turn camera left">↶</button><button type="button" data-orbit="right" aria-label="Turn camera right">↷</button>
      <button type="button" data-orbit="near" aria-label="Move closer">+</button><button type="button" data-orbit="far" aria-label="Move back">−</button>
      <button type="button" data-orbit="reset" aria-label="Reset camera">⟲</button>
    </div>
    <div class="museum-caption"><span class="museum-direction">Drag to orbit</span><span class="museum-counter"></span></div>
    <nav class="museum-route" aria-label="Gallery stations">
      <button class="museum-prev" type="button" aria-label="Previous gallery station">‹</button>
      <div class="museum-stations"></div>
      <button class="museum-next" type="button" aria-label="Next gallery station">›</button>
    </nav>
    <div class="museum-sr sr-only" role="status"></div>`;
  const get=selector=>gallery.querySelector(selector);
  const stage=get(".museum-stage"),pins=get(".museum-pins"),rail=get(".museum-stations");
  const drawer=document.createElement("aside");
  drawer.className="museum-reader";drawer.hidden=true;drawer.setAttribute("aria-label","Exhibit reading room");
  drawer.innerHTML='<div class="reader-bar"><span></span><button type="button" aria-label="Close reading room">Close ×</button></div><div class="reader-content"></div>';
  const strip=drawer.querySelector(".reader-bar"),body=drawer.querySelector(".reader-content");
  let current=0,overview=false,reader=false,world;
  let mobileMotion=matchMedia("(prefers-reduced-motion: reduce)"),moving=!mobileMotion.matches;
  try {const saved=localStorage.getItem("observatory-motion");if(saved)moving=saved==="on";} catch{}
  const button=(label,action,cls)=>{
    const b=document.createElement("button");b.type="button";b.textContent=label;b.className=cls;b.addEventListener("click",action);return b;
  };
  const routeButtons=stations.map((s,i)=>{
    const b=button(s.name,()=>navigate(i,false),"station-link");rail.append(b);return b;
  });
  const mapPins=stations.map((s,i)=>{
    const b=button(s.name,()=>navigate(i,false),"museum-pin");b.hidden=true;pins.append(b);return b;
  });
  document.body.prepend(gallery);gallery.append(drawer);
  function layout(info){
    gallery.style.setProperty("--view-pan",info.parallax+"%");
    gallery.style.setProperty("--view-tilt",info.vertical+"%");
    gallery.style.setProperty("--map-blend",info.map);
    const sh=get(".museum-shadow");sh.style.left=info.shadow.x+"%";sh.style.top=info.shadow.y+"%";
    sh.style.width=Math.max(0,info.shadowWidth)+"%";sh.style.opacity=info.shadow.shown?(1-info.map)*(info.transit ? .4 : .82):0;
    mapPins.forEach((pin,i)=>{
      const loc=info.pins[i];
      pin.hidden=!overview||!loc?.shown||info.map<.96;
      if(loc){pin.style.left=loc.x+"%";pin.style.top=loc.y+"%";}
    });
  }
  function openObject(i,fromMap){if(fromMap||i!==current)navigate(i,false);else primary();}
  try {world=window.makePortfolioWorld(stage,stations.map(s=>s.id),layout,openObject);}
  catch(error){gallery.remove();console.error("Gallery could not start",error);return;}
  // Keep the unenhanced HTML as the source of the dossiers and the no-script experience.
  const homeSections=directory?[]:[...main.children];
  const anchors=directory?new Map():new Map([...main.querySelectorAll("[id]")].map(e=>{
    const section=homeSections.find(s=>s===e||s.contains(e));return [e.id,{section,node:e}];
  }));
  body.append(main);originalHeader.hidden=true;originalFooter.hidden=true;
  document.documentElement.classList.add("immersive");
  const skip=document.querySelector(".skip");if(skip)skip.href="#gallery-navigation";
  rail.id="gallery-navigation";
  const assistantButton=document.querySelector(".assistant-launch");
  if(assistantButton)get(".museum-bar>div").append(assistantButton);
  function updateUI(){
    const s=stations[current];
    gallery.dataset.station=s.id;
    gallery.dataset.mode=overview?"map":reader?"reader":"station";
    get(".museum-label").textContent=overview?"Research portfolio":s.label;
    get("#museum-title span").textContent=overview?"The gallery":s.heading;
    get("#museum-title em").textContent=overview?"map":s.em;
    get(".museum-description").textContent=overview?"Choose a sculpture or a station below to travel there.":s.copy;
    get(".museum-action").textContent=s.action;
    get(".museum-more").hidden=overview||directory||!(current===0||current===6);
    get(".museum-more").textContent=current===6?"Other training":"Profile details";
    get(".museum-actions").hidden=overview;
    get(".museum-direction").textContent=overview?"Drag to turn the map":"Drag to orbit";
    get(".museum-counter").textContent=overview?"Nine stations":(current+1)+" / "+stations.length+"  ·  "+s.name;
    get(".museum-map").lastChild.textContent=overview?" Return to exhibit":" Gallery map";
    get(".museum-map").setAttribute("aria-pressed",String(overview));
    routeButtons.forEach((b,i)=>{if(i===current&&!overview)b.setAttribute("aria-current","location");else b.removeAttribute("aria-current");});
    if(rail.scrollWidth>rail.clientWidth){const b=routeButtons[current];rail.scrollTo({left:b.offsetLeft-rail.offsetLeft-(rail.clientWidth-b.clientWidth)/2,behavior:"instant"});}
    get(".museum-sr").textContent=overview?"Gallery map. Choose a station.":s.name+" gallery station.";
  }
  function setMotion(value,store=false){
    moving=value;document.documentElement.dataset.motion=value?"on":"off";world.setMotion(value);
    get(".museum-pause").textContent=value?"Pause motion":"Resume motion";
    get(".museum-pause").setAttribute("aria-label",get(".museum-pause").textContent);
    get(".museum-pause").setAttribute("aria-pressed",String(!value));
    if(store)try{localStorage.setItem("observatory-motion",value?"on":"off");}catch{}
  }
  function hideReader(){
    drawer.hidden=true;reader=false;world.setReading(false);
  }
  function openReader(id=stations[current].id){
    if(directory&&stations[current].id!=="certifications"){location.href="./#"+id;return;}
    if(!directory){
      const entry=anchors.get(id)||anchors.get(stations[current].id);
      if(!entry)return;
      for(const child of homeSections)child.hidden=child!==entry.section&&!(current===0&&child.classList.contains("stats"));
      for(let e=entry.node;e&&e!==main;e=e.parentElement)if(e.tagName==="DETAILS")e.open=true;
    }
    overview=false;reader=true;drawer.hidden=false;body.scrollTop=0;
    strip.querySelector("span").textContent=directory?"Certificate directory":stations[current].name;
    world.setReading(true);updateUI();
    strip.querySelector("button").focus({preventScroll:true});
    if(!directory&&id!==stations[current].id)requestAnimationFrame(()=>anchors.get(id)?.node.scrollIntoView({block:"nearest"}));
  }
  function setURL(i,details){
    const url=new URL(location.href);
    url.searchParams.delete("exhibit"); url.searchParams.delete("station");
    if(directory){if(i!==6)url.searchParams.set("station",stations[i].id);url.hash="";}
    else if(details)url.hash=stations[i].id;
    else{url.hash="";if(i)url.searchParams.set("station",stations[i].id);}
    if(url.href!==location.href)history.pushState(null,"",url);
  }
  function navigate(i,details,write=true,target){
    current=(i+stations.length)%stations.length;overview=false;hideReader();
    if(write)setURL(current,details);
    world.go(current,false);updateUI();if(details)openReader(target);
  }
  function setMap(){
    if(reader)hideReader();overview=!overview;
    world.go(current,overview);updateUI();
  }
  function primary(){
    const s=stations[current];
    if(current===0){navigate(1,false);return;}
    if(s.id==="observatory"){
      const trigger=document.querySelector('[data-instrument="reset"]');
      if(trigger)trigger.click();else location.href="./?exhibit=reset#observatory";
    } else if(s.id==="certifications"&&!directory){location.href="credentials.html";}
    else {setURL(current,true);openReader();}
  }
  function route(){
    const url=new URL(location.href),hash=decodeURIComponent(url.hash.slice(1));
    if(hash==="gallery-navigation"||hash==="main"){stage.focus({preventScroll:true});return;}
    if(url.searchParams.has("exhibit")&&!directory){navigate(7,false,false);return;}
    if(directory){const i=stations.findIndex(s=>s.id===url.searchParams.get("station"));navigate(i<0?6:i,i<0,false);return;}
    const anchor=anchors.get(hash),requested=anchor?.section?.id||url.searchParams.get("station")||"about";
    const i=stations.findIndex(s=>s.id===requested);navigate(i<0?0:i,Boolean(anchor&&hash!=="about"&&hash!=="observatory"),false,hash);
  }
  stage.addEventListener("keydown",e=>{
    if(e.target!==stage)return;
    const actions={ArrowLeft:()=>navigate(current-1,false),ArrowRight:()=>navigate(current+1,false),
      a:()=>world.orbitBy(-.16,0),d:()=>world.orbitBy(.16,0),w:()=>world.orbitBy(0,.10),s:()=>world.orbitBy(0,-.10),
      "+":()=>world.zoom(.83),"=":()=>world.zoom(.83),"-":()=>world.zoom(1.2),Home:()=>world.reset(),Enter:primary};
    if(actions[e.key]){e.preventDefault();actions[e.key]();}
  });
  get(".museum-prev").addEventListener("click",()=>navigate(current-1,false));
  get(".museum-next").addEventListener("click",()=>navigate(current+1,false));
  get(".museum-map").addEventListener("click",setMap);
  get(".museum-action").addEventListener("click",primary);
  get(".museum-more").addEventListener("click",()=>{setURL(current,true);openReader();});
  get(".museum-pause").addEventListener("click",()=>setMotion(!moving,true));
  mobileMotion.addEventListener("change",e=>{try{if(localStorage.getItem("observatory-motion")!==null)return;}catch{}setMotion(!e.matches);});
  for(const b of gallery.querySelectorAll("[data-orbit]")){
    b.addEventListener("click",()=>{const k=b.dataset.orbit;if(k==="reset")world.reset();else if(k==="near"||k==="far")world.zoom(k==="near" ? .83 : 1.2);else world.orbitBy(k==="left"?-.21:.21,0);});
  }
  function closeReader(){navigate(current,false);get(".museum-action").focus({preventScroll:true});}
  strip.querySelector("button").addEventListener("click",closeReader);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.querySelector("dialog[open]")){if(reader)closeReader();else if(overview)setMap();}});
  document.addEventListener("click",e=>{
    const link=e.target.closest("a[href]");if(!link||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash||url.searchParams.has("exhibit"))return;
    const entry=anchors.get(decodeURIComponent(url.hash.slice(1)));
    if(!entry)return;
    e.preventDefault();if(location.href!==url.href)history.pushState(null,"",url);route();
  });
  for(const b of document.querySelectorAll("[data-open-tour]")){b.hidden=false;b.textContent="View gallery map";b.addEventListener("click",setMap);}
  window.addEventListener("popstate",route);window.addEventListener("hashchange",route);
  setMotion(moving);route();updateUI();
})();
