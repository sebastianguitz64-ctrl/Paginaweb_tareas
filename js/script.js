import { CONFIG } from "./constants.js";

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const loader = document.getElementById("loader");
const revealElements = document.querySelectorAll(".reveal");
const cards = document.querySelectorAll(".price-card");
const selectedSubject = document.getElementById("selectedSubject");
const countEls = document.querySelectorAll("[data-count]");
const requestForm = document.getElementById("requestForm");
const subjectField = document.getElementById("subjectField");
const formStatus = document.getElementById("formStatus");
const deadlineField = requestForm?.elements.namedItem("deadline");

menuBtn?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("show") || false;
  menuBtn.classList.toggle("open", isOpen);
  menuBtn.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks?.classList.remove("show");
    menuBtn?.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  });
});

menuBtn?.setAttribute("aria-expanded", "false");
menuBtn?.setAttribute("aria-controls", "navLinks");

if (deadlineField instanceof HTMLInputElement) {
  deadlineField.min = new Date().toISOString().split("T")[0];
}

window.addEventListener("load", () => {
  setTimeout(() => loader?.classList.add("hide"), 500);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((el) => observer.observe(el));

cards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    if (window.innerWidth < 900) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".solicitar").forEach((btn) => {
  btn.addEventListener("click", () => {
    cards.forEach((card) => card.classList.remove("selected"));
    const card = btn.closest(".price-card");
    const subject = card?.getAttribute("data-subject");
    card?.classList.add("selected");
    if (subject && selectedSubject) {
      selectedSubject.textContent = `Materia seleccionada: ${subject}`;
    }
    if (subject && subjectField) {
      subjectField.value = subject;
    }
  });
});

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!requestForm.reportValidity()) return;

  const data = new FormData(requestForm);
  const payload = {
    name: String(data.get("name") || "").trim(),
    subject: String(data.get("subject") || "").trim(),
    description: String(data.get("description") || "").trim(),
    deadline: data.get("deadline") ? String(data.get("deadline")) : null,
  };
  const deadline = data.get("deadline");
  const message = [
    "Hola, quiero solicitar ayuda con una tarea.",
    `Nombre: ${payload.name}`,
    `Materia: ${payload.subject}`,
    `Detalle: ${payload.description}`,
    deadline ? `Fecha de entrega: ${deadline}` : "",
  ].filter(Boolean).join("\n");
  const submitButton = requestForm.querySelector('button[type="submit"]');

  setFormStatus("Registrando solicitud...", "");
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch(`${CONFIG.apiBase}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const details = Array.isArray(error.details) ? error.details.join(" ") : "";
      throw new Error(details || error.error || "No pudimos registrar la solicitud.");
    }

    let copied = true;
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      copied = false;
    }

    setFormStatus(
      copied
        ? "Solicitud registrada. Se abrirá Instagram; pega el mensaje y envíalo por DM."
        : "Solicitud registrada. Se abrirá Instagram; escribe el detalle por DM si el mensaje no se copió.",
      "success"
    );
    requestForm.reset();
    if (selectedSubject) {
      selectedSubject.textContent = "Materia seleccionada: Ninguna";
    }
    cards.forEach((card) => card.classList.remove("selected"));
    window.open(CONFIG.instagram, "_blank", "noopener,noreferrer");
  } catch (error) {
    setFormStatus(error.message || "No pudimos registrar la solicitud. Intenta de nuevo o escríbenos por Instagram.", "error");
  } finally {
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
    }
  }
});

function setFormStatus(message, type) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("success", type === "success");
  formStatus.classList.toggle("error", type === "error");
}

const animateCounter = (el) => {
  const target = Number(el.getAttribute("data-count") || 0);
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);
    if (target === 100) {
      el.textContent = `${value}%`;
    } else {
      el.textContent = String(value);
    }
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

countEls.forEach((el) => statsObserver.observe(el));

window.addEventListener("scroll", () => {
  const offset = window.scrollY * 0.08;
  document.querySelectorAll(".floating-emoji").forEach((emoji, index) => {
    const extra = ((index % 2 === 0) ? 1 : -1) * offset;
    emoji.style.transform = `translateY(${extra}px)`;
  });
});
