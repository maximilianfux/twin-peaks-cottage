console.log("app.js loaded");

// ====== CONFIG (Supabase REST) ======
const SUPABASE_URL = "https://mmppdhjakbfndlkdtikr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcHBkaGpha2JmbmRsa2R0aWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjczNDAsImV4cCI6MjA4MTI0MzM0MH0.paWKTF0WOdcmRYxeI2-7D5LtJ08lbNHYuBvhFCzu3lI";
const SUPABASE_TABLE = "inquiries";

// ===== OPTION B: Rate limit config =====
const FORM_COOLDOWN_MS = 60_000; // 1 minute

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/* =========================
   QUICK INFO ANIMATION
========================= */
const quickItems = document.querySelectorAll(".quick-info .qi");
quickItems.forEach((el, i) => el.style.setProperty("--d", i));

const qiObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      qiObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.2 }
);

quickItems.forEach((el) => qiObserver.observe(el));

/* =========================
   HERO POLISH
========================= */
const heroImg = document.querySelector(".hero-img");
const heroSection = document.querySelector(".hero");

if (heroImg) {
  if (heroImg.complete) {
    heroImg.classList.add("is-loaded");
  } else {
    heroImg.addEventListener("load", () =>
      heroImg.classList.add("is-loaded")
    );
  }

  const onScroll = () => {
    const rect = heroSection?.getBoundingClientRect();
    if (!rect) return;
    const progress = Math.min(Math.max((0 - rect.top) / rect.height, 0), 1);
    heroImg.style.transform = `translateY(${progress * 18}px) scale(1.03)`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* =========================
   LIGHTBOX GALLERY (ARROWS)
========================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("lightboxClose");
const prevBtn = document.getElementById("lightboxPrev");
const nextBtn = document.getElementById("lightboxNext");
const galleryGrid = document.getElementById("galleryGrid");

let thumbs = [];
let currentIndex = -1;

function refreshThumbs() {
  thumbs = Array.from(galleryGrid?.querySelectorAll(".thumb") || []);
}
refreshThumbs();

function getItem(index) {
  const btn = thumbs[index];
  if (!btn) return null;
  const img = btn.querySelector("img");
  return {
    full: btn.getAttribute("data-full"),
    alt: img?.alt || "Photo",
  };
}

function preloadAround(index) {
  [-1, 1].forEach((offset) => {
    const item = getItem(
      (index + offset + thumbs.length) % thumbs.length
    );
    if (!item?.full) return;
    const im = new Image();
    im.src = item.full;
  });
}

function openLightboxAt(index) {
  if (!thumbs.length) refreshThumbs();
  currentIndex = (index + thumbs.length) % thumbs.length;
  const item = getItem(currentIndex);
  if (!item) return;

  lightboxImg.src = item.full;
  lightboxImg.alt = item.alt;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  preloadAround(currentIndex);
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  lightboxImg.src = "";
  currentIndex = -1;
}

galleryGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".thumb");
  if (!btn) return;
  refreshThumbs();
  openLightboxAt(thumbs.indexOf(btn));
});

closeBtn?.addEventListener("click", closeLightbox);
prevBtn?.addEventListener("click", () => openLightboxAt(currentIndex - 1));
nextBtn?.addEventListener("click", () => openLightboxAt(currentIndex + 1));

lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox?.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") openLightboxAt(currentIndex + 1);
  if (e.key === "ArrowLeft") openLightboxAt(currentIndex - 1);
});

/* =========================
   INQUIRY FORM (ANTI-SPAM)
========================= */
const form = document.getElementById("inquiryForm");
const statusEl = document.getElementById("formStatus");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";

  // ===== OPTION B: Rate limit =====
  const lastSubmit = localStorage.getItem("lastInquiryTime");
  const now = Date.now();
  if (lastSubmit && now - Number(lastSubmit) < FORM_COOLDOWN_MS) {
    statusEl.textContent =
      "Please wait a moment before sending another message.";
    return;
  }
  localStorage.setItem("lastInquiryTime", now.toString());

  const formData = new FormData(form);

  // ===== OPTION A: Honeypot =====
  if (formData.get("company")) {
    return; // bot detected
  }

  const payload = {
    name: formData.get("name")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    check_in: formData.get("check_in") || null,
    check_out: formData.get("check_out") || null,
    message: formData.get("message")?.toString().trim(),
  };

  if (!payload.name || !payload.email || !payload.message) {
    statusEl.textContent = "Please fill out name, email, and message.";
    return;
  }

  try {
    statusEl.textContent = "Sending…";

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Request failed");

    form.reset();
    statusEl.textContent = "Sent! I’ll get back to you soon.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn’t send right now. Try again later.";
  }
});