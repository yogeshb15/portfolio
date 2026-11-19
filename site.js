const search = document.querySelector("#search");
if (search) {
  const topic = document.querySelector("#topic");
  const credentials = [...document.querySelectorAll(".full-list .credential")];
  const count = document.querySelector("#result-count");
  const empty = document.querySelector("#empty");

  function filterCredentials() {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    for (const credential of credentials) {
      const inTopic = !topic.value || credential.dataset.topic === topic.value;
      const inText = credential.textContent.toLocaleLowerCase().includes(query);
      credential.hidden = !(inText && inTopic);
      if (!credential.hidden) matches++;
    }
    count.textContent = matches + (matches === 1 ? " credential" : " credentials");
    empty.hidden = matches > 0;
  }

  document.querySelector("#credential-tools").hidden = false;
  search.addEventListener("input", filterCredentials);
  topic.addEventListener("change", filterCredentials);
}

const contact = document.querySelector("#contact-form");
if (contact) {
  contact.addEventListener("submit", async event => {
    event.preventDefault();
    const button = contact.querySelector("button");
    const status = document.querySelector("#form-status");
    const data = new FormData(contact);
    if (button.disabled || data.get("_honey")) return;
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const endpoint = new URL(contact.action);
      endpoint.pathname = "/ajax" + endpoint.pathname;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok || String(result.success) !== "true") throw new Error("Delivery failed");
      status.textContent = "Message sent. Thank you for getting in touch.";
      contact.reset();
    } catch {
      status.textContent = "Your message could not be confirmed. You can email yogeshb00015@gmail.com directly.";
    } finally {
      button.disabled = false;
    }
  });
}
