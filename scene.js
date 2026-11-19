// The field guide works independently of the optional 3D renderer.
(() => {
  const triggers=[...document.querySelectorAll("[data-instrument]")];
  if(!triggers.length) return;
  const {stops,references}=window.observatoryGuide;
  const dialog=document.createElement("dialog");
  dialog.className="scene-dialog";
  dialog.id="instrument-viewer";
  dialog.setAttribute("aria-labelledby","scene-title");
  dialog.innerHTML=`
    <header><h2 id="scene-title">The observatory</h2><button class="close-dialog" type="button" aria-label="Close observatory">×</button></header>
    <nav class="scene-trail" aria-label="Exhibit path"></nav>
    <div class="explorer-layout">
      <div class="scene-viewport">
        <div class="stage" tabindex="0" role="group" aria-label="3D model. Drag to orbit, pinch or use plus and minus to zoom, and use the arrow keys to turn.">
          <div class="model-pins"></div>
          <span class="renderer-message" role="status">Loading the 3D model…</span>
        </div>
        <div class="view-controls" role="group" aria-label="Camera controls">
          <button type="button" data-camera="out" aria-label="Zoom out">−</button>
          <button type="button" data-camera="in" aria-label="Zoom in">+</button>
          <button type="button" data-camera="left" aria-label="Rotate left">↶</button>
          <button type="button" data-camera="right" aria-label="Rotate right">↷</button>
          <button type="button" data-camera="reset">Reset view</button>
        </div>
      </div>
      <section class="field-notes" aria-labelledby="exhibit-heading">
        <h3 id="exhibit-heading" tabindex="-1"></h3>
        <p class="exhibit-copy"></p>
        <div class="exhibit-experiment" hidden></div>
        <div class="exhibit-next"></div>
        <p class="exhibit-note"></p>
        <div class="exhibit-sources"></div>
        <div class="exhibit-photo"></div>
      </section>
    </div>
    <footer class="scene-foot"><button type="button" class="scene-back">Back one stop</button><a class="scene-permalink">Link to this view</a><span class="scene-gesture">Drag to orbit · Scroll or pinch to zoom</span></footer>`;
  document.body.append(dialog);
  const find=selector=>dialog.querySelector(selector);
  const stage=find(".stage"), heading=find("#exhibit-heading"), trail=find(".scene-trail");
  const experiment=find(".exhibit-experiment"), links=find(".exhibit-next"), sources=find(".exhibit-sources");
  const notice=find(".renderer-message"),pinLayer=find(".model-pins"),back=find(".scene-back");
  const runtimeFiles=["three.min.js","observatory-renderer.js","space-models.js","instrument-labs.js"];
  const downloads=new Map();
  let current="reset", history=[], opener, viewer, audioContext, noteVoice, opening=0;
  const initialValues={eyepiece:25,octave:0,declination:12};
  const values={...initialValues};
  const shortTitles={reset:"Studio",solar:"Space",guitar:"Guitar",compass:"Compass",lunarSurface:"Highlands",summit:"Central peak"};
  const buttons=new Map();
  const el=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  function action(label,fn,cls) {
    const b=el("button",cls,label);b.type="button";b.addEventListener("click",fn);return b;
  }
  function citation(label,url) {
    const a=el("a","exhibit-source",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
  }
  function script(url) {
    if(!downloads.has(url)) downloads.set(url,new Promise((resolve,reject)=>{
      const tag=document.createElement("script");tag.src=url;
      tag.onload=resolve;
      tag.onerror=()=>{downloads.delete(url);tag.remove();reject(new Error("Model file unavailable"));};
      document.head.append(tag);
    }));
    return downloads.get(url);
  }
  function closeNote() {
    if(!noteVoice)return;
    try{noteVoice.stop();}catch{}
    noteVoice=null;
  }
  async function playString(feedback) {
    const id=current,selection=values.octave;
    try {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error("Audio unavailable");
      if(!audioContext)audioContext=new Audio();
      await audioContext.resume();
      if(!dialog.open||current!==id||selection!==values.octave)return;
      closeNote();
      const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type="triangle";osc.frequency.value=selection===12?220:110;
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.13,now+.009);
      gain.gain.exponentialRampToValueAtTime(.0001,now+1.35);
      osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+1.36);noteVoice=osc;
      osc.onended=()=>{osc.disconnect();gain.disconnect();if(noteVoice===osc)noteVoice=null;};
      feedback.textContent=selection===12?"Played A3 · 220 Hz":"Played A2 · 110 Hz";
    } catch { feedback.textContent="Audio is unavailable in this browser. The model shows the vibrating length."; }
    if(dialog.open&&current===id)viewer?.pluck();
  }
  function addExperiment(type) {
    experiment.replaceChildren();experiment.hidden=!type;
    if(!type)return;
    const readout=el("output","experiment-readout");
    const group=el("div","experiment-options");
    const update=val=>{
      values[type]=val;viewer?.change(val);closeNote();
      readout.textContent=type==="eyepiece"?("600 mm ÷ "+val+" mm = "+(600/val)+"×")
        :type==="octave"?(val===0?"Open A · 110 Hz":"Twelfth fret · 220 Hz")
        :val===0?"0° · Magnetic and true north align":Math.abs(val)+"° "+(val>0?"east":"west")+" of true north";
      for(const button of group.querySelectorAll("[data-value]"))button.setAttribute("aria-pressed",String(Number(button.dataset.value)===val));
    };
    if(type==="declination"){
      const label=el("label","","Example declination");
      const slider=el("input");slider.type="range";slider.min=-35;slider.max=35;slider.step=1;slider.value=values[type];slider.id="magnetic-angle";
      label.htmlFor=slider.id;readout.htmlFor=slider.id;
      slider.addEventListener("input",()=>update(Number(slider.value)));
      experiment.append(label,slider,readout);
    } else {
      const options=type==="octave"?[[0,"Open string"],[12,"Twelfth fret"]]:[[25,"25 mm eyepiece"],[10,"10 mm eyepiece"]];
      for(const [val,title] of options){
        const button=action(title,()=>update(val));button.dataset.value=val;group.append(button);
      }
      experiment.append(group,readout);
      if(type==="octave"){
        const feedback=el("span","sound-status");feedback.setAttribute("role","status");
        const b=action("Pluck string",()=>playString(feedback),"pluck");
        experiment.append(b,feedback);
      }
    }
    update(values[type]);
  }
  function pinPositions(points) {
    for(const [id,b] of buttons){
      const pos=points[id];b.hidden=!pos;
      if(pos){b.style.left=pos[0]+"%";b.style.top=pos[1]+"%";}
    }
  }
  function renderStop(id,moveFocus) {
    current=id;
    const stop=stops[id], ancestors=[];
    const permalink=new URL(location.href);
    permalink.searchParams.set("exhibit",id);permalink.hash="observatory";
    find(".scene-permalink").href=permalink.href;
    for(let path=id;path;path=stops[path].parent)ancestors.unshift(path);
    const theme=ancestors.map(a=>stops[a].theme).filter(Boolean).pop();
    dialog.dataset.theme=theme;stage.dataset.view=id;
    trail.replaceChildren();
    for(const [i,path] of ancestors.entries()){
      if(i)trail.append(el("span","trail-divider","/"));
      const title=shortTitles[path]||stops[path].title;
      if(path===id){
        const last=el("span","trail-current",title);last.setAttribute("aria-current","page");trail.append(last);
      } else trail.append(action(title,()=>visit(path)));
    }
    heading.textContent=stop.heading;
    find(".exhibit-copy").textContent=stop.text;
    const note=find(".exhibit-note");note.textContent=stop.note||"";note.hidden=!stop.note;
    sources.replaceChildren();
    if(stop.source)sources.append(citation(...references[stop.source]));
    if(["moon","lunarSurface","tycho","summit"].includes(id))
      sources.append(citation("Lunar data · NASA SVS / LRO, LROC and LOLA teams","https://svs.gsfc.nasa.gov/4720/"));
    showPhoto(id);
    links.replaceChildren();
    const label=el("p","explore-label",stop.links.length?"Explore next":"Continue exploring");
    links.append(label);
    const next=stop.links.length?stop.links:[(id==="eyepiece"||id==="eclipse"||theme==="space")?"solar":"reset"];
    for(const destination of next){
      const b=action(stops[destination].title,()=>visit(destination),"exhibit-link");
      links.append(b);
    }
    closeNote();pinLayer.replaceChildren();buttons.clear();
    if(viewer){
      viewer.select(id);
      // The side navigation lists the same destinations for small screens and keyboard use.
      for(const destination of stop.links){
        const title=shortTitles[destination]||stops[destination].title;
        const b=action(title,()=>visit(destination),"model-pin");b.hidden=true;
        b.setAttribute("aria-label","Inspect "+stops[destination].title);
        buttons.set(destination,b);pinLayer.append(b);
      }
    }
    addExperiment(stop.experiment);
    back.disabled=!history.length;
    if(moveFocus){dialog.scrollTop=0;find(".field-notes").scrollTop=0;heading.focus({preventScroll:true});}
  }
  function visit(id,record=true) {
    if(!stops[id]||current===id)return;
    if(record)history.push(current);
    renderStop(id,true);
  }
  function showPhoto(id) {
    const container=find(".exhibit-photo");container.replaceChildren();
    const photo=stops[id].photo;
    if(!photo)return;
    const details=el("details"),summary=el("summary","","Compare with the spacecraft photograph");
    const figure=el("figure"),img=el("img");img.alt=photo.alt;img.loading="lazy";img.width=photo.width;img.height=photo.height;
    details.addEventListener("toggle",()=>{if(details.open&&!img.hasAttribute("src")) img.src=photo.path;});
    const caption=el("figcaption","",photo.caption+" ");caption.append(citation(photo.credit,photo.url));
    figure.append(img,caption);details.append(summary,figure);container.append(details);
  }
  async function open(trigger,id=trigger.dataset.instrument) {
    const token=++opening;
    opener=trigger;history=[];Object.assign(values,initialValues);
    dialog.showModal();dialog.scrollTop=0;
    renderStop(id,false);
    stage.focus({preventScroll:true});
    if(viewer)return;
    notice.hidden=false;notice.textContent="Loading the 3D model…";
    try{
      await Promise.all(runtimeFiles.map(script));
      if(!dialog.open||opening!==token)return;
      viewer=window.makeObservatoryViewer(window.THREE,stage,pinPositions);
      notice.hidden=true;renderStop(current,false);
    } catch{
      if(!dialog.open||opening!==token)return;
      notice.textContent="The 3D model couldn’t load. You can still explore the field notes.";
    }
  }
  for(const trigger of triggers){
    trigger.hidden=false;trigger.setAttribute("aria-haspopup","dialog");trigger.setAttribute("aria-controls",dialog.id);
    trigger.addEventListener("click",()=>open(trigger));
  }
  for(const b of dialog.querySelectorAll("[data-camera]")){
    b.addEventListener("click",()=>{
      if(!viewer)return;
      const mode=b.dataset.camera;
      if(mode==="reset")viewer.resetCamera();
      else if(mode==="in"||mode==="out")viewer.zoom(mode==="in"?.8:1.25);
      else viewer.turn(mode==="left"?-.24:.24);
    });
  }
  back.addEventListener("click",()=>{if(history.length)visit(history.pop(),false);});
  find(".close-dialog").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{
    opening++;closeNote();opener?.focus({preventScroll:true});
    const url=new URL(location.href);
    if(url.searchParams.has("exhibit")){
      url.searchParams.delete("exhibit");window.history.replaceState(null,"",url.href);
    }
  });
  const requested=new URL(location.href).searchParams.get("exhibit");
  if(Object.hasOwn(stops,requested)) open(triggers.find(b=>b.dataset.instrument===requested)||triggers[0],requested);
})();
