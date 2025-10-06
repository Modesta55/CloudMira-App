/* main.js - handles menu, forms and API calls */

// === CONFIG: REPLACE THESE two with your values ===
const API_URL = "https://script.google.com/macros/s/AKfycby5KRdn65YNClClscrnzfAEzs7lZXaGV5DeaE08iXmfwBJvOcsChTsXXGIEjeVQIFeQ/exec"; // e.g. https://script.google.com/macros/s/AKfy.../exec
const WHATSAPP_INVITE = "https://chat.whatsapp.com/GMJ6GRVzIR7JaIszZWMND3?mode=ems_copy_t"; // e.g. https://chat.whatsapp.com/XXXXXXXX or https://wa.me/234XXXXXXXX

// mobile menu toggle
document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('hamburgerBtn');
  if(toggle){
    toggle.addEventListener('click', ()=>{
      const mm = document.getElementById('mobileMenu');
      if(mm.style.display === 'block') mm.style.display = 'none'; else mm.style.display = 'block';
    });
  }
});

// helper - post JSON to Apps Script
async function postAPI(action, data){
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action: action, data: data })
    });
    const json = await res.json();
    return json;
  } catch(err){
    console.error('API error', err);
    return { status:'error', message: String(err) };
  }
}

// Registration form submit handler (on register.html)
async function submitRegistration(formId, statusId){
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  const name = form.querySelector('#r_name').value.trim();
  const email = form.querySelector('#r_email').value.trim();
  const phone = form.querySelector('#r_phone').value.trim();
  if(!name || !email) { status.innerText = 'Please enter name and email.'; return; }
  status.innerText = 'Submitting...';
  const payload = { name:name, email:email, phone:phone, whatsapp: form.querySelector('#r_whatsapp').checked ? 'Yes' : 'No', notes: form.querySelector('#r_notes').value.trim() };
  const resp = await postAPI('register', payload);
  if(resp && resp.status === 'ok'){
    status.innerText = 'Registration saved. Click to join WhatsApp group.';
    // show join button
    const joinBtn = document.getElementById('joinWhatsappBtn');
    if(joinBtn) joinBtn.style.display = 'inline-block';
    form.reset();
  } else {
    status.innerText = 'Error: ' + (resp.message || 'Could not register');
  }
}

// Reviews page: fetch recent reviews and render
async function loadReviews(containerId, limit=10){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = 'Loading...';
  const resp = await postAPI('getReviews', {limit: limit});
  if(!resp || resp.status !== 'ok'){ container.innerHTML = '<div class="muted">Unable to load reviews.</div>'; return; }
  const reviews = resp.reviews || [];
  if(reviews.length === 0){ container.innerHTML = '<div class="muted">No reviews yet.</div>'; return; }
  container.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '10px';
    card.innerHTML = `<strong>${escapeHtml(r.name)}</strong> <div class="small muted">${new Date(r.timestamp).toLocaleString()}</div><p>${escapeHtml(r.review)}</p>`;
    container.appendChild(card);
  });
}

// review form submit on reviews.html
async function submitReviewForm(){
  const name = document.getElementById('rev_name').value.trim();
  const email = document.getElementById('rev_email').value.trim();
  const phone = document.getElementById('rev_phone').value.trim();
  const review = document.getElementById('rev_text').value.trim();
  const status = document.getElementById('rev_status');
  if(!name || !email || !review){ status.innerText = 'Please fill name, email and review.'; return; }
  status.innerText = 'Submitting...';
  const res = await postAPI('review', { name:name, email:email, phone:phone, review:review });
  if(res && res.status === 'ok'){
    status.innerText = 'Thanks — review submitted!';
    document.getElementById('rev_form').reset();
  } else {
    status.innerText = 'Error: ' + (res.message || 'Could not submit');
  }
}

// 📩 Contact form submission
function contactUs() {
  const name = document.getElementById("c_name").value.trim();
  const email = document.getElementById("c_email").value.trim();
  const msg = document.getElementById("c_msg").value.trim();
  const status = document.getElementById("c_status");

  if (!name || !email || !msg) {
    status.innerText = "⚠️ Please fill all fields.";
    return;
  }

  status.innerText = "⏳ Sending...";

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      type: "contact",
      data: { name, email, msg }
    }),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.text())
    .then(() => {
      status.innerText = "✅ Message sent successfully!";
      document.getElementById("contactForm").reset();
    })
    .catch(() => {
      status.innerText = "❌ Something went wrong.";
    });
}


// simple helper
function escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
// 🌗 Dark Mode Toggle
const toggleBtn = document.getElementById("darkModeToggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    toggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  });
}
