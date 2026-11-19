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


// Both the contact section and the assistant send the visitor's reviewed enquiry.
function bindEnquiry(form) {
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('[role="status"]');
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const fields = new FormData(form);
    if (submit.disabled || fields.get("_honey")) return;
    submit.disabled = true;
    status.textContent = "Sending your enquiry…";
    const endpoint = new URL(form.action);
    const recipient = endpoint.pathname.slice(1);
    endpoint.pathname = "/ajax/" + recipient;
    const fallback = document.createElement("a");
    fallback.textContent = "Open your email app with this enquiry";
    const draft = new URLSearchParams({
      subject: fields.get("_subject"),
      body: fields.get("message") + "\n\n" + fields.get("name") + "\n" + fields.get("email")
    });
    fallback.href = "mailto:" + recipient + "?" + draft.toString().replaceAll("+", "%20");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(fields)),
        signal: controller.signal
      });
      const result = await response.json();
      if (/activat|confirm.{0,12}(recipient|address|form)/i.test(result.message || "")) {
        status.replaceChildren("Email forwarding is awaiting activation. ", fallback);
      } else if (response.ok && String(result.success) === "true") {
        status.textContent = "Your enquiry was accepted for delivery to Yogesh.";
        form.reset();
      } else {
        throw new Error("Enquiry submission declined");
      }
    } catch {
      status.replaceChildren("Delivery could not be confirmed. Your draft is still here. ", fallback);
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
    }
  });
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) bindEnquiry(contactForm);
