// ========== reCAPTCHA HANDLING ========== //
window.recaptchaOnload = function() {
  // Function to render reCAPTCHA
  const renderCaptcha = () => {
    const recaptchaElement = document.querySelector('.g-recaptcha');
    if (recaptchaElement && window.grecaptcha) {
      grecaptcha.render(recaptchaElement, {
        sitekey: '6LclaJ4rAAAAAEMe8ppXrEJvIgLeFVxgmkq4DBrI',
        theme: 'light'
      });
    }
  };


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
