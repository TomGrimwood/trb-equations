const katex = require("katex");

class KatexAssistant {
  constructor() {
    this.injectKatexCSS();
    this.handleRequest();
    this.observeMutations();
  }

  injectKatexCSS() {
    const existingLink = document.querySelector("link[href*='katex.min.css']");
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      document.head.appendChild(link);
    }
  }

  observeMutations() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          this.createCopyEquationButtons();
          this.renderKatex();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  createCopyEquationButtons() {
    const equations = Array.from(document.querySelectorAll(".katex"));
    equations.forEach(equation => {
      if (!equation.classList.contains("copyable-equation")) {
        equation.style.cursor = "pointer";
        equation.classList.add("copyable-equation");
        equation.addEventListener("click", () => {
          const text = equation.querySelector(".katex-mathml annotation").innerHTML;
          navigator.clipboard.writeText(text);
        });
      }
    });
  }

  handleRequest() {
    chrome.runtime.onMessage.addListener(async (request, sender, response) => {
      if (request.action === "PROMPT") {
        this.submitPrompt();
      }
    });
  }

  submitPrompt() {
    const prompt = "From now on, if you need to write a mathematical expression, use katex notation and follow these rules:\n1. If it is a block equation, display it in a single P element and wrap it with double dollar signs like this:\n\n$$e=mc^{2}$$\n\n2. If it is an inline equation, use the two backslash and parenthesis notation of katex, like this: @@e^{i \\\pi}-1=0@@.\n\nCan you give me an example of a block equation and inline to see that you understand?";

    const inputElement = document.querySelector("textarea, input[type='text']");
    if (inputElement) {
      inputElement.value = prompt;
      const submitButton = inputElement.closest('form').querySelector("button[type='submit'], input[type='submit']");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.click();
      }
    }
  }

  renderKatex() {
    const elements = Array.from(document.querySelectorAll("p"));
    elements.forEach(element => {
      if (!element.dataset.katexRendered) {
        let htmlContent = element.innerHTML;

        // Render block equations
        const blockRegex = /\$\$(.*?)\$\$/gs;
        htmlContent = htmlContent.replace(blockRegex, (match, p1) => {
          try {
            return katex.renderToString(p1, { throwOnError: false, displayMode: true });
          } catch (error) {
            console.error("KaTeX rendering error:", error);
            return match;
          }
        });

        // Render inline equations
        const inlineRegex = /\@\@(.*?)\@\@/g;
        htmlContent = htmlContent.replace(inlineRegex, (match, p1) => {
          try {
            return katex.renderToString(p1, { throwOnError: false, displayMode: false });
          } catch (error) {
            console.error("KaTeX rendering error:", error);
            return match;
          }
        });

        element.innerHTML = htmlContent;
        element.dataset.katexRendered = 'true';
      }
    });
  }
}

const katexAssistant = new KatexAssistant();