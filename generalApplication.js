
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wf-form-general-application');
  const saveButtonStep1 = document.getElementById('save1');
  const saveButtonStep2 = document.getElementById('save2');
  const saveButtonStep3 = document.getElementById('save3');
  const saveButtonStep4 = document.getElementById('save4');
  const saveButtonStep5 = document.getElementById('save5');
  const loadButton = document.getElementById('load-progress');
  const nextButtonStep4 = document.getElementById('next4');
  const submitButton = document.querySelector('[data-action="submit"]');
  const actionField = document.querySelector('input[name="form-action"]');
  const savevercelUrl = 'https://webflow-to-cms-new.vercel.app/api/webhook/form-submission';
  const loadvercelUrl = 'https://retrieve-from-webflow-cms.vercel.app/api/webhook/webflow-cms';
  const siteId = '680130d4466c7e5c6009e219';

  // Field mapping for copying values
  const fieldMap = {
    'first-name': 'review-first-name',
    'last-name': 'review-last-name',
    'email': 'review-email',
    'phone': 'review-phone',
    'date-of-birth': 'review-date-of-birth',
    'school': 'review-school',
    'school-year': 'review-year',
    'degree': 'review-degree',
    'major': 'review-major',
    'anticipated-graduation-date': 'review-anticipated-graduation-date',
    'full-time': 'review-full-time',
    'required-credits': 'review-required-credits',
    'remaining-credits': 'review-remaining-credits',
    'gpa': 'review-gpa',
    'address': 'review-address',
    'city': 'review-city',
    'state': 'review-state',
    'zip': 'review-zip',
    'current-address-checkbox': 'review-current-address-checkbox',
    'residency-duration': 'review-residency-duration',
    'funding-opportunities': 'review-funding-opportunities',
    'funding-term': 'review-funding-term',
    'employment-status': 'review-employment-status',
    'other-sources-of-income': 'review-other-sources-of-income',
    'total-monthly-income': 'review-total-monthly-income',
    'monthly-housing-payment': 'review-monthly-housing-payment',
    'have-debt': 'review-have-debt',
    'total-debt-amount': 'review-total-debt-amount',
    'funding-need-story': 'review-funding-need-story',
    'career-aspirations-and-goals': 'review-career-aspirations-and-goals',
    'volunteering-activities': 'review-volunteering-activities',
    'story-url': 'review-story-url',
    'story-video': 'review-story-video',
    'campaign-plan': 'review-campaign-plan',
    'donation-support-amount': 'review-donation-support-amount',
    'ethnicity': 'review-ethnicity',
    'residency-status': 'review-residency-status',
    'gender': 'review-gender',
    'disability-status': 'review-disability-status',
    'military-status': 'review-military-status',
    'first-gen-student': 'review-first-gen-student',
    'additional-comments': 'review-additional-comments'
  };

  // Function to dispatch input and change events for Formly validation
  const triggerInputEvents = (element) => {
    if (!element) return;
    ['input', 'change'].forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });
  };

  // Function to update field value or text content
  const updateField = (field, value) => {
    if (!field) {
      console.warn('[UpdateField] Field is null');
      return;
    }
    console.log(`[UpdateField] Updating ${field.id} (tag: ${field.tagName}, type: ${field.type || 'N/A'}, display: ${window.getComputedStyle(field).display}) with value: ${value}`);
    if (field.tagName === 'INPUT' && (field.type === 'checkbox' || field.type === 'radio')) {
      field.checked = value === 'on' || value === true || value === 'Yes';
      triggerInputEvents(field);
    } else if (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
      field.value = value || '';
      triggerInputEvents(field);
    } else {
      field.textContent = value || '';
      if (window.getComputedStyle(field).display === 'none') {
        console.warn(`[UpdateField] Field ${field.id} is hidden (display: none)`);
        field.style.display = 'block';
      }
    }
  };

  // Function to copy values from source to review fields
  const copyFieldValues = () => {
    console.log('[Copy] Starting copy of values...');
    Object.entries(fieldMap).forEach(([sourceId, reviewId]) => {
      const sourceField = document.getElementById(sourceId);
      const reviewField = document.getElementById(reviewId);
      if (!sourceField || !reviewField) {
        console.warn(`[Copy] Field not found: source=${sourceId}, review=${reviewId}`);
        return;
      }
      let value = sourceField.value || '';
      if (sourceId === 'story-url' && sourceField.type === 'file' && sourceField.files.length > 0) {
        value = sourceField.files[0].name;
        console.log(`[Copy] File uploaded, using name: ${value}`);
      }
      console.log(`[Copy] Copying ${sourceId} (value: ${value}) to ${reviewId} (tag: ${reviewField.tagName}, type: ${reviewField.type || 'N/A'}, display: ${window.getComputedStyle(reviewField).display})`);
      updateField(reviewField, value);
    });
    const reviewStep = document.querySelector('.review-step') || document.getElementById('step-5');
    if (reviewStep && window.getComputedStyle(reviewStep).display === 'none') {
      console.log('[Copy] Making review step visible');
      reviewStep.style.display = 'block';
    }
    console.log('[Copy] Copy operation completed.');
  };

  // Function to set field value and trigger validation
  const setFieldValue = (id, value) => {
    const field = document.getElementById(id);
    if (!field) {
      console.warn(`[Load] Field ${id} not found`);
      return;
    }
    // Skip setting value for file inputs and story-video due to security or object type issues
    if (field.type === 'file' || id === 'story-video') {
      console.warn(`[Load] Skipping value set for ${id}`);
      return;
    }
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.checked = value === 'on' || value === true || value === 'Yes';
    } else if (field.type === 'date' && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        field.value = date.toISOString().split('T')[0];
      }
    } else {
      field.value = value || '';
    }
    triggerInputEvents(field);
    const reviewId = fieldMap[id];
    if (reviewId) {
      const reviewField = document.getElementById(reviewId);
      if (reviewField) {
        console.log(`[Load] Copying ${id} (${field.value}) to ${reviewId}`);
        updateField(reviewField, field.value);
      }
    }
  };

  // Function to collect form data
  const collectFormData = (action = 'save', status = 'Draft') => {
    const storyFileInput = document.getElementById('story-url');
    console.log('[Debug] storyFileInput:', storyFileInput, 'Type:', storyFileInput?.tagName);
    const storyFileName = storyFileInput?.files?.length > 0 ? storyFileInput.files[0].name : '';
    const formData = {
      'first-name': document.getElementById('first-name')?.value || '',
      'last-name': document.getElementById('last-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',
      'user-name': document.getElementById('user-name')?.value || '',
      'date-of-birth': document.getElementById('date-of-birth')?.value || '',
      school: document.getElementById('school')?.value || '',
      'school-year': document.getElementById('school-year')?.value || '',
      degree: document.getElementById('degree')?.value || '',
      major: document.getElementById('major')?.value || '',
      'anticipated-graduation-date': document.getElementById('anticipated-graduation-date')?.value || '',
      'full-time': document.getElementById('full-time')?.value || '',
      'required-credits': document.getElementById('required-credits')?.value || '',
      'remaining-credits': document.getElementById('remaining-credits')?.value || '',
      gpa: document.getElementById('gpa')?.value || '',
      address: document.getElementById('address')?.value || '',
      city: document.getElementById('city')?.value || '',
      state: document.getElementById('state')?.value || '',
      zip: document.getElementById('zip')?.value || '',
      'current-address-checkbox': document.getElementById('current-address-checkbox')?.value || '',
      'residency-duration': document.getElementById('residency-duration')?.value || '',
      'application-status': status,
      'funding-opportunities': document.getElementById('funding-opportunities')?.value || '',
      'funding-term': document.getElementById('funding-term')?.value || '',
      'employment-status': document.getElementById('employment-status')?.value || '',
      'other-sources-of-income': document.getElementById('other-sources-of-income')?.value || '',
      'total-monthly-income': document.getElementById('total-monthly-income')?.value || '',
      'monthly-housing-payment': document.getElementById('monthly-housing-payment')?.value || '',
      'have-debt': document.getElementById('have-debt')?.value || '',
      'total-debt-amount': document.getElementById('total-debt-amount')?.value || '',
      'funding-need-story': document.getElementById('funding-need-story')?.value || '',
      'career-aspirations-and-goals': document.getElementById('career-aspirations-and-goals')?.value || '',
      'volunteering-activities': document.getElementById('volunteering-activities')?.value || '',
      'story-url': storyFileName,
      'story-video': document.getElementById('story-video')?.value || '',
      'campaign-plan': document.getElementById('campaign-plan')?.value || '',
      'donation-support-amount': document.getElementById('donation-support-amount')?.value || '',
      ethnicity: document.getElementById('ethnicity')?.value || '',
      'residency-status': document.getElementById('residency-status')?.value || '',
      gender: document.getElementById('gender')?.value || '',
      'disability-status': document.getElementById('disability-status')?.value || '',
      'military-status': document.getElementById('military-status')?.value || '',
      'first-gen-student': document.getElementById('first-gen-student')?.value || '',
      'additional-comments': document.getElementById('additional-comments')?.value || '',
      'affirmation-check': document.getElementById('affirmation-check')?.value || '',
      'disclosure-signed-name': document.getElementById('disclosure-signed-name')?.value || '',
      'disclosure-signed-date': document.getElementById('disclosure-signed-date')?.value || '',
      'terms-acceptance-check': document.getElementById('terms-acceptance-check')?.value || '',
      'form-signed-name': document.getElementById('form-signed-name')?.value || '',
      'form-signed-date': document.getElementById('form-signed-date')?.value || '',
      'form-action': actionField?.value || action
    };
    return formData;
  };

  // Function to collect form data and send payload
  const saveFormData = async (step) => {
    if (actionField) {
      actionField.value = 'save';
      console.log('[Save] Setting form-action to "save"');
    }

    const payload = {
      triggerType: 'form_submission',
      payload: {
        name: form.getAttribute('name') || 'wf-form-general-application',
        siteId: siteId,
        data: collectFormData('save', 'Draft'),
        submittedAt: new Date().toISOString(),
        id: `partial-${step}-${Date.now()}`,
        formId: '682602bb5760376d719623dc',
      },
    };

    try {
      console.log(`[Save] Sending request to ${savevercelUrl} with payload:`, JSON.stringify(payload, null, 2));
      const response = await fetch(savevercelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`Progress saved for ${step}!`);
      } else {
        const error = await response.json();
        console.error(`[Save] Error (status: ${response.status}):`, error);
        alert(`Failed to save progress: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`[Save] Fetch error for ${step}:`, error);
      alert('Error saving progress');
    }
  };

  // Function to handle form submission
  const submitFormData = async () => {
    if (actionField) {
      actionField.value = 'submit';
      console.log('[Submit] Setting form-action to "submit"');
    }

    const payload = {
      triggerType: 'form_submission',
      payload: {
        name: form.getAttribute('name') || 'wf-form-general-application',
        siteId: siteId,
        data: collectFormData('submit', 'Submitted'),
        submittedAt: new Date().toISOString(),
        id: `submit-${Date.now()}`,
        formId: '682602bb5760376d719623dc',
      },
    };

    try {
      console.log(`[Submit] Sending request to ${savevercelUrl} with payload:`, JSON.stringify(payload, null, 2));
      const response = await fetch(savevercelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Form submitted successfully!');
      } else {
        const error = await response.json();
        console.error(`[Submit] Error (status: ${response.status}):`, error);
        alert(`Failed to submit form: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Submit] Fetch error:', error);
      alert('Error submitting form');
    }
  };

  // Function to load partial data
  const loadFormData = async () => {
    let userId;
    if (typeof MemberStack !== 'undefined') {
      const member = await MemberStack.getCurrentMember();
      userId = member?.data?.email || member?.data?.customFields?.userId;
    } else {
      userId = document.getElementById('user-name')?.value || document.getElementById('email')?.value;
    }

    if (!userId) {
      alert('Please log in or enter a user ID/email to load progress');
      return;
    }

    const url = `${loadvercelUrl}?user-name=${encodeURIComponent(userId)}&application-status=draft`;
    console.log(`[Load] Fetching data for userId: ${userId}, URL: ${url}, Method: GET`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`[Load] Response status: ${response.status}`);

      if (response.ok) {
        const { data } = await response.json();
        console.log('[Load] API response:', JSON.stringify(data, null, 2));

        if (data && data.length > 0) {
          const fieldData = data[0].fieldData;
          Object.keys(fieldData).forEach(key => setFieldValue(key, fieldData[key]));
          alert('Progress loaded successfully!');
        } else {
          alert('No Application is in Draft Stage');
        }
      } else {
        const error = await response.text();
        console.error(`[Load] Error (status: ${response.status}):`, error);
        alert(`Failed to load data: ${error || 'Server error'}`);
      }
    } catch (error) {
      console.error('[Load] Fetch error:', error);
      alert('Error loading data');
    }
  };

  // Attach event listeners to save buttons
  [saveButtonStep1, saveButtonStep2, saveButtonStep3, saveButtonStep4, saveButtonStep5].forEach((btn, index) => {
    if (btn && form) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`[Save] Step ${index + 1} button clicked`);
        saveFormData(`step${index + 1}`);
      });
      console.log(`[Init] Save button (step ${index + 1}) listener added`);
    } else {
      console.warn(`[Init] Save button (step ${index + 1}) or form not found`);
    }
  });

  // Attach event listener to submit button
  if (submitButton && form && actionField) {
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Submit] Submit button clicked');
      submitFormData();
    });
    console.log('[Init] Submit button listener added');
  } else {
    console.warn('[Init] Submit button, form, or form-action field not found');
  }

  // Attach event listener to next button on step4
  if (nextButtonStep4 && form) {
    nextButtonStep4.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Next] Step 4 next button clicked');
      copyFieldValues();
    });
    console.log('[Init] Next button (step 4) listener added');
  } else {
    console.warn('[Init] Next button (step 4) or form not found');
  }

  // Attach event listener to load button
  if (loadButton && form) {
    loadButton.replaceWith(loadButton.cloneNode(true));
    const newLoadButton = document.getElementById('load-progress');
    newLoadButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Load] Button clicked');
      loadFormData();
    });
    console.log('[Init] Load button listener added');
  } else {
    console.warn('[Init] Load button or form not found');
  }

  if (form) {
    console.log('[Init] Form initialized');
  } else {
    console.warn('[Init] Form not found');
  }
});



// University drop down list
(function() {
  const input = document.getElementById('school');
  const list = document.getElementById('universityList');
  const url = 'https://gist.githubusercontent.com/hakimelek/147f364c449104ba66da9a3baca9d0c0/raw/7e914fc578d3176f1f752f571f5b3761ea2b22fa/us_institutions.json';

  let universities = [];

  // Fetch university data
  fetch(url)
    .then(res => res.json())
    .then(data => {
      universities = data
        .filter(u => u.institution)
        .map(u => u.institution)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a.localeCompare(b));
    })
    .catch(err => console.error('Error fetching universities:', err));

  // Filter and display matches
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    list.innerHTML = '';

    if (!query) {
      list.style.display = 'none';
      return;
    }

    const filtered = universities.filter(name => name.toLowerCase().includes(query)).slice(0, 30);

    if (filtered.length === 0) {
      list.style.display = 'none';
      return;
    }

    filtered.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.style.padding = '8px';
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        input.value = name;
        list.style.display = 'none';
      });
      li.addEventListener('mouseover', () => li.style.background = '#f0f0f0');
      li.addEventListener('mouseout', () => li.style.background = 'white');
      list.appendChild(li);
    });

    list.style.display = 'block';
  });

  // Hide list when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#school') && !e.target.closest('#universityList')) {
      list.style.display = 'none';
    }
  });
})();

// Credits Required
document.addEventListener('DOMContentLoaded', function () {
  const widget = document.querySelector('.credit-widget');
  const input = document.getElementById('required-credits');
  const errorEl = document.getElementById('creditsError');
 
  function showError(msg) {
    errorEl.style.display = 'block';
    errorEl.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  // Prevent non-digit input
  input.addEventListener('keypress', function (e) {
    const char = String.fromCharCode(e.which || e.keyCode);
    if (!/[0-9]/.test(char)) {
      e.preventDefault();
    }
  });

  // Sanitize on input
  input.addEventListener('input', function () {
    let digits = input.value.replace(/\D+/g, '');
    if (digits.length > 1) digits = digits.replace(/^0+/, '');
    input.value = digits;
    validateField();
  });

  // Basic validation: required + numeric only
  function validateField() {
    clearError();
    const val = input.value.trim();
    if (val === '') {
      showError('Please enter number of credits.');
      return false;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      showError('Only numbers are allowed.');
      return false;
    }
    if (num < 0) {
      showError('Number of credits cannot be negative.');
      return false;
    }
    if (!Number.isInteger(num)) {
      showError('Please enter a whole number (no decimals).');
      return false;
    }
    clearError();
    return true;
  }

  // Hook validation into form submission
  const form = input.closest('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!validateField()) {
        e.preventDefault();
        input.focus();
      } else {
        clearError();
      }
    });
  }

  // Validate initial state if filled
  if (input.value.trim() !== '') {
    validateField();
  }
});

// Remaining Credits 
document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('remainingCreditsInput');
  const errorEl = document.getElementById('remainingError');

  function showError(msg) {
    errorEl.style.display = 'block';
    errorEl.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  // Only allow digit characters
  input.addEventListener('keypress', function (e) {
    const char = String.fromCharCode(e.which || e.keyCode);
    if (!/[0-9]/.test(char)) e.preventDefault();
  });

  // Sanitize input on change
  input.addEventListener('input', function () {
    let digits = input.value.replace(/\D+/g, '');
    if (digits.length > 1) digits = digits.replace(/^0+/, '');
    input.value = digits;
    validateField();
  });

  function validateField() {
    clearError();
    const val = input.value.trim();
    if (val === '') {
      showError('Please enter number of remaining credits.');
      return false;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      showError('Only numbers are allowed.');
      return false;
    }
    if (num < 0) {
      showError('Number of credits cannot be negative.');
      return false;
    }
    if (!Number.isInteger(num)) {
      showError('Please enter a whole number (no decimals).');
      return false;
    }
    clearError();
    return true;
  }

  // Validate on form submission
  const form = input.closest('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!validateField()) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // Initial validation if prefilled
  if (input.value.trim() !== '') validateField();
});
// GPA 
document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('gpa');
  const errorEl = document.getElementById('gpaError');
  const minGPA = 0.0;
  const maxGPA = 4.0;

  function showError(msg) {
    errorEl.style.display = 'block';
    errorEl.textContent = msg;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  // Allow only numbers and one decimal point
  input.addEventListener('keypress', function (e) {
    const char = String.fromCharCode(e.which || e.keyCode);
    if (!/[0-9.]/.test(char)) {
      e.preventDefault();
    }
    // Prevent more than one decimal point
    if (char === '.' && input.value.includes('.')) {
      e.preventDefault();
    }
  });

  input.addEventListener('input', function () {
    // Remove invalid characters
    input.value = input.value.replace(/[^0-9.]/g, '');
    validateField();
  });

  function validateField() {
    clearError();
    const val = input.value.trim();
    if (val === '') {
      showError('Please enter your GPA.');
      return false;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      showError('Invalid number format.');
      return false;
    }
    if (num < minGPA || num > maxGPA) {
      showError(`GPA must be between ${minGPA} and ${maxGPA}.`);
      return false;
    }
    clearError();
    return true;
  }

  // Validate on form submission
  const form = input.closest('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!validateField()) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // Initial validation if prefilled
  if (input.value.trim() !== '') validateField();
});


    document.getElementById("zipForm").addEventListener("submit", function(e) {
      e.preventDefault();
      const zipInput = document.getElementById("zip");
      const errorDiv = document.getElementById("zipError");
      const zip = zipInput.value.trim();

      // ✅ Match 5-digit or ZIP+4 (12345 or 12345-6789)
      const zipPattern = /^\d{5}(-\d{4})?$/;

      if (!zipPattern.test(zip)) {
        errorDiv.style.display = "block";
        zipInput.focus();
        return;
      }

      errorDiv.style.display = "none";
      alert("Valid ZIP code: " + zip);
      // You can now submit to your server or next step
    });
