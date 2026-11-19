// A local, example-based intent classifier. Only explicitly submitted enquiries leave the page.
(() => {
  const topics = [
    {
      id: "contact",
      examples: ["contact yogesh", "how can I email him", "send a message", "get in touch", "enquiry inquiry", "hire for a role", "recruitment opportunity", "discuss a collaboration", "book a meeting", "work together", "contact details", "offer a job", "write to the researcher", "reach out about a project", "email address"],
      answer: "You can send Yogesh an enquiry here. Include a reply address and the question or opportunity you’d like to discuss."
    },
    {
      id: "role",
      examples: ["where does he work", "where is he working now", "which company employs him", "current employer job title", "what is his current job", "who is his employer", "work at wipro", "AI research engineer", "professional experience and background", "previous employers turing innodata outlier", "what does he do for a living"],
      answer: "Yogesh is an AI Research Engineer at Wipro on a contractual basis. He builds and checks benchmarks for mathematical and coding reasoning. His earlier roles include Innodata, Turing and Outlier.",
      link: ["Research experience", "./#experience"]
    },
    {
      id: "benchmarks",
      examples: ["how does he evaluate llms", "what benchmarks does he build", "model evaluation and reasoning", "rubrics reference solvers and graders", "CosmoBench Gen", "adversarial math tasks", "tell me about your benchmark work", "how do you find grading errors", "code reasoning failures"],
      answer: "Yogesh writes mathematical and coding tasks with reference solvers and edge cases. His public CosmoBench-Gen project identified sign, unit and missing-term errors in all 12 synthetic responses in its validation set.",
      link: ["Open CosmoBench-Gen", "https://github.com/yogeshb15/-cosmobench-gen"]
    },
    {
      id: "publications",
      examples: ["what has he published", "list his papers", "cosmology publications", "research interests", "Chaplygin gas and matter creation", "dark energy modified gravity", "supernova expansion", "journal articles doi", "find his research on f(Q)", "google scholar"],
      answer: "Yogesh co-authored five cosmology papers with Dr. C.P. Singh. They examine how matter creation, Chaplygin gas, viscosity and modified gravity affect cosmic expansion. The publication list links to each paper by DOI.",
      link: ["Read the papers", "./#publications"]
    },
    {
      id: "projects",
      examples: ["what projects has he built", "where is the code", "github repositories", "scientific machine learning projects", "neural surrogate CosmoEmulator-NN", "PINN CosmoSolver numerical methods", "supernova host galaxy mass predictor", "portfolio project list", "Hubble tension analyzer", "cosmosearch anomaly detector"],
      answer: "Yogesh has eight public research repositories. Good starting points are CosmoBench-Gen for grading reasoning errors, CosmoEmulator-NN for accelerating distance calculations, and PINN-CosmoSolver for comparison with RK45 integration.",
      link: ["Explore all eight projects", "./#projects"]
    },
    {
      id: "education",
      examples: ["what degree does he hold", "what are his degrees", "academic qualifications and degrees", "where did he study", "phd applied mathematics", "education and qualifications", "university doctorate masters bachelor", "doctoral thesis", "Delhi Technological University"],
      answer: "Yogesh completed a PhD in Applied Mathematics at Delhi Technological University in 2026. He also holds an MSc in Applied Mathematics from DTU and a BSc from the University of Delhi.",
      link: ["Education and research", "./#education"]
    },
    {
      id: "skills",
      examples: ["which skills and tools", "programming languages", "does he use python pytorch", "statistics mcmc scipy", "machine learning software", "what is his tech stack", "technical expertise"],
      answer: "His toolkit includes Python, SQL, MATLAB, Mathematica, NumPy, SciPy and PyTorch. For scientific inference he uses MCMC, numerical integration and model comparison.",
      link: ["Explore methods and tools", "./#skills"]
    },
    {
      id: "credentials",
      examples: ["what certificates does he have", "linkedin learning courses", "training credentials", "certifications in python", "proof of course completion", "learning path", "completed AI courses"],
      answer: "The credential directory contains 22 completed LinkedIn Learning courses and one completed learning path. Search by course title or instructor and open the individual certificate.",
      link: ["Browse certificates", "credentials.html"]
    }
  ];

  const stop = new Set("a an the his he her is how can do does i you your me my about to of in for at yogesh bhardwaj has have what where who and tell with it".split(" "));
  function features(text) {
    const words = text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/)
      .filter(word => word && !stop.has(word));
    const terms = new Map();
    const add = (term,weight) => terms.set(term, (terms.get(term) || 0) + weight);
    for (const word of words) {
      add(word, 2);
      const padded = "^" + word + "$";
      for (let i = 0; i + 2 < padded.length; i++) add(":" + padded.slice(i, i + 3), .45);
    }
    return terms;
  }

  const samples = topics.flatMap(topic => topic.examples.map(phrase => ({topic, terms: features(phrase)})));
  const df = new Map();
  for (const sample of samples) {
    for (const term of sample.terms.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  function vector(terms) {
    const values = new Map();
    let length = 0;
    for (const [term,tf] of terms) {
      const weight = tf * (1 + Math.log((1 + samples.length) / (1 + (df.get(term) || 0))));
      values.set(term, weight);
      length += weight * weight;
    }
    return { values, norm: Math.sqrt(length) || 1 };
  }
  for (const sample of samples) sample.vector = vector(sample.terms);
  function match(question) {
    const q = vector(features(question));
    let best = null;
    let bestScore = .24;
    for (const sample of samples) {
      let dot = 0;
      for (const [term,weight] of q.values) dot += weight * (sample.vector.values.get(term) || 0);
      const score = dot / (q.norm * sample.vector.norm);
      if (score > bestScore) { bestScore = score; best = sample.topic; }
    }
    return best;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "assistant-dialog";
  dialog.id = "portfolio-assistant";
  dialog.setAttribute("aria-labelledby", "assistant-title");
  dialog.innerHTML = `
    <header class="assistant-head">
      <div><h2 id="assistant-title">Ask about Yogesh</h2><p>Research and enquiries</p></div>
      <button type="button" class="close-dialog" aria-label="Close assistant">×</button>
    </header>
    <div class="assistant-scroll">
      <div class="conversation" role="log" aria-label="Conversation" aria-live="polite"></div>
      <div class="suggestions">
        <button type="button" data-question="What benchmarks does he build?">How does he test AI?</button>
        <button type="button" data-question="What has he published?">Find his papers</button>
        <button type="button" data-compose>Send an enquiry</button>
      </div>
      <form class="assistant-enquiry" action="https://formsubmit.co/yogeshb00015@gmail.com" method="post" hidden>
        <h3>Email Yogesh</h3><p>Your enquiry goes to <a href="mailto:yogeshb00015@gmail.com">yogeshb00015@gmail.com</a>.</p>
        <label>Your name<input name="name" autocomplete="name" maxlength="120" required></label>
        <label>Reply email<input type="email" name="email" autocomplete="email" maxlength="254" required></label>
        <label>Your enquiry<textarea name="message" rows="4" maxlength="5000" required></textarea></label>
        <input type="text" name="_honey" tabindex="-1" autocomplete="off" hidden>
        <input type="hidden" name="_subject" value="Portfolio assistant enquiry for Dr. Yogesh Bhardwaj">
        <div class="enquiry-actions"><button class="button primary" type="submit">Send enquiry</button><button type="button" class="back-chat">Back to chat</button></div>
        <p role="status" class="send-status"></p>
      </form>
    </div>
    <form class="ask-form"><label class="sr-only" for="assistant-question">Your question</label>
      <input id="assistant-question" name="question" placeholder="Ask a research or career question…" maxlength="500" required autocomplete="off">
      <button type="submit" aria-label="Ask question">↑</button>
    </form>`;
  document.body.append(dialog);
  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "assistant-launch";
  launch.innerHTML = '<span class="chat-mark" aria-hidden="true"></span> Ask about Yogesh';
  document.body.append(launch);
  const log = dialog.querySelector(".conversation");
  const ask = dialog.querySelector(".ask-form");
  const question = ask.elements.question;
  const enquiry = dialog.querySelector(".assistant-enquiry");
  const suggestions = dialog.querySelector(".suggestions");
  let opener = launch;
  let draftSuggestion = "";
  bindEnquiry(enquiry);

  function say(text, visitor = false, link = null) {
    const row = document.createElement("div");
    row.className = visitor ? "message visitor" : "message reply";
    const speaker = document.createElement("span");
    speaker.className = "sr-only";
    speaker.textContent = visitor ? "You: " : "Assistant: ";
    row.append(speaker, document.createTextNode(text));
    if (link) {
      const a = document.createElement("a");
      [a.textContent, a.href] = link;
      a.addEventListener("click", () => dialog.close());
      row.append(a);
    }
    log.append(row);
  }
  say("Ask me about Yogesh’s research, experience or certificates. To contact him directly, choose “Send an enquiry”.");
  function compose() {
    enquiry.hidden = false;
    suggestions.hidden = ask.hidden = log.hidden = true;
    if (draftSuggestion && !enquiry.elements.message.value) enquiry.elements.message.value = draftSuggestion;
    enquiry.querySelector("input[name=name]").focus();
  }
  function answer(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    say(trimmed, true);
    question.value = "";
    const topic = match(trimmed);
    if (topic?.id === "contact") {
      if (trimmed.split(/\s+/).length >= 6) draftSuggestion = trimmed;
      say(topic.answer);
      compose();
      return;
    }
    const greeting = /^(hello|hi|hey|namaste)[!. ]*$/i.test(trimmed);
    if (topic) say(topic.answer, false, topic.link);
    else if (greeting) say("Hello! Ask about a project, publication or qualification, or choose “Send an enquiry” to write to Yogesh.");
    else {
      draftSuggestion = trimmed;
      say("The portfolio doesn’t cover that question. Choose “Send an enquiry” to put it in a draft for Yogesh.");
    }
    log.lastElementChild.scrollIntoView({block:"nearest"});
    question.focus();
  }
  ask.addEventListener("submit", event => { event.preventDefault(); answer(question.value); });
  for (const button of suggestions.querySelectorAll("[data-question]")) {
    button.addEventListener("click", () => answer(button.dataset.question));
  }
  suggestions.querySelector("[data-compose]").addEventListener("click", compose);
  enquiry.querySelector(".back-chat").addEventListener("click", () => {
    enquiry.hidden = true;
    suggestions.hidden = ask.hidden = log.hidden = false;
    question.focus();
  });
  dialog.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener.focus());
  for (const trigger of [launch, ...document.querySelectorAll("[data-open-assistant]")]) {
    trigger.hidden = false;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialog.id);
    trigger.addEventListener("click", () => {
      opener = trigger;
      dialog.showModal();
      if (enquiry.hidden) question.focus();
      else enquiry.elements.name.focus();
    });
  }
})();
