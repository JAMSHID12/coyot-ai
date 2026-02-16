class CoyotChat {
  constructor() {
    this.sessionId = localStorage.getItem("coyot_session") || null;
    this.hasGreeted = false;

    this.initUI();
  }

  initUI() {
    const bubble = document.getElementById("coyot-chat-bubble");
    const chatWindow = document.getElementById("coyot-chat-window");

    // 🔥 bubble click with auto-greet
    bubble.onclick = () => {
      chatWindow.classList.toggle("open");

      if (chatWindow.classList.contains("open") && !this.hasGreeted) {
        this.hasGreeted = true;
        this.showInitialGreeting();
      }
    };

    document.getElementById("coyot-send").onclick = () => this.send();

    document
      .getElementById("coyot-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.send();
      });

    /* 🔥 ADD RESET BUTTON HANDLER (AT END OF initUI) */
    document
      .getElementById("coyot-reset-btn")
      .addEventListener("click", () => this.showResetConfirm());
  }

  addMessage(text, sender) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${sender}`;

    if (sender === "bot") {
      const avatar = document.createElement("img");
      avatar.src = "/logo.png";
      avatar.className = "bot-avatar";

      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.innerText = typeof text === "string" ? text : JSON.stringify(text, null, 2);


      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
    } else {
      const bubble = document.createElement("div");
      bubble.className = "bubble user-bubble";
      bubble.innerText = typeof text === "string" ? text : JSON.stringify(text, null, 2);


      wrapper.appendChild(bubble);
    }

    document.getElementById("coyot-chat-body").appendChild(wrapper);
    this.scrollToBottom();
  }

  clearButtons() {
    document
      .querySelectorAll("#coyot-chat-body button")
      .forEach((btn) => btn.remove());
  }

  scrollToBottom() {
    const body = document.getElementById("coyot-chat-body");
    body.scrollTop = body.scrollHeight;
  }
  async showInitialGreeting() {
  // Let backend decide the menu
  await this.sendMessage("__greet__");
  }


  // showInitialGreeting() {
  //   this.addMessage(
  //     "👋 Welcome to Coyot AI! How can I help you today?",
  //     "bot"
  //   );

  //   const options = [
  //     { label: "AI Hands-on Workshops", value: "workshops" },
  //     { label: "Advanced AI Courses", value: "courses" },
  //     { label: "AI for Business", value: "business" },
  //     { label: "Talk to Human Support", value: "support" }
  //   ];

  //   options.forEach(opt => {
  //     const btn = document.createElement("button");
  //     btn.innerText = opt.label;
  //     btn.onclick = () => {
  //       this.addMessage(opt.label, "user");
  //       this.sendMessage(opt.value);
  //     };
  //     document.getElementById("coyot-chat-body").appendChild(btn);
  //   });

  //   this.scrollToBottom();
  // }

  async send() {
    const input = document.getElementById("coyot-input");
    const message = input.value.trim();
    if (!message) return;

    this.clearButtons();
    this.addMessage(message, "user");
    input.value = "";

    await this.sendMessage(message);
  }

  async sendMessage(text) {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: this.sessionId
      })
    });

    const json = await res.json();

    if (json.session_id) {
      this.sessionId = json.session_id;
      localStorage.setItem("coyot_session", this.sessionId);
    }

    this.renderResponse(json);
  }

  renderResponse(json) {
    this.clearButtons();

    if (json.type === "info") {
      this.addMessage(json.content, "bot");
    }

    else if (json.type === "followup") {
      this.addMessage(json.content, "bot");
    }

    else if (json.type === "menu") {
      this.addMessage(json.title || "Please choose an option:", "bot");

      json.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.innerText = opt.label;
        btn.onclick = () => {
          this.addMessage(opt.label, "user");
          this.sendMessage(opt.value);
        };
        document.getElementById("coyot-chat-body").appendChild(btn);
      });

      this.scrollToBottom();
    }

    else if (json.type === "capture_lead") {
      this.addMessage(
        "✅ Thanks! Our Coyot team will contact you shortly.",
        "bot"
      );
    }
  }

  /* 🔥 NEW METHODS ADDED */

  showResetConfirm() {
    if (document.getElementById("coyot-reset-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "coyot-reset-overlay";

    overlay.innerHTML = `
      <div id="coyot-reset-box">
        <h4>Start a new chat?</h4>
        <p>This will clear the current conversation.</p>

        <div class="reset-actions">
          <button class="reset-confirm">Start New Chat</button>
          <button class="reset-cancel">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById("coyot-chat-window").appendChild(overlay);

    overlay.querySelector(".reset-cancel").onclick = () => overlay.remove();
    overlay.querySelector(".reset-confirm").onclick = () => {
      overlay.remove();
      this.resetChat();
    };
  }

  resetChat() {
    // Clear UI
    document.getElementById("coyot-chat-body").innerHTML = "";

    // Clear state
    this.sessionId = null;
    this.hasGreeted = false;

    // Clear storage
    localStorage.removeItem("coyot_session");

    // Start fresh greeting
    this.showInitialGreeting();
  }
}

window.onload = () => new CoyotChat();
