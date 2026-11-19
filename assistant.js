// Ground each answer in the current portfolio and keep follow-up context inside the visitor's tab.
(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "assistant-dialog";
  dialog.id = "portfolio-assistant";
  dialog.setAttribute("aria-labelledby", "assistant-title");
  dialog.innerHTML = `
    <header class="assistant-head">
      <div><h2 id="assistant-title">Ask about Yogesh</h2><p>Portfolio guide</p></div>
      <button type="button" class="close-dialog" aria-label="Close assistant">×</button>
    </header>
    <div class="assistant-scroll">
      <div class="conversation" role="log" aria-label="Conversation" aria-live="polite"></div>
      <div class="suggestions">
        <button type="button" data-station hidden>About this sculpture</button>
        <button type="button" data-question="What benchmarks does he build?">How does he test AI?</button>
        <button type="button" data-question="What has he published?">Find his papers</button>
        <button type="button" data-question="How does the compass work?">Explore the compass</button>
        <button type="button" data-question="List the Python certificates">Find Python certificates</button>
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
      <input id="assistant-question" name="question" placeholder="Ask about this portfolio…" maxlength="500" required autocomplete="off">
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

  let context, currentSubject;
  const localGuide = suggestions.querySelector("[data-station]");
  localGuide.addEventListener("click", () => { if(currentSubject)answer(currentSubject); });
  let pending = false;
  function say(text, visitor = false, links = []) {
    const row = document.createElement("div");
    row.className = visitor ? "message visitor" : "message reply";
    const speaker = document.createElement("span");
    speaker.className = "sr-only";
    speaker.textContent = visitor ? "You: " : "Guide: ";
    row.append(speaker, document.createTextNode(text));
    if (links.length) {
      const group = document.createElement(links.length > 4 ? "details" : "div");
      group.className = "reply-sources";
      if (links.length > 4) {
        const summary = document.createElement("summary");
        summary.textContent = "View all " + links.length + " sources";
        group.append(summary);
      }
      for (const [label, url] of links) {
        const a = document.createElement("a");
        a.textContent = label;
        a.href = url;
        if (a.origin === location.origin) a.addEventListener("click", () => {
          dialog.close();
          const exhibit = document.querySelector("#instrument-viewer[open]");
          if (exhibit && !new URL(a.href).searchParams.has("exhibit")) exhibit.close();
        });
        else if (a.protocol === "https:") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        group.append(a);
      }
      row.append(group);
    }
    log.append(row);
    return row;
  }
  say("I can look up Yogesh’s projects, papers, jobs, degrees, training and observatory exhibits. Ask for a specific result or certificate, then follow up about it.");
  function compose() {
    enquiry.hidden = false;
    suggestions.hidden = ask.hidden = log.hidden = true;
    if (draftSuggestion && !enquiry.elements.message.value) enquiry.elements.message.value = draftSuggestion;
    enquiry.querySelector("input[name=name]").focus();
  }
  async function answer(text) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    say(trimmed, true);
    question.value = "";
    if (/^(?:(?:i want to|please|can i|help me) )?(?:send|write|compose|draft|start|submit) (?:yogesh |him )?(?:an? |the )?(?:enquiry|inquiry|e-?mail|message)\b/i.test(trimmed)) {
      if (trimmed.split(/\s+/).length >= 6) draftSuggestion = trimmed;
      compose();
      return;
    }
    pending = true;
    ask.querySelector("button").disabled = true;
    const waiting = say("Looking through the portfolio…");
    waiting.scrollIntoView({block:"nearest"});
    try {
      const pointing = /^(?:(?:what(?:’s|'s| is)|explain|describe|tell me about) (?:this|that)(?: (?:sculpture|object|model|exhibit|station))?|what am i (?:looking at|seeing))\??$/i.test(trimmed);
      const reply = await window.PortfolioKnowledge.answer(pointing && currentSubject ? currentSubject : trimmed, context);
      waiting.remove();
      if (reply) {
        context = reply.context;
        say(reply.text, false, reply.links);
      } else {
        context = undefined;
        if (/^(hello|hi|hey|namaste)[!. ]*$/i.test(trimmed)) {
          say("Hello! Which part of the portfolio would you like to explore?");
        } else {
          draftSuggestion = trimmed;
          say("I couldn’t find that in the published portfolio. Try the name of a project, course or exhibit, or choose “Send an enquiry” to ask Yogesh.");
        }
      }
    } catch {
      waiting.remove();
      say("I couldn’t load the portfolio content. Check your connection and ask again.");
    } finally {
      pending = false;
      ask.querySelector("button").disabled = false;
      log.lastElementChild.scrollIntoView({block:"nearest"});
      if (dialog.open && enquiry.hidden) question.focus({preventScroll:true});
    }
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
    trigger.addEventListener("click", () => openGuide(trigger));
  }
  function openGuide(trigger, exhibitTitle) {
    opener = trigger;
    const room=document.querySelector(".museum");
    const station=window.PortfolioStations?.find(s=>s.id===room?.dataset.station);
    currentSubject=exhibitTitle || (room?.dataset.mode==="map" ? "Gallery tour" : station?.sculpture);
    localGuide.hidden=!station || Boolean(exhibitTitle);
    localGuide.textContent=room?.dataset.mode==="map"?"About the gallery map":"About this sculpture";
    dialog.showModal();
    window.PortfolioKnowledge.load().catch(() => {});
    if (exhibitTitle) {
      enquiry.hidden = true;
      suggestions.hidden = ask.hidden = log.hidden = false;
      answer(exhibitTitle);
    }
    if (enquiry.hidden) question.focus();
    else enquiry.elements.name.focus();
  }
  document.addEventListener("portfolio-exhibit-question", event => {
    openGuide(event.target, event.detail.title);
  });
})();
