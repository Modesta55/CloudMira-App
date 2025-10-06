/* assets/js/main.js - CloudMira front-end logic
   API_URL set to your deployed Apps Script exec URL (you already deployed).
*/

const API_URL = "https://script.google.com/macros/s/AKfycbyuW9xSq-EHjrJFWi8rjYgPLyXqM-Zkm6O4FnzjEoZtnysGswCN0qfP6VR-KbhtQTWB/exec";
const WHATSAPP_INVITE = "https://chat.whatsapp.com/GMJ6GRVzIR7JaIszZWMND3?mode=ems_copy_t";

// DOM ready
document.addEventListener('DOMContentLoaded', ()=> {
  // mobile menu toggle
  const toggle = document.getElementById('hamburgerBtn');
  const mobile = document.getElementById('mobileMenu');
  if(toggle && mobile){
    toggle.addEventListener('click', ()=> {
      mobile.style.display = (mobile.style.display === 'block') ? 'none' : 'block';
    });
  }

  // set WhatsApp anchors
  const waAnchor = document.getElementById('whatsappLink');
  if(waAnchor) waAnchor.href = WHATSAPP_INVITE;
  const successJoin = document.getElementById('successJoin');
  if(successJoin) successJoin.href = WHATSAPP_INVITE;
  const joinBtn = document.getElementById('joinWhatsappBtn');
  if(joinBtn) { joinBtn.href = WHATSAPP_INVITE; joinBtn.style.display = 'none'; }

  // dark mode persisted
  const toggleBtn = document.getElementById('darkModeToggle');
  if(toggleBtn){
    if(localStorage.getItem('cm_dark') === '1'){
      document.body.classList.add('dark-mode');
      toggleBtn.textContent = '☀️';
    } else {
      toggleBtn.textContent = '🌙';
    }
    toggleBtn.addEventListener('click', ()=> {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('cm_dark', isDark ? '1' : '0');
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // wire contact form (global contact form id = contactForm)
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (contactForm.querySelector('[name="name"]')||{}).value || '';
      const email = (contactForm.querySelector('[name="email"]')||{}).value || '';
      const msg = (contactForm.querySelector('[name="message"]')||{}).value || '';
      const statusEl = document.getElementById('c_status');
      if(!name || !email || !msg){ if(statusEl) statusEl.innerText='⚠️ Please fill all fields.'; return; }
      if(statusEl) statusEl.innerText='⏳ Sending...';
      const resp = await postAPI('contact', { name, email, msg });
      if(resp && (resp.status==='ok' || resp.status==='success')) {
        if(statusEl) statusEl.innerText='✅ Message sent!'; contactForm.reset();
      } else {
        if(statusEl) statusEl.innerText='❌ '+(resp?.message||'Failed to send');
      }
    });
  }
});

// helper: POST JSON to API
async function postAPI(action, data){
  if(!API_URL || API_URL.indexOf('script.google.com') === -1){
    console.warn('API_URL not set correctly in main.js');
    return { status:'error', message:'API not configured' };
  }
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

// Registration
async function submitRegistration(formId='registerForm', statusId='reg_status'){
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if(!form || !status) return;
  const name = (document.getElementById('r_name')||{}).value.trim();
  const email = (document.getElementById('r_email')||{}).value.trim();
  const phone = (document.getElementById('r_phone')||{}).value.trim();
  const notes = (document.getElementById('r_notes')||{}).value.trim();
  const joinWhatsApp = (document.getElementById('r_whatsapp')||{}).checked || false;

  if(!name || !email || !phone){
    status.innerText = '⚠️ Please fill all required fields.';
    return;
  }
  status.innerText = '⏳ Submitting...';
  const payload = { name, email, phone, whatsapp: joinWhatsApp ? 'Yes' : 'No', notes };
  const resp = await postAPI('register', payload);
  if(resp && (resp.status === 'ok' || resp.status === 'success')){
    status.innerText = '✅ Registration saved. You may join the WhatsApp group.';
    const joinBtn = document.getElementById('joinWhatsappBtn');
    if(joinBtn) joinBtn.style.display = 'inline-block';
    form.reset();
    setTimeout(()=> window.location.href = 'success.html', 900);
  } else {
    status.innerText = '❌ ' + (resp.message || 'Could not register');
  }
}

// Reviews: load and submit
async function loadReviews(containerId='reviewsList', limit=10){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '<div class="muted small">Loading reviews...</div>';
  const resp = await postAPI('getReviews', { limit });
  if(!resp || (resp.status !== 'ok' && resp.status !== 'success')){ container.innerHTML = '<div class="muted">Unable to load reviews.</div>'; return; }
  const reviews = resp.reviews || resp.data || [];
  if(reviews.length === 0){ container.innerHTML = '<div class="muted">No reviews yet.</div>'; return; }
  container.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '12px';
    const name = escapeHtml(r.name || 'Anonymous');
    const text = escapeHtml(r.review || r.text || '');
    const ts = r.timestamp || r.date || '';
    const pretty = ts ? (new Date(ts)).toLocaleString() : '';
    card.innerHTML = `<strong>${name}</strong><div class="small muted">${pretty}</div><p>${text}</p>`;
    container.appendChild(card);
  });
}

async function submitReviewForm(){
  const name = (document.getElementById('rev_name')||{}).value.trim();
  const email = (document.getElementById('rev_email')||{}).value.trim();
  const phone = (document.getElementById('rev_phone')||{}).value.trim();
  const review = (document.getElementById('rev_text')||{}).value.trim();
  const status = document.getElementById('rev_status');
  if(!name || !email || !review){ if(status) status.innerText = 'Please fill name, email and review.'; return; }
  if(status) status.innerText = 'Submitting...';
  const resp = await postAPI('review', { name, email, phone, review });
  if(resp && (resp.status === 'ok' || resp.status === 'success')){
    if(status) status.innerText = 'Thanks — review submitted!';
    const form = document.getElementById('rev_form');
    if(form) form.reset();
    setTimeout(()=> loadReviews('reviewsList', 12), 400);
  } else {
    if(status) status.innerText = '❌ ' + (resp.message || 'Could not submit review');
  }
}

// escape helper
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
