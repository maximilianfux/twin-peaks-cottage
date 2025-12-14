console.log("app.js loaded");
// ====== CONFIG (Supabase REST) ======
// Fill these in after you create your Supabase project.
// (Anon key is allowed to be public. Don’t use the service_role key here.)
const SUPABASE_URL = "";       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "";  // from Supabase Project Settings -> API
const SUPABASE_TABLE = "inquiries";

document.getElementById("year").textContent = new Date().getFullYear();

// ====== Lightbox Gallery ======
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("lightboxClose");

document.getElementById("galleryGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".thumb");
  if (!btn) return;

  const full = btn.getAttribute("data-full");
  lightboxImg.src = full;
  lightbox.classList.add("show");
  lightbox.setAttribute("aria-hidden", "false");
});

function closeLightbox() {
  lightbox.classList.remove("show");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
}

closeBtn.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ====== Inquiry Form -> Supabase (Database requirement) ======
const form = document.getElementById("inquiryForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";

  // If you haven't configured Supabase yet, just show a friendly message.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    statusEl.textContent = "Form is ready — add your Supabase URL + anon key in app.js to save inquiries to the database.";
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

  // basic sanity check
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
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
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