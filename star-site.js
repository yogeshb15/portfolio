// Native scroll drives the camera. The same controls can select an exact depth directly.
(() => {
  const page=document.body.dataset.page;
  const routes={about:"profile.html#about",experience:"profile.html#experience",education:"profile.html#education",
    awards:"profile.html#awards",projects:"research.html#projects",publications:"research.html#publications",
    hobbies:"research.html#hobbies",skills:"research.html#skills",certifications:"credentials.html",observatory:"space.html#observatory",contact:"./#contact"};
  const url=new URL(location.href),station=url.searchParams.get("station");
  if((page==="home"||page==="credentials.html")&&Object.hasOwn(routes,station)&&!url.searchParams.has("exhibit")){
    location.replace(routes[station]);return;
  }
  function restoreAnchor(){
    const id=location.hash.slice(1);
    if(!id)return;
    const anchor=document.getElementById(id);
    if(!anchor&&page==="home"&&Object.hasOwn(routes,id)){location.replace(routes[id]);return;}
    if(anchor){
      let opened=false;
      for(let e=anchor;e;e=e.parentElement)if(e.tagName==="DETAILS"&&!e.open){e.open=true;opened=true;}
      if(opened)requestAnimationFrame(()=>anchor.scrollIntoView());
    }
  }
  restoreAnchor();window.addEventListener("hashchange",restoreAnchor);
  const menu=document.querySelector(".menu-trigger"),nav=document.querySelector("#site-navigation");
  function setMenu(open){menu.setAttribute("aria-expanded",String(open));nav.toggleAttribute("data-open",open);}
  const phone=matchMedia("(max-width:719px)");
  function showMenu(){menu.hidden=!phone.matches;setMenu(false);}
  showMenu();phone.addEventListener("change",showMenu);
  menu.addEventListener("click",()=>setMenu(menu.getAttribute("aria-expanded")!=="true"));
  nav.addEventListener("click",()=>setMenu(false));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.hasAttribute("data-open")){setMenu(false);menu.focus();}});
  const track=document.querySelector(".flight-track");
  if(!track)return;
  const surface=track.querySelector(".flight-window"),stage=track.querySelector(".flight-stage"),pinLayer=track.querySelector(".flight-pins");
  const intro=track.querySelector(".flight-intro"),readout=track.querySelector(".flight-readout"),motionButton=track.querySelector(".flight-motion");
  const names=window.StarAtlas,levelButtons=[...track.querySelectorAll(".flight-scale button")];
  const preference=matchMedia("(prefers-reduced-motion:reduce)");
  let selected="earth",phase="",previousWorld="",motion=!preference.matches,frame=0;
  try {const saved=localStorage.getItem("observatory-motion");if(saved)motion=saved==="on";}catch{}
  const pins=new Map(Object.entries(names).map(([id,world])=>{
    const b=document.createElement("button");b.type="button";b.className="world-pin";b.textContent=world.name;b.hidden=true;
    b.setAttribute("aria-label","Zoom to "+world.name);b.addEventListener("click",()=>visit(id));
    pinLayer.append(b);return [id,b];
  }));
  function layout({pins:positions}){
    for(const pin of pins.values())pin.hidden=true;
    for(const p of positions){
      const b=pins.get(p.id);if(!b||!p.visible||phase!=="system")continue;
      b.hidden=false;b.style.left=(p.x*100)+"%";
      b.style.top="calc("+p.y*100+"% + "+(p.radius*stage.clientWidth+4)+"px)";
    }
  }
  let flight;
  try{flight=window.createCosmicFlight(stage,{onPick:visit,onLayout:layout});}
  catch{track.querySelector(".galaxy-tag").hidden=true;track.querySelector(".flight-panel").hidden=true;return;}
  document.documentElement.classList.add("has-flight");
  function setMotion(enabled,save=false){
    motion=enabled;motionButton.setAttribute("aria-pressed",String(!enabled));
    motionButton.querySelector("span").textContent=enabled?"Pause motion":"Resume motion";flight.setMotion(enabled);
    if(save)try{localStorage.setItem("observatory-motion",enabled?"on":"off");}catch{}
  }
  setMotion(motion);motionButton.addEventListener("click",()=>setMotion(!motion,true));
  preference.addEventListener("change",e=>{try{if(localStorage.getItem("observatory-motion"))return;}catch{}setMotion(!e.matches);});
  function measurement(){
    const top=scrollY+track.getBoundingClientRect().top-parseFloat(getComputedStyle(surface).top);
    return {top,range:Math.max(1,track.offsetHeight-surface.offsetHeight)};
  }
  function show(depth){
    const next=depth<.66?"galaxy":depth<1.55?"system":"planet";
    const world=names[selected];
    surface.style.setProperty("--magnify",1+Math.min(depth,.8)*1.95);
    surface.style.setProperty("--galaxy-opacity",Math.max(0,1-Math.max(depth-.18,0)*1.58));
    surface.style.setProperty("--stage-opacity",Math.min(1,.26+depth*1.3));
    flight.setDepth(depth,selected);
    if(phase===next&&previousWorld===selected)return;
    phase=next;previousWorld=selected;surface.dataset.phase=next;
    track.querySelector(".planet-turn").hidden=next!=="planet";
    intro.hidden=next!=="galaxy";readout.hidden=next==="galaxy";
    track.dataset.subject=next==="planet"?world.name+" planet field note":"Galaxy flight";
    readout.querySelector(".kicker span").textContent=next==="planet"?world.kind:"Four worlds in orbit";
    readout.querySelector("h2").textContent=next==="planet"?world.name+".":"The Solar System.";
    readout.querySelector(".flight-summary").textContent=next==="planet"?world.note+" Drag sideways to turn the globe.":"Choose a world to move into orbit. Start with Earth’s oceans or follow the ring plane around Saturn.";
    const link=readout.querySelector(".world-notes");
    link.textContent=next==="planet"?"Read the "+world.name+" field note":"All planet field notes";
    link.href=(page==="space.html"?"":"space.html")+(next==="planet"?"#note-"+selected:"#planet-notes");
    for(const b of readout.querySelectorAll("[data-world]"))b.setAttribute("aria-pressed",String(next==="planet"&&b.dataset.world===selected));
    for(const [i,b] of levelButtons.entries())b.setAttribute("aria-pressed",String(i===["galaxy","system","planet"].indexOf(next)));
    if(next!=="system")for(const b of pins.values())b.hidden=true;
  }
  // Focusing a control in a sticky panel can scroll the document. Keep an explicitly
  // chosen planet in view until the visitor starts navigating the page again.
  let chosenDepth=null, touchStart=null;
  const resumeScroll=()=>{chosenDepth=null;};
  window.addEventListener("wheel",e=>{if(e.deltaY)resumeScroll();},{passive:true});
  window.addEventListener("touchstart",e=>{
    const touch=e.touches[0];
    touchStart=touch?[touch.clientX,touch.clientY]:null;
  },{passive:true});
  window.addEventListener("touchmove",e=>{
    const touch=e.touches[0];
    if(touchStart&&touch&&Math.abs(touch.clientY-touchStart[1])>Math.max(5,Math.abs(touch.clientX-touchStart[0])))resumeScroll();
  },{passive:true});
  window.addEventListener("keydown",e=>{
    if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(e.key)||
      (e.key===" "&&!e.target.closest("button,input,textarea,select,dialog")))resumeScroll();
  });
  window.addEventListener("pointerdown",e=>{
    if(e.clientX>=document.documentElement.clientWidth)resumeScroll();
  },{passive:true});
  window.addEventListener("hashchange",resumeScroll);
  function sample(){
    frame=0;
    const m=measurement();
    show(chosenDepth??Math.max(0,Math.min(2,2*(scrollY-m.top)/m.range)));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(sample);}
  function go(depth,immediate=false){
    chosenDepth=depth;
    const m=measurement();
    window.scrollTo({top:Math.max(0,m.top+m.range*depth/2),behavior:immediate||!motion?"instant":"smooth"});
    schedule();
  }
  function visit(id,immediate=false,write=true){
    if(!Object.hasOwn(names,id))return;
    selected=id;flight.setPlanet(id);
    if(page==="space.html"&&write){
      const u=new URL(location.href);u.hash="";u.searchParams.set("planet",id);
      if(u.href!==location.href)history.pushState(null,"",u);
    }
    go(2,immediate);
  }
  track.querySelectorAll("[data-depth]").forEach(b=>b.addEventListener("click",e=>{
    e.preventDefault();const depth=Number(b.dataset.depth);
    if(page==="space.html"&&depth<2){const u=new URL(location.href);u.hash="";u.searchParams.delete("planet");history.replaceState(null,"",u);}
    go(depth);
  }));
  for(const b of track.querySelectorAll("[data-turn]"))b.addEventListener("click",()=>flight.turn(Number(b.dataset.turn)*Math.PI/8));
  for(const b of track.querySelectorAll("[data-world]"))b.addEventListener("click",()=>visit(b.dataset.world));
  for(const link of document.querySelectorAll("[data-visit]"))link.addEventListener("click",e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();visit(link.dataset.visit);});
  readout.querySelector("[data-ask-flight]").addEventListener("click",e=>{
    e.currentTarget.dispatchEvent(new CustomEvent("portfolio-exhibit-question",{bubbles:true,detail:{title:track.dataset.subject}}));
  });
  window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);
  new ResizeObserver(schedule).observe(track);
  function initial(){
    const u=new URL(location.href),id=u.searchParams.get("planet");
    if(!u.hash&&Object.hasOwn(names,id))visit(id,true,false);
    else {resumeScroll();sample();}
  }
  initial();window.addEventListener("popstate",initial);
})();
