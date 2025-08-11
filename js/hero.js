
<!-- ===== Scripts ===== -->
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<script>
/* Phone auto-format: (###) ###-#### */
(function() {
  const phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', () => {
      let v = phone.value.replace(/\D/g, '').slice(0,10);
      if (v.length >= 7) {
        phone.value = '(' + v.slice(0,3) + ') ' + v.slice(3,6) + '-' + v.slice(6);
      } else if (v.length >= 4) {
        phone.value = '(' + v.slice(0,3) + ') ' + v.slice(3);
      } else if (v.length >= 1) {
        phone.value = '(' + v;
      } else {
        phone.value = '';
      }
    });
  }
})();

/* ZIP -> City (US) */
document.getElementById('zip').addEventListener('blur', function() {
  const zip = this.value.trim();
  if (zip.length >= 5) {
    fetch('https://api.zippopotam.us/us/' + zip)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const place = data.places && data.places[0];
        document.getElementById('city').value = place ? place['place name'] : '';
      })
      .catch(() => { document.getElementById('city').value = ''; });
  }
});

/* OPTIONAL: Submit to Zapier webhook (uncomment + set your URL)
document.getElementById('estimate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const url = 'https://hooks.zapier.com/hooks/catch/XXXXXXX/YYYYYYY'; // <-- your Zap URL
  const fd = new FormData(form);
  // Files will send via multipart/form-data; ensure Zap is configured to accept them.
  const resp = await fetch(url, { method: 'POST', body: fd });
  if (resp.ok) {
    alert('Thanks! Your request has been submitted.');
    form.reset();
    if (window.grecaptcha) grecaptcha.reset();
  } else {
    alert('Sorry, something went wrong. Please try again.');
  }
});
*/
</script>
