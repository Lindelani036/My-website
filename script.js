// Lightweight interactivity for the portfolio
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.querySelector('.nav-links');
  const knobs = document.querySelectorAll('.knob');

  // Initialize theme from localStorage or prefers-color-scheme
  const saved = localStorage.getItem('theme');
  if(saved === 'light') document.body.classList.add('light');
  else if(!saved){
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    if(prefersLight) document.body.classList.add('light');
  }

  // theme label element
  const themeLabel = document.getElementById('themeLabel');
  function updateThemeLabel(){
    if(!themeLabel) return;
    const isLight = document.body.classList.contains('light');
    const textEl = themeLabel.querySelector('.theme-text');
    const icon = document.getElementById('themeIcon');
    if(textEl) textEl.style.opacity = '0';
    // slight delay to allow fade-out before changing text
    setTimeout(()=>{
      if(textEl) textEl.textContent = isLight ? 'Light' : 'Dark';
      if(textEl) textEl.style.opacity = '1';
      if(icon){
        icon.classList.toggle('fa-moon', !isLight);
        icon.classList.toggle('fa-sun', isLight);
      }
      // aria-pressed on toggle
      if(themeToggle) themeToggle.setAttribute('aria-pressed', String(isLight));
    }, 140);
  }
  updateThemeLabel();

  // Theme toggle
  themeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeLabel();
  });

  // Mobile menu toggle
  menuBtn.addEventListener('click', ()=>{
    if(navLinks.style.display === 'flex') navLinks.style.display = '';
    else navLinks.style.display = 'flex';
  });

  // Floating labels: add .filled when input has value or focus
  const fields = document.querySelectorAll('.field input, .field textarea');
  fields.forEach(f=>{
    const check = ()=>{
      if(f.value.trim().length) f.classList.add('filled');
      else f.classList.remove('filled');
    };
    f.addEventListener('input', check);
    f.addEventListener('blur', check);
    f.addEventListener('focus', ()=> f.classList.add('filled'));
    check();
  });

  // Contact form: open user's mail client via mailto: with prefilled subject/body
  const form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const message = form.querySelector('#message');
      const submitBtn = form.querySelector('.submit');
      if(!name.value.trim() || !email.value.trim() || !message.value.trim()){
        showToast('Please complete all fields before sending.', {type:'error'});
        return;
      }

      const endpoint = form.getAttribute('data-endpoint') || '';

      // metadata
      const metadata = {
        date: new Date().toISOString(),
        userAgent: navigator.userAgent || 'unknown',
        page: window.location.href
      };

      // disable button UI
      submitBtn.classList.add('busy');
      const prevText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      if(endpoint && !endpoint.includes('yourFormID')){
        // Post JSON to Formspree (or any endpoint that accepts form data)
        try{
          const payload = {
            name: name.value.trim(),
            email: email.value.trim(),
            message: message.value.trim(),
            ...metadata
          };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type':'application/json','Accept':'application/json'},
            body: JSON.stringify(payload)
          });

          if(res.ok){
            showToast('Message sent — thank you!', {type:'success'});
            form.reset(); fields.forEach(f=>f.classList.remove('filled'));
          } else {
            // If server returns non-OK, fallback to mailto
            showToast('Server error, opening email client as fallback.', {type:'warn'});
            openMailClient(name.value.trim(), email.value.trim(), message.value.trim(), metadata);
          }
        }catch(err){
          console.error('Submit error', err);
          showToast('Network error, opening email client as fallback.', {type:'error'});
          openMailClient(name.value.trim(), email.value.trim(), message.value.trim(), metadata);
        }
      } else {
        // No endpoint configured or left with placeholder; use mailto fallback
        openMailClient(name.value.trim(), email.value.trim(), message.value.trim(), metadata);
        showToast('Opening your email client...', {type:'info'});
      }

      // restore button UI
      submitBtn.classList.remove('busy');
      submitBtn.textContent = prevText;
    });
  }

  // Helper: mailto fallback
  function openMailClient(name, email, message, metadata){
    const to = 'Lindelanimakhoba92@gmail.com';
    const subject = encodeURIComponent('Portfolio contact from ' + name);
    const bodyLines = [
      'Full name: ' + name,
      'Email: ' + email,
      'Date: ' + metadata.date,
      'Page: ' + metadata.page,
      'User-Agent: ' + metadata.userAgent,
      '',
      'Message:',
      message
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
    // open via window.location to trigger default mail client
    window.location.href = mailto;
  }

  // Helper: toast UI
  function showToast(message, opts = {}){
    const toast = document.getElementById('toast');
    if(!toast) return alert(message);
    toast.hidden = false;
    toast.textContent = message;
    toast.classList.remove('hide','show');
    toast.classList.add('show');
    // auto-hide
    window.clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(()=>{
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(()=>{ toast.hidden = true; }, 300);
    }, opts.duration || 3500);
  }

  // LIGHTBOX / MODAL for image preview
  (function(){
    const lightbox = document.getElementById('lightbox');
    const lbImage = document.getElementById('lightboxImage');
    const closeBtn = lightbox && lightbox.querySelector('.lightbox-close');

    function openLightbox(src, alt){
      if(!lightbox) return;
      lbImage.src = src;
      lbImage.alt = alt || 'Preview image';
      lightbox.hidden = false;
      lightbox.focus && lightbox.focus();
    }

    function closeLightbox(){
      if(!lightbox) return;
      lightbox.hidden = true;
      lbImage.src = '';
    }

    // attach to view links
    document.querySelectorAll('.view-link').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const src = a.getAttribute('href');
        openLightbox(src, a.getAttribute('aria-label') || a.textContent.trim());
      });
    });

    // close button
    closeBtn && closeBtn.addEventListener('click', closeLightbox);

    // close on outside click
    lightbox && lightbox.addEventListener('click', (e)=>{
      if(e.target === lightbox) closeLightbox();
    });

    // close on ESC
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeLightbox();
    });
  })();
})();
