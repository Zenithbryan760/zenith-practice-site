// Immediately invoked function to scope variables
;(function() {
  const root = document.getElementById('lead-form-root');
  if (!root) return;

  // 1) Build HTML
  root.innerHTML = `
    <form class="lead-form" name="estimate" data-netlify="true" novalidate>
      <div class="lead-form__header">
        <img src="images/zenith-logo.png" alt="Zenith Roofing Services Logo" />
        <h2 class="lead-form__heading">Request Your Free Estimate</h2>
      </div>
      <div class="lead-form__body">
        <div class="lead-form__row">
          ${makeInput('name', 'Full Name', 'text', true)}
          ${makeInput('phone', 'Phone Number', 'tel', true, '(###) ###-####')}
        </div>
        <div class="lead-form__row">
          ${makeInput('email', 'Email Address', 'email', true)}
          ${makeSelect('service', 'Service Type', [
            'Shingles','Tile','Flat Roofing','Gutters','Repairs','Other'
          ], true)}
        </div>
        <div class="lead-form__row">
          ${makeInput('address', 'Project Address', 'text', true)}
          ${makeInput('date', 'Preferred Date', 'date', false)}
        </div>
        ${makeTextarea('details','Brief Project Details',false)}
        ${makeInput('photos','Upload Photos','file',false,'','multiple')}
        ${makeSelect('referral','How did you hear about us?',[
          'Google','Referral','Social Media','Other'
        ],false)}
        ${makeCheckbox('reminder','Schedule free inspection reminder?')}
        <button type="submit" class="lead-form__submit">Submit</button>
        <p class="lead-form__disclaimer">
          *Free estimates are not available for real estate transactions. If you’re a real estate professional, buyer, or seller seeking a roof report, visual inspection, or verbal estimate for a transaction, please see our <a href="/real-estate">Real Estate Services</a>.
        </p>
      </div>
    </form>`;

  // 2) Helper functions for building fields
  function makeInput(id, label, type, required, placeholder='', extra='') {
    return `
      <div class="input-group ${type==='file'?'full-width':''}">
        <input id="${id}" name="${id}" type="${type}"
          placeholder=" " ${required?'required':''} ${extra} />
        <label for="${id}">${label}</label>
      </div>`;
  }
  function makeTextarea(id, label, required) {
    return `
      <div class="input-group full-width">
        <textarea id="${id}" name="${id}" rows="4" placeholder=" " ${required?'required':''}></textarea>
        <label for="${id}">${label}</label>
      </div>`;
  }
  function makeSelect(id, label, options, required) {
    return `
      <div class="input-group">
        <select id="${id}" name="${id}" ${required?'required':''}>
          <option value="" disabled selected hidden></option>
          ${options.map(o=>`<option value="${o}">${o}</option>`).join('')}
        </select>
        <label for="${id}">${label}</label>
      </div>`;
  }
  function makeCheckbox(id, label) {
    return `
      <div class="input-group full-width">
        <label>
          <input type="checkbox" id="${id}" name="${id}" />
          ${label}
        </label>
      </div>`;
  }

  // 3) Simple inline validation example
  const form = root.querySelector('form');
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
    }
  });
})();
