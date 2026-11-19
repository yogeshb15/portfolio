// Slowly evolving, perspective-projected starlight responds to scrolling on both pages.
(() => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.className = "sky-field";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const precise = matchMedia("(hover: hover) and (pointer: fine)");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "motion-toggle";
  document.querySelector(".footer-inner")?.append(toggle);
  let preference = null;
  try { preference = localStorage.getItem("observatory-motion"); } catch {}
  let moving, frame = 0, previous = 0, phase = 0, w, h, active;
  const surfaces = ".portrait-mount, .project-card, .current, .paper-list li, .degrees>article, .full-list .credential, .skill-grid>div";
  for (const card of document.querySelectorAll(surfaces)) card.classList.add("depth-surface");
  // Stable star positions keep the backdrop continuous across redraws and settings changes.
  let seed = 9148;
  const random = () => { seed=(Math.imul(1664525,seed)+1013904223)>>>0; return seed/4294967296; };
  const stars = Array.from({length:165}, () => ({x:random()*3-1.5,y:random()*3-1.5,z:.55+random()*1.9,s:.5+random()*.66}));
  function paint() {
    if (!w || !h) return;
    ctx.clearRect(0,0,w,h);
    const travel = moving ? Math.min(scrollY/Math.max(1,document.documentElement.scrollHeight-h),1)*.46 : 0;
    for (const star of stars) {
      const depth = star.z + .05*Math.sin(phase*.045);
      const x = w*(.5+(star.x+.035*Math.sin(phase*.06))/depth);
      const y = h*(.5+(star.y+travel+.022*Math.cos(phase*.07))/depth);
      if (x<0 || x>w || y<0 || y>h) continue;
      ctx.fillStyle = 'rgba(173,204,186,'+Math.min(.49,.29/depth)+')';
      ctx.beginPath();ctx.arc(x,y,star.s/depth,0,Math.PI*2);ctx.fill();
    }
  }
  function tick(time) {
    if (!moving || document.hidden) {frame=0;return;}
    if (time-previous>46) {
      phase+=Math.min((time-previous)/1000,.1);previous=time;paint();
    }
    frame=requestAnimationFrame(tick);
  }
  function resize() {
    w=innerWidth;h=innerHeight;
    const scale=Math.min(devicePixelRatio,1.5);
    canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
    ctx.setTransform(scale,0,0,scale,0,0);paint();
  }
  function clearTilt() {
    if (!active) return;
    active.style.removeProperty("--tilt-x");active.style.removeProperty("--tilt-y");active=null;
  }
  function applyMotion() {
    moving=preference===null ? !reduced.matches : preference==="on";
    document.documentElement.dataset.motion=moving?"on":"off";
    toggle.textContent=moving ? "Pause motion" : "Enable motion";
    clearTilt();cancelAnimationFrame(frame);frame=0;paint();
    if(moving&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}
  }
  toggle.addEventListener("click",()=>{
    preference=moving?"off":"on";
    try { localStorage.setItem("observatory-motion",preference); } catch {}
    applyMotion();
  });
  reduced.addEventListener("change",applyMotion);
  document.addEventListener("visibilitychange",applyMotion);
  document.addEventListener("pointermove",event=>{
    const card=moving&&precise.matches&&event.target.closest?.(".depth-surface");
    if(card!==active) clearTilt();
    if(!card) return;
    active=card;
    const rect=card.getBoundingClientRect();
    card.style.setProperty("--tilt-x",(2.5-(event.clientY-rect.top)/rect.height*5)+"deg");
    card.style.setProperty("--tilt-y",((event.clientX-rect.left)/rect.width*5-2.5)+"deg");
  });
  document.addEventListener("pointerout",e=>{if(!e.relatedTarget) clearTilt();});
  window.addEventListener("resize",resize);
  resize();applyMotion();
})();
