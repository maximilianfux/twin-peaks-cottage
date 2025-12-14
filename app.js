console.log("app.js loaded");

// ====== CONFIG (Supabase REST) ======
// Fill these in after you create your Supabase project.
// (Anon key is allowed to be public. Don’t use the service_role key here.)
const SUPABASE_URL = "";       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "";  // from Supabase Project Settings -> API
const SUPABASE_TABLE = "inquiries";

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
// ===== Quick Info animation (stagger + on-scroll reveal) =====
const quickItems = document.querySelectorAll(".quick-info .qi");

quickItems.forEach((el, i) => el.style.setProperty("--d", i));

const qiObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      qiObserver.unobserve(entry.target); // reveal once
    });
  },
  { threshold: 0.2 }
);

quickItems.forEach((el) => qiObserver.observe(el));
/* =========================
   HERO POLISH (fade + tiny parallax)
   ========================= */
const heroImg = document.querySelector(".hero-img");
const heroSection = document.querySelector(".hero");

if (heroImg) {
  // Fade-in once loaded
  if (heroImg.complete) {
    heroImg.classList.add("is-loaded");
  } else {
    heroImg.addEventListener("load", () => heroImg.classList.add("is-loaded"));
  }

  // Subtle parallax
  const onScroll = () => {
    const rect = heroSection?.getBoundingClientRect();
    if (!rect) return;

    const progress = Math.min(Math.max((0 - rect.top) / rect.height, 0), 1);
    const translateY = progress * 18; // px, keep small
    heroImg.style.transform = `translateY(${translateY}px) scale(1.03)`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* =========================
   LIGHTBOX GALLERY (with arrows)
   ========================= */

   const lightbox = document.getElementById("lightbox");
   const lightboxImg = document.getElementById("lightboxImg");
   const closeBtn = document.getElementById("lightboxClose");
   const galleryGrid = document.getElementById("galleryGrid");
   
   // Optional buttons (add them in HTML below)
   const prevBtn = document.getElementById("lightboxPrev");
   const nextBtn = document.getElementById("lightboxNext");
   
   // Build a flat list of all thumbs in order
   let thumbs = [];
   let currentIndex = -1;
   
   function refreshThumbs() {
     thumbs = Array.from(galleryGrid?.querySelectorAll(".thumb") || []);
   }
   
   refreshThumbs();
   
   // If you ever dynamically add more thumbs later, you can call refreshThumbs() again.
   
   function getItem(index) {
     const btn = thumbs[index];
     if (!btn) return null;
     const full = btn.getAttribute("data-full");
     const img = btn.querySelector("img");
     return {
       full,
       alt: img?.alt || "Photo",
     };
   }
   
   function preloadAround(index) {
     // Preload prev + next for snappy arrow navigation
     const prev = getItem((index - 1 + thumbs.length) % thumbs.length);
     const next = getItem((index + 1) % thumbs.length);
     [prev, next].forEach((item) => {
       if (!item?.full) return;
       const im = new Image();
       im.src = item.full;
     });
   }
   
   function openLightboxAt(index) {
     if (!lightbox || !lightboxImg) return;
     if (!thumbs.length) refreshThumbs();
     if (!thumbs.length) return;
   
     currentIndex = ((index % thumbs.length) + thumbs.length) % thumbs.length;
     const item = getItem(currentIndex);
     if (!item?.full) return;
   
     lightboxImg.src = item.full;
     lightboxImg.alt = item.alt;
   
     lightbox.classList.add("open");
     lightbox.setAttribute("aria-hidden", "false");
     document.body.classList.add("modal-open");
   
     preloadAround(currentIndex);
   }
   
   function closeLightbox() {
     if (!lightbox) return;
     lightbox.classList.remove("open");
     lightbox.setAttribute("aria-hidden", "true");
     document.body.classList.remove("modal-open");
   
     // Clear src to stop downloading/playing if you swap to videos later
     if (lightboxImg) lightboxImg.src = "";
     currentIndex = -1;
   }
   
   function showNext() {
     if (currentIndex < 0) return;
     openLightboxAt(currentIndex + 1);
   }
   
   function showPrev() {
     if (currentIndex < 0) return;
     openLightboxAt(currentIndex - 1);
   }
   
   // Open on click (delegation)
   galleryGrid?.addEventListener("click", (e) => {
     const btn = e.target.closest(".thumb");
     if (!btn) return;
   
     // Ensure we’re using up-to-date list
     refreshThumbs();
   
     const index = thumbs.indexOf(btn);
     if (index === -1) return;
     openLightboxAt(index);
   });
   
   // Buttons
   closeBtn?.addEventListener("click", closeLightbox);
   prevBtn?.addEventListener("click", showPrev);
   nextBtn?.addEventListener("click", showNext);
   
   // Close when clicking backdrop
   lightbox?.addEventListener("click", (e) => {
     if (e.target === lightbox) closeLightbox();
   });
   
   // Keyboard controls
   document.addEventListener("keydown", (e) => {
     if (!lightbox?.classList.contains("open")) return;
   
     if (e.key === "Escape") closeLightbox();
     if (e.key === "ArrowRight") showNext();
     if (e.key === "ArrowLeft") showPrev();
   });

/* =========================
   INQUIRY FORM -> SUPABASE
   ========================= */
const form = document.getElementById("inquiryForm");
const statusEl = document.getElementById("formStatus");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!statusEl) return;

  statusEl.textContent = "";

  // If you haven't configured Supabase yet, just show a friendly message.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    statusEl.textContent =
      "Form is ready — add your Supabase URL + anon key in app.js to save inquiries to the database.";
    return;
  }

  const formData = new FormData(form);
  const payload = {
    name: (formData.get("name") || "").toString().trim(),
    email: (formData.get("email") || "").toString().trim(),
    check_in: formData.get("check_in") || null,
    check_out: formData.get("check_out") || null,
    message: (formData.get("message") || "").toString().trim(),
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

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Request failed: ${res.status}`);
    }

    form.reset();
    statusEl.textContent = "Sent! I’ll get back to you soon.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn’t send right now. Try again in a bit.";
  }
  
});