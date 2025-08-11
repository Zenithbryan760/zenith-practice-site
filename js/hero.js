<!-- ===== Scripts ===== -->
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<script>
document.getElementById('zip').addEventListener('blur', function() {
  const zip = this.value;
  if (zip.length >= 5) {
    fetch(`https://api.zippopotam.us/us/${zip}`)
      .then(res => res.json())
      .then(data => {
        const place = data.places && data.places[0];
        if (place) {
          document.getElementById('city').value = place['place name'];
        }
      })
      .catch(() => {
        document.getElementById('city').value = '';
      });
  }
});
</script>
