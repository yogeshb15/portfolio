// Sections occupy distinct positions around a rotating CSS 3D cylinder.
(() => {
  const chapters = [
    ["Research projects", "Eight public repositories, from a cosmology benchmark generator to a neural surrogate for distance moduli.", "./#projects", "signals.webp"],
    ["Experience", "Benchmark development at Wipro and earlier work evaluating mathematical, coding and multimodal reasoning.", "./#experience", "eclipse-studio.webp"],
    ["Publications", "Five peer-reviewed papers on matter creation, exotic fluids and cosmic acceleration.", "./#publications", "phase.webp"],
    ["Education", "A doctorate in Applied Mathematics from Delhi Technological University, following an MSc and BSc.", "./#education", "surface.webp"],
    ["Technical skills", "Reference solvers, numerical integration, statistical inference and the Python scientific computing stack.", "./#skills", "signals.webp"],
    ["Credentials", "A searchable collection of 22 LinkedIn Learning courses and one learning path, each with its certificate.", "credentials.html", "surface.webp"],
    ["Contact", "Send Yogesh a research question, a collaboration proposal or a professional enquiry.", "./#contact", "eclipse-studio.webp"]
  ];
  const triggers=[...document.querySelectorAll("[data-open-tour]")];
  if (!triggers.length) return;
  const dialog=document.createElement("dialog");
  dialog.className="tour-dialog";
  dialog.setAttribute("aria-labelledby","tour-title");
  dialog.innerHTML=`<header><h2 id="tour-title">Portfolio in 3D</h2><button type="button" class="close-dialog" aria-label="Close tour">×</button></header>
    <div class="tour-window" tabindex="0" role="group" aria-label="Portfolio chapters. Swipe or use the left and right arrow keys."><div class="tour-wheel"></div></div>
    <div class="tour-controls"><button type="button" class="chapter-prev" aria-label="Previous section">←</button><span class="chapter-status" role="status"></span><button type="button" class="chapter-next" aria-label="Next section">→</button></div>`;
  document.body.append(dialog);
  const stage=dialog.querySelector(".tour-window"),wheel=dialog.querySelector(".tour-wheel");
  const cards=chapters.map(([name,desc,href,picture])=>{
    const card=document.createElement("article");
    card.className="tour-card";
    const art=document.createElement("img");art.alt="";art.loading="lazy";art.src="assets/"+picture;
    const body=document.createElement("div");
    const heading=document.createElement("h3");heading.textContent=name;
    const copy=document.createElement("p");copy.textContent=desc;
    const link=document.createElement("a");link.href=href;link.textContent="Open "+name.toLowerCase()+" →";link.className="text-link";
    link.addEventListener("click",()=>dialog.close());
    body.append(heading,copy,link);card.append(art,body);wheel.append(card);
    return card;
  });
  let step=0,opener=triggers[0];
  function place() {
    const angle=360/chapters.length;
    const face=cards[0].offsetWidth;
    if(!face)return;
    const radius=(face+26)/(2*Math.tan(Math.PI/chapters.length));
    cards.forEach((card,i)=>{
      card.style.transform="translate(-50%, -50%) rotateY("+(i*angle)+"deg) translateZ("+radius+"px)";
      const active=i===((step%chapters.length)+chapters.length)%chapters.length;
      card.inert=!active;card.setAttribute("aria-hidden",String(!active));card.classList.toggle("active",active);
      if(active)dialog.querySelector(".chapter-status").textContent=(i+1)+" / "+chapters.length+" · "+chapters[i][0];
    });
    wheel.style.transform="translateZ(-"+radius+"px) rotateY("+(-step*angle)+"deg)";
  }
  const turn=delta=>{step+=delta;place();};
  dialog.querySelector(".chapter-prev").addEventListener("click",()=>turn(-1));
  dialog.querySelector(".chapter-next").addEventListener("click",()=>turn(1));
  dialog.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();turn(e.key==="ArrowLeft"?-1:1);}
  });
  let start=null;
  stage.addEventListener("pointerdown",e=>{
    if(e.target.closest("a")||!e.isPrimary)return;
    start=e.clientX;stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointerup",e=>{
    if(start!==null&&Math.abs(e.clientX-start)>28)turn(e.clientX<start?1:-1);
    start=null;
  });
  stage.addEventListener("pointercancel",()=>{start=null;});
  dialog.querySelector(".close-dialog").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>opener.focus());
  for (const button of triggers) {
    button.hidden=false;button.setAttribute("aria-haspopup","dialog");
    button.addEventListener("click",()=>{
      opener=button;step=document.querySelector(".directory")?5:0;
      dialog.showModal();place();stage.focus();
    });
  }
  new ResizeObserver(()=>{if(dialog.open)place();}).observe(stage);
})();
