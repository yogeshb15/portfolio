// Build a read-only search index from the portfolio's published content in the visitor's browser.
(() => {
  "use strict";

  const sections = {
    project: ["Projects", "research.html#projects"],
    job: ["Experience", "profile.html#experience"],
    paper: ["Research papers", "research.html#publications"],
    degree: ["Degrees", "profile.html#education"],
    talk: ["Conference presentations", "profile.html#education"],
    award: ["Research awards", "profile.html#awards"],
    skill: ["Methods and tools", "research.html#skills"],
    course: ["LinkedIn Learning certificates", "credentials.html"],
    training: ["Other certifications", "credentials.html#other-training"],
    exhibit: ["Observatory exhibits", "space.html#observatory"],
    info: ["Research portfolio", "./"]
  };
  const clean = s => (s || "").replace(/\s+/g, " ").trim();
  const text = node => clean(node?.textContent);
  const get = (node, selector) => text(node?.querySelector(selector));
  const all = (node, selector) => [...(node?.querySelectorAll(selector) || [])];
  const href = (node, selector) => node?.querySelector(selector)?.getAttribute("href");
  const norm = value => clean(value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/['’]s\b/g, "").replace(/(\d),(?=\d{3})/g,"$1")
    .replace(/f\s*\(q\)/g,"fq").replace(/c\+\+/g,"cplusplus").replace(/ph\.?\s?d\b/g,"phd")
    .replace(/[^a-z0-9@.]+/g," ").replace(/\.(?!\d)/g," "));
  const unique = values => [...new Set(values.filter(Boolean))];
  const adjectives = {
    published:"paper", publications:"paper", publication:"paper", papers:"paper", articles:"paper",
    master:"msc", doctoral:"phd", doctorate:"phd", bachelors:"bachelor", masters:"msc",
    certificates:"certificate", certifications:"certificate", certification:"certificate", credentials:"certificate",
    courses:"course", coursework:"course", repositories:"repository", repo:"repository", repos:"repository",
    projects:"project", roles:"role", employers:"employer", jobs:"job", companies:"company",
    mathematics:"math", mathematical:"math", maths:"math", computational:"computing",
    students:"student", learners:"student", instances:"sample", samples:"sample",
    redshifts:"redshift", models:"model",
    presentations:"talk", presentation:"talk", conferences:"conference", talks:"talk", awards:"award",
    books:"book", degrees:"degree", skills:"skill", tools:"tool",
    stops:"stop", exhibits:"exhibit", craters:"crater", rings:"ring", frequencies:"frequency", strings:"string", multiplied:"magnification",
    plucked:"pluck", plucking:"pluck", magnify:"magnification", magnifies:"magnification",
    hobbies:"hobby", abilities:"skill",
    results:"result", datasets:"dataset", tests:"test", benchmarks:"benchmark", graded:"grader", grading:"grader",
    colours:"color", colour:"color", photos:"photo", photograph:"photo", photography:"photo", images:"photo",
    completion:"completed", learned:"learn", completed:"complete",
    dates:"date", speak:"language", speaks:"language", languages:"language",
    january:"jan", february:"feb", march:"mar", april:"apr", june:"jun", july:"jul", august:"aug", september:"sep", october:"oct", november:"nov", december:"dec", checking:"check"
  };
  const stop = new Set(("a an the and or of at in on to by for from with across among between about that which what who whom whose when where how why does did do has had have are were is was be been his her him he she i me my our you your yogesh bhardwaj dr please tell say show give find get can could would want like any know also all every each some list name names mention mentioned give there these those this what s it them their work working works its as than then tell me more info information explain describe details detail biography profile portfolio site website").split(" "));
  function terms(value) {
    return unique(norm(value).split(" ").filter(w => w && !stop.has(w)).map(w => adjectives[w] || w));
  }
  const generic = new Set(("paper project repository source code job role experience employer careers career degree qualification academic education skill technical engineering tool research course certificate training learning linkedin talk conference award exhibit observatory view stop list group public published completed background total many much count number current earlier former other previous past instructor taught teacher teach author wrote date year issued issue done results result location paper read website page link links url urls result examples available include highlight highlights find special different kinds receiving recent latest access build builds studied study school complete receive received present presented use uses hold one two three four five six seven eight nine ten twenty").split(" "));
  const extraAliases = {
    job: "employment position workplace company organization",
    degree: "degree qualification education university studied graduated major admission",
    paper: "publication paper journal article doi",
    talk: "presentation conference oral presented conference talks",
    award: "award honours honors prizes recognition",
    course: "completed certificate credential instructor linkedin learning",
    training: "external certificate training",
    project: "project code repository",
    skill: "tools skills methods technology toolkit expertise",
    exhibit: "3d observatory space exhibit model"
  };
  const experimentFacts = {
    eyepiece:"With a 600 mm objective, the 25 mm eyepiece gives 24× magnification and the 10 mm eyepiece gives 60×.",
    octave:"Select Open string and pluck to hear A2 at 110 Hz. At the twelfth fret the A string sounds A3 at 220 Hz.",
    declination:"The example control ranges from 35° west to 35° east. At 0° the true-north marker and magnetic needle align."
  };
  function compile(home, credentials, guide, research=home, profile=home) {
    const records = [];
    function add(type, title, body, options = {}) {
      if (!title) return;
      const row={type,title,body:body || "",...options};
      row.id = options.id || type + ":" + norm(title);
      row.links = (options.links || [sections[type]]).filter(pair=>pair?.[0] && pair?.[1]);
      row.summary = options.summary || title;
      row.alias = [extraAliases[type],options.alias].filter(Boolean).join(" ");
      records.push(row);
      return row;
    }
    for (const card of all(research,"#projects .project-card")) {
      const title=get(card,"h3"), stack=get(card,"small"), domain=get(card,".micro");
      add("project",title,get(card,"p"),{meta:stack, alias:domain+" "+title.replace(/[^a-z0-9]/gi,""),
        summary:title+" · "+domain,links:[[title+" on GitHub",href(card,"a")]]});
    }
    const current=profile.querySelector("#experience .current");
    if (current) {
      const title=get(current,".company").split(" · ")[0], role=get(current,"h3");
      add("job",title,all(current,"p").map(text).join(" "),{id:"job:current",meta:[role,...get(current,".company").split(" · ").slice(1)].join(" · "),
        summary:title+" · "+role+" (current)",alias:"current employer current job presently now employed workplace benchmark benchmarking grader mathematics code"});
    }
    for (const job of all(profile,"#experience .entry")) {
      const title=get(job,"strong"), role=get(job,"h4"), date=get(job,"small");
      add("job",title,get(job,"p"),{meta:role+" · "+date,date,summary:title+" · "+role+" · "+date,alias:role+" past employer former job"});
    }
    for (const paper of all(research,".paper-list li")) {
      const title=get(paper,"h3"), date=get(paper,"time"), journal=get(paper,"p"), url=href(paper,"a");
      add("paper",title,journal,{meta:date,date,doi:url,summary:title+" ("+date+")",
        alias:[journal,url].filter(Boolean).join(" "),links:[["Open paper · DOI",url]]});
    }
    for (const degree of all(profile,".degrees > article")) {
      const title=get(degree,"h3"), date=get(degree,"small"), school=get(degree,"strong");
      add("degree",title,get(degree,"p"),{meta:school+" · "+date,date,summary:title+" · "+school+" · "+date,
        alias:/phd/i.test(title)?"doctorate phd thesis dissertation highest":"",links:[sections.degree]});
    }
    for(const entry of all(profile,".degrees details")){
      const isAward=entry.id==="awards";
      for(const item of all(entry,"li")){
        const body=clean([...item.childNodes].map(n=>n.nodeName==="BR"?" · ":n.textContent).join(""));
        const title=isAward?text(item):get(item,"strong");
        add(isAward?"award":"talk",title,body,{summary:body,links:href(item,"a")?[[text(item),href(item,"a")]]:undefined});
      }
    }
    for (const card of all(research,".skill-grid > div")) add("skill",get(card,"h3"),get(card,"p"),{summary:get(card,"h3")+" · "+get(card,"p")});
    for(const card of all(credentials,".full-list .credential")){
      const title=get(card,"h3"), date=get(card,"time"), teacher=get(card,"small").split(" · ")[0],topic=card.getAttribute("data-topic") || "";
      add("course",title,topic,{meta:teacher+" · "+date,teacher,date,topic,
        summary:title+" · "+teacher+" · "+date,links:[["Open certificate",href(card,"h3 a")]]});
    }
    for(const item of (credentials.querySelector("#other-training")?all(credentials,"#other-training li"):all(home,"#certifications details li"))){
      const line=text(item),title=line.split(" · ")[0];
      add("training",title,line.replace(title+" · ",""),{summary:line});
    }
    const homeLink=(selector,label)=>[label,href(home,selector)];
    function info(id,title,body,alias,links) {
      return add("info",title,body,{id:"info:"+id,alias,links});
    }
    const figure = profile.querySelector("#about img");
    info("profile","Dr. Yogesh Bhardwaj",clean(get(profile,"#about .role")+". "+get(profile,"#about .intro-copy")),
      "biography introduction background who about yourself tell me yourself speciality specialist",[["Meet Yogesh","profile.html#about"]]);
    if(figure)info("portrait","The mountain portrait",figure.getAttribute("alt"),"photo photograph picture hero mountains sunset silhouette site portrait image",[[ "Homepage portrait","profile.html#about"]]);
    info("coauthor","Research with Dr. C.P. Singh",get(research,"#publications .side-note"),
      "co author coauthor collaborators collaborator partner coauthored cp singh publication overarching matter creation cosmic expansion focus", [sections.paper]);
    info("hobbies","Beyond the desk",get(research,"#hobbies p"),"hobbies interests spare time outside work sport cricket badminton chess places travel parakram tournament university team", [["Beyond the desk","research.html#hobbies"]]);
    const address=get(home,"#contact .email"), contactBody=clean(get(home,"#contact .side-note")+" "+get(home,"#contact .contact-extra"));
    info("contact","Contact Yogesh",clean(address+". "+contactBody),"email contact reach mail collaboration recruiting hire job enquiry inquiry recruiter write location city based delhi language hindi english",
      [homeLink("#contact .email",address),["Write an enquiry","./#contact"]]);
    const accounts=[...all(home,"#contact .side-links a"),...all(research,"#publications .side-links a")];
    for(const a of accounts)info(norm(text(a)),text(a),a.getAttribute("href"),"professional account social profile "+text(a),[[text(a),a.getAttribute("href")]]);
    const galleryLinks=["about","projects","experience","publications","education","skills","certifications","observatory","contact"]
      .map(id=>[({about:"Portrait",publications:"Papers",skills:"Methods",certifications:"Learning"})[id] || id[0].toUpperCase()+id.slice(1),"gallery.html?station="+id]);
    info("tour","Gallery tour","Tour the nine stations using the gallery map. Drag to orbit, use the left and right arrow keys to visit adjacent stations, A and D to turn, and plus or minus to zoom.",
      "museum gallery map tour station navigation research portfolio tour",galleryLinks);
    for(const station of window.PortfolioStations || []) {
      info("station-"+station.id,station.sculpture,station.detail+" "+station.copy,
        station.name+" gallery station sculpture model object instrument",[["Visit the "+station.name+" station","gallery.html?station="+station.id]]);
    }
    if(window.StarAtlas){
      info("flight","Galaxy flight","Scroll or use the Galaxy, Solar system and Planet controls to change scale. Select Earth, Mars, Jupiter or Saturn, then drag sideways to turn the globe. Scroll farther for field notes and the portfolio chapters. The spiral galaxy is an artist’s illustration and distances are compressed.",
        "star atlas space atlas fly zoom galaxy planet flight scroll navigation",[["Explore the space atlas","space.html"]]);
      for(const [id,w] of Object.entries(window.StarAtlas))info("world-"+id,w.name+" planet field note",w.note,
        w.name+" "+w.kind+" planet field notes",[[w.name+" in 3D","space.html?planet="+id],["NASA · "+w.name,w.source]]);
    }
    if(guide?.stops) {
      for(const [key,stop] of Object.entries(guide.stops)) {
        const url="space.html?exhibit="+encodeURIComponent(key)+"#observatory";
        const trail=[];
        for(let id=key;id && guide.stops[id];id=guide.stops[id].parent) trail.unshift(guide.stops[id].title);
        const sources=[[stop.title+" in 3D",url]];
        if(guide.references?.[stop.source])sources.push(guide.references[stop.source]);
        if(["moon","lunarSurface","tycho","summit"].includes(key))sources.push(["Lunar data · NASA SVS / LRO","https://svs.gsfc.nasa.gov/4720/"]);
        const photo=stop.photo?clean([stop.photo.caption,stop.photo.alt,"Credit: "+stop.photo.credit].join(" ")):"";
        const experiment=experimentFacts[stop.experiment] || "";
        add("exhibit",stop.title,clean([stop.text,experiment].join(" ")),{id:"exhibit:"+key,alias:clean(key+" "+stop.heading+" "+(stop.experiment || "")),meta:stop.note || "",
          trail,photo,source:guide.references?.[stop.source]?.[0] || "",next:(stop.links||[]).map(id=>guide.stops[id]?.title).filter(Boolean),links:sources});
      }
      info("controls","Exploring the observatory","Select a model marker or a destination under Explore next. Drag or use the arrow keys to orbit. Scroll, pinch, or choose + and − to zoom. Reset view restores the camera. The exhibit path and Back one stop return to earlier views. Link to this view opens the same exhibit directly.",
        "controls navigation navigate rotate orbit reset zoom pinch keyboard arrow mobile drag share permalink back guide how use mouse wheel",[sections.exhibit]);
    }
    const byId=new Map(records.map(row=>[row.id,row]));
    const df=new Map();
    for(const r of records){
      r.titleWords=terms(r.title);
      r.hintWords=terms(r.alias+" "+(r.meta||"")+" "+(r.topic||"")+" "+(r.teacher||""));
      r.bodyWords=terms([r.body,r.photo,r.source,r.doi,r.summary].filter(Boolean).join(" "));
      r.vocabulary=new Set([...r.titleWords,...r.hintWords,...r.bodyWords]);
      for(const w of r.vocabulary)df.set(w,(df.get(w)||0)+1);
    }
    return {records,byId,df};
  }

  const groups=[
    ["course",/\b(?:certificate|certification|credential|course|learning path|instructor|taught|trainer)\w*\b/],
    ["paper",/\b(?:paper|journal|publication|published|article|doi)\w*\b/],
    ["project",/\b(?:project|repositor|repo)\w*\b/],
    ["talk",/\b(?:conferences?|presentations?|talks?|presented)\b/],
    ["award",/\b(?:awards?|honou?rs?|recognitions?|prizes?)\b/],
    ["degree",/\b(?:degrees?|education|qualifications?|studied|universit(?:y|ies)|college|bachelor|master|msc|phd|thesis|doctorate)\b/],
    ["skill",/\b(?:skills?|toolkit|technologies|programming languages|tools|methods|frameworks?|tech stack)\b/],
    ["job",/\b(?:jobs?|career|roles?|employment|experience|companies|employers?|positions?|worked|working|employed)\b/],
    ["exhibit",/\b(?:exhibits?|observatory|stops?|3d views?|solar system)\b/]
  ];
  const courseTypes=new Set(["course","training"]);
  const paperYear = /\b(?:19|20)\d{2}\b/g;
  const unavailable=/\b(?:salary|benefits|compensation|paycheck|payroll|phone|mobile number|whatsapp|passport|married|birthday|born|home address|blood type|bank|password|gpa|cgpa)\b/;
  const follow=/\b(?:it|its|that|this|these|those|they|them|their|there|former|latter)\b|^(?:and |what about |tell me more|go deeper|more details|when exactly|who taught|which journal|give me the link)/;
  const fields={
    date:/\b(?:when|date|year|month|period)\b/,
    teacher:/\b(?:who (?:taught|teaches)|instructor|lecturer|teacher|trainer)\b/,
    doi:/\bdoi\b/,
    photo:/\b(?:photograph|photo|spacecraft|credit|image|picture|mission)\w*\b/,
    path:/\b(?:route|path|deeper|next|reach|navigate|get to|how to open)\b/,
    sources:/\b(?:source|sources|reference|references|citation|credit)\b/
  };
  function linksFor(rows,list=false,allLinks=false) {
    if(list && !allLinks && rows.length>6) return unique(rows.map(r=>r.type)).map(t=>sections[t]);
    const seen=new Set(), links=[];
    for(const r of rows){
      const pairs=list?r.links.slice(0,1):r.links;
      for(const [label,url] of pairs){
        if(seen.has(url))continue;
        seen.add(url);
        links.push([list && rows.length>1 && (r.type==="course"||r.type==="paper")?r.title:label,url]);
      }
    }
    return links;
  }
  function result(rows,message,list=false,allLinks=false) {
    return { text:message, links:linksFor(rows,list,allLinks), context:{ids:rows.map(r=>r.id), type:rows[0]?.type} };
  }
  function single(r,q) {
    if(r.type==="exhibit" && fields.path.test(q)){
      const trail=r.trail.join(" → "), next=r.next.length?"Explore next: "+r.next.join(", ")+".":"You can return to any earlier stop using the exhibit path.";
      return result([r],trail+"\n"+next);
    }
    if(r.type==="exhibit" && fields.photo.test(q) && r.photo) return result([r],r.photo);
    if(r.type==="exhibit" && fields.sources.test(q)) return result([r],r.title+" · "+(r.source||"See the exhibit for supporting material.")+(r.photo?"\n"+r.photo:""));
    if (r.id==="job:current" && /\b(?:when|start date|joined|since|how long)\b/.test(q))return result([r],"The portfolio lists Wipro as the current contractual role. It does not give a start date.");
    if (courseTypes.has(r.type) && /\b(?:price|cost|duration|how many hours|how long)\b/.test(q))return result([r],"The public listing provides a completion record. It does not give the duration or price.");
    if(r.type==="course"){
      const path=/learning path/i.test(r.teacher);
      const details=path?"A completed LinkedIn Learning path.":"Instructor: "+r.teacher+".";
      return result([r],r.title+"\n"+details+" Completed "+r.date+". Topic: "+r.topic+".");
    }
    if(r.type==="paper") return result([r],r.title+"\n"+r.body+" ("+r.date+")."+(fields.doi.test(q)&&r.doi?"\nDOI: "+r.doi.replace(/^https?:\/\/doi\.org\//,""):""));
    if(r.type==="talk" || r.type==="award")return result([r],r.body);
    if(r.type==="info"){
      const quote=/\b(?:I|My)\b/.test(r.body);
      return result([r],quote?"Yogesh writes, “"+r.body+"”":r.body);
    }
    const body=/\b(?:I|My|my)\b/.test(r.body)?"Yogesh writes, “"+r.body+"”":r.body;
    const prefix=r.type==="exhibit" ? r.title : [r.title,r.meta].filter(Boolean).join(" · ");
    return result([r],[prefix,body,r.type==="exhibit"?r.meta:""].filter(Boolean).join("\n"));
  }
  function collection(rows, q, type, filtered=false) {
    const heading=sections[type][0];
    if(!rows.length)return null;
    if(rows.length===1)return single(rows[0],q);
    if(/\b(?:how many|count|number of)\b/.test(q) && !/\b(?:list|names?|which)\b/.test(q)){
      if(type==="award")return result(rows,"The awards section records the following honors.\n"+rows.map(r=>"• "+r.summary).join("\n"),true);
      let reply=heading+": "+rows.length+".";
      if(type==="course" && !filtered){
        const paths=rows.filter(row=>/learning path/i.test(row.teacher || "")).length;
        const courses=rows.length-paths;
        reply="The directory contains "+rows.length+" LinkedIn Learning certificates, covering "+courses+" courses and "+paths+" learning "+(paths===1?"path":"paths")+".";
      }
      return result(rows,reply,true);
    }
    return result(rows,heading+" ("+rows.length+")\n"+rows.map(r=>"• "+r.summary).join("\n"),true,/\b(?:links?|urls?)\b/.test(q));
  }
  function rank(index,q,rows,queryWords){
    const query=queryWords || terms(q);
    const words=query.filter(w=>!generic.has(w));
    const scoring=words.length?words:query;
    const total=index.records.length;
    return rows.map(r=>{
      const normalTitle=norm(r.title);
      const titleHit=(" "+q+" ").includes(" "+normalTitle+" ") && normalTitle.length>=4;
      let score=titleHit?14+Math.min(8,r.titleWords.length):0;
      let matches=0,matchedWeight=0,weight=0;
      for(const token of scoring){
        const idf=1+Math.log((total+1)/(1+(index.df.get(token)||0)));
        weight+=idf;
        if(!r.vocabulary.has(token))continue;
        matches++;
        matchedWeight+=idf;
        score+=idf*(r.titleWords.includes(token)?2.8:r.hintWords.includes(token)?1.6:1);
      }
      const coverage=weight?matchedWeight/weight:0;
      score *= .20+.8*coverage;
      return {r,score,matches,coverage,titleHit};
    }).filter(x=>x.matches||x.titleHit).sort((a,b)=>b.score-a.score);
  }
  function lookup(index,raw,context) {
    const q=norm(raw);
    if(!q || unavailable.test(q))return null;
    const rows=index.records, byId=id=>index.byId.get(id);
    const info=(id)=>{const r=byId("info:"+id);return r?single(r,q):null;};
    const buckets=t=>rows.filter(r=>r.type===t);
    const existing=context?.ids?.map(byId).filter(Boolean)||[];
    const question=terms(q);

    if(window.StarAtlas){
      for(const id of Object.keys(window.StarAtlas)){
        if(new RegExp("\\b"+id+"\\b").test(q) && !/moon|tycho|division|eclipse|instrument|exhibit/.test(q) && (id!=="saturn" || /field note|planet|atlas/.test(q)))return info("world-"+id);
      }
      if(/galaxy flight|space atlas|star atlas|spiral galaxy|fly to|zoom (?:in )?to the planets|which planets|what planets|how (?:can|do) i scroll/.test(q))return info("flight");
    }
    const station=(window.PortfolioStations || []).find(s=>
      q.includes(norm(s.sculpture)) || (/\b(?:sculpture|gallery station|station|pedestal)\b/.test(q)
        && [s.name,s.id].some(name=>q.split(" ").includes(norm(name)))));
    if(station)return info("station-"+station.id);
    if (/\b(?:tour|gallery|museum)\b/.test(q) && !/\b(?:crater|ring|course|guitar|paper|telescope|compass)\b/.test(q))return info("tour");
    if (/\b(?:co ?author(?:ed|s)?|collaborator|collaborated|writes? (?:papers )?with|singh)\b/.test(q) && !/\b(?:list|which|titles)\b/.test(q))return info("coauthor");
    if (/\b(?:hobb(?:y|ies)|outside (?:of )?work|spare time|cricket|badminton|chess|travels?|parakram|ladakh|spiti)\b/.test(q))return info("hobbies");
    if (/\b(?:email|e mail|contact|reach him|reach yogesh|get in touch|based|spoken languages|languages (?:does|can) he speak|where does he live)\b/.test(q) && !/\b(?:course|paper)\b/.test(q))return info("contact");
    if (/\b(?:orcid|scholar)\b/.test(q))return info(q.includes("orcid")?"orcid":"google scholar");
    if (/\blinkedin\b/.test(q) && !/\b(?:courses?|learning|certificat\w*|credentials?|training)\b/.test(q))return info("linkedin");
    if (/\bgithub\b/.test(q) && !/\b(?:project\w*|repos\w*|code|software)\b/.test(q))return info("github");
    if (/\b(?:zoom|pinch|rotate|orbit controls|navigate|navigation controls|reset view|keyboard controls|share (?:an |a )?(?:view|link)|permalink)\b/.test(q) && !existing.length && !/\b(?:crater|rings|compass|fret|eyepiece)\b/.test(q))return info("controls");
    if (/\b(?:photo|picture|portrait|image)\b/.test(q) && /\b(?:yogesh|profile|homepage|hero|mountain|sunset|silhouette)\b/.test(q))return info("portrait");
    const teaches=/\b(?:learn|teach|study|attend|research|work)\w*\b/.test(q);
    if(/\b(?:who is (?:dr )?yogesh|about (?:yourself|yogesh)|introduce|biography|overview of yogesh)\b/.test(q) && !teaches) return info("profile");
    if (/\b(?:current employer|current (?:role|job|company|position)|work(?:s|ing)? (?:now|currently)|where (?:is|does) (?:yogesh|he) work|now employed|does he (?:still )?work at wipro|(?:his|your) benchmark(?:ing)? work|how does he (?:test|evaluate) (?:ai|models|llms)|what benchmarks does he build)\b/.test(q)){
      const r=byId("job:current");return r?single(r,q):null;
    }

    const scopes=groups.filter(([,re])=>re.test(q)).map(([k])=>k);
    let type=scopes[0];
    const otherTraining=/\b(?:coursera|udemy|other certifications?|other certificates?|outside linkedin)\b/.test(q);
    if(otherTraining)type="training";
    if (/\b(?:msc|master|undergraduate|phd|doctoral)\b/.test(q) && /\b(?:project|thesis|dissertation|degree)\b/.test(q)) type="degree";
    if (!type && /\b(?:can|does) he (?:use|know|program)\b/.test(q)) type="skill";
    const exactTitle=rows.filter(r=>r.type!=="info" && (" "+q+" ").includes(" "+norm(r.title)+" ") && norm(r.title).length>=4);
    if(exactTitle.length>1 && /\b(?:compare|difference|both|and|versus|vs)\b/.test(q)){
      const distinct=exactTitle.filter(r=>!exactTitle.some(other=>other!==r && norm(other.title).includes(norm(r.title))));
      if(distinct.length>1) return result(distinct,distinct.map(r=>single(r,q).text).join("\n\n"));
    }
    const moreSpecificExperiment=Object.keys(experimentFacts).find(key=>(" "+q+" ").includes(" "+key+" "));
    const specific=(moreSpecificExperiment && byId("exhibit:"+moreSpecificExperiment)) || exactTitle.sort((a,b)=>b.title.length-a.title.length)[0];
    const usableTitle=specific && (specific.titleWords.length>=3 || !type || specific.type===type || specific.type==="project" || specific.type==="job" || (specific.type==="exhibit" && !['course','paper','project','job'].includes(type)));
    const contextCue=follow.test(q) || fields.date.test(q) || fields.teacher.test(q) || fields.doi.test(q) || fields.photo.test(q) || fields.sources.test(q);
    if(existing.length===1 && contextCue && !usableTitle && (!type || type===existing[0].type) &&
       question.filter(w=>!generic.has(w) && !["taught","who","much","source","photo","height","wide","large","size","year","faster","frequency","doi","what","s","exactly","compare","instructor","code","wrote","date","read","link","result","published","happened","next","deeper","there","name","location","where","company","use","used","with","can","find","published","data","did","things","give","journal","technologies","paper","took","course","tool","duration","completed","cost","long","time","start","join","joined"].includes(w)).length<=1){
      if (/\b(?:cost|price|duration|how long|how many hours)\b/.test(q) && courseTypes.has(existing[0].type))
        return result(existing,"The certificate listing provides the title and completion record. It does not give a duration or price.");
      return single(existing[0],q);
    }
    if(usableTitle && !(type && /\b(?:list all|all of|how many)\b/.test(q)) &&
      !(type==="exhibit" && /\b(?:all|list|views|stops|route|path)\b/.test(q) && !fields.path.test(q))){

      return single(specific,q);
    }
    if (!type && existing.length && /^(?:list them|show them|which ones|all of them)$/.test(q))return collection(existing,q,existing[0].type);
    if (!type && /\b(?:former|previous|past) employers?\b/.test(q))type="job";
    if (!type && /\b(?:benchmarks?|benchmarking)\b/.test(q)) {
      // Named project queries are handled above. The employment record describes the research practice.
      const r=byId("job:current");if(r)return single(r,q);
    }
    const refinePrevious=existing.length>1 && follow.test(q) && (!type || type===existing[0].type);
    if(refinePrevious) type=existing[0].type;
    const groupRows=refinePrevious?existing:type?buckets(type):rows;
    let candidates=groupRows;
    const years=q.match(paperYear);
    if(years && type) candidates=candidates.filter(r=>years.some(y=>[r.date,r.summary,r.body].some(s=>(s||"").includes(y))));
    if(type==="job" && /\b(?:former|previous|past|prior|earlier)\b/.test(q))candidates=candidates.filter(r=>r.id!=="job:current");
    if(type==="training" && /\b(?:coursera|udemy)\b/.test(q))candidates=candidates.filter(r=>["coursera","udemy"].some(p=>q.includes(p)&&norm(r.body).includes(p)));
    if(type==="course" && /\blearning path\b/.test(q)) candidates=candidates.filter(r=>/learning path/i.test(r.teacher));
    if(!candidates.length)return null;
    const extras=question.filter(w=>!generic.has(w) && !(years||[]).includes(w) && !(type && +w === groupRows.length) && !(type==="skill" && w==="language" && question.includes("programming")) && !["degree","job","roles","apply","kind","kinds","different","taken","take","received","won","teach","taught","participated","delivered","gave","completed","holding","hold","holds","been","participate","attended","researcher","attend","issued","professional","experience","qualifications","participated","them","including","such","way","owned","count","like","has","other","got","his","past","every","one","latest","recent","learning","path"].includes(w));
    const listIntent= /\b(?:all|list|which|how many|some|every|what are|what has|what courses|what projects|what papers)\b/.test(q) || (type && extras.length===0);
    if(scopes.length>1 && listIntent && !extras.length && /\band\b/.test(q) && !otherTraining){
      const answers=scopes.map(t=>collection(buckets(t),q,t)).filter(Boolean);
      const combined=scopes.flatMap(buckets);
      return result(combined,answers.map(a=>a.text).join("\n\n"),true);
    }
    if(type && listIntent && !extras.length && type==="course" && /\b(?:certificate|certification|credential)s?\b/.test(q) && !/\b(?:linkedin|learning|directory|course|training)\b/.test(q) && !years){
      const external=buckets("training"), combined=[...candidates,...external];
      const summary="The portfolio lists "+combined.length+" credentials: "+candidates.length+" LinkedIn Learning certificates and "+external.length+" other certifications.";
      const allNames=/\b(?:list|show|all|names|which|what are)\b/.test(q);
      return result(combined,summary+(allNames?"\n"+combined.map(r=>"• "+r.summary).join("\n"):""),true,/\b(?:links?|urls?)\b/.test(q));
    }
    if(type && listIntent && !extras.length)return collection(candidates,q,type,Boolean(years || candidates.length!==groupRows.length));
    const ranked=rank(index,q,candidates,extras.length?extras:undefined);
    if(!ranked.length)return null;
    if(type && listIntent && !specific){
      const matching=ranked.filter(x=>x.coverage>=.86);
      if(matching.length)return collection(matching.map(x=>x.r),q,type,true);
    }
    const best=ranked[0];
    if(!best.titleHit && (best.coverage<.40 || (best.matches===1 && best.coverage<.55)))return null;
    return single(best.r,q);
  }
  let pending;
  async function readPage(url) {
    const response=await fetch(url,{credentials:"same-origin"});
    if(!response.ok)throw new Error("Portfolio content could not be loaded");
    return new DOMParser().parseFromString(await response.text(),"text/html");
  }
  async function load() {
    if(!pending) {
      pending=(async()=>{
        const page=document.body.dataset.page;
        const current=(url,id)=>page===id?document:readPage(url);
        const [home,credentials,research,profile]=await Promise.all([
          current("index.html","home"),current("credentials.html","credentials.html"),
          current("research.html","research.html"),current("profile.html","profile.html")
        ]);
        return compile(home,credentials,window.observatoryGuide,research,profile);
      })().catch(error=>{pending=null;throw error;});
    }
    return pending;
  }
  async function answer(question,previousContext) {
    const index=await load();
    return lookup(index,String(question || ""),previousContext);
  }
  window.PortfolioKnowledge={answer,load,compile,lookup};
})();
