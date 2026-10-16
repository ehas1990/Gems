/**
 * ==========================================================================
 * GEMS Network - Partner Registration Controller (partner-register.js)
 * ==========================================================================
 * Implements validation, email check, logo validation, and form submission.
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Dynamic Copyright Year
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. DOM Elements
  const form = document.getElementById("partnerRegisterForm");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const emailStatus = document.getElementById("email_status");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const togglePasswordIcon = document.getElementById("togglePasswordIcon");
  const logoInput = document.getElementById("logo");
  const logoError = document.getElementById("logo_error");
  const descInput = document.getElementById("description");
  const descWordCounter = document.getElementById("descWordCounter");
  const submitBtn = document.getElementById("submitBtn");
  const formAlertBox = document.getElementById("formAlertBox");
  const successModal = document.getElementById("successModal");
  const successOkBtn = document.getElementById("successOkBtn");

  let emailCheckTimer = null;
  let isEmailValidAndAvailable = false;

  // ==========================================================================
  // 3. USERNAME SYNCHRONIZATION WITH EMAIL
  // ==========================================================================
  if (emailInput && usernameInput) {
    function syncUsername() {
      const emailVal = emailInput.value.trim();
      usernameInput.value = emailVal;
    }

    emailInput.addEventListener("input", function () {
      syncUsername();
      handleEmailValidation();
    });

    emailInput.addEventListener("change", function () {
      syncUsername();
      handleEmailValidation();
    });

    emailInput.addEventListener("blur", function () {
      syncUsername();
      handleEmailValidation();
    });
  }

  // Helper: Basic Email Format Regex
  function isValidEmailFormat(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ==========================================================================
  // 4. LIVE EMAIL EXISTENCE CHECK (INTEGRATION WITH BACKEND API)
  // ==========================================================================
  function handleEmailValidation() {
    clearTimeout(emailCheckTimer);
    const emailVal = emailInput.value.trim();

    if (!emailVal) {
      if (emailStatus) {
        emailStatus.textContent = "";
        emailStatus.style.color = "";
      }
      emailInput.classList.remove("is-invalid", "is-valid");
      isEmailValidAndAvailable = false;
      return;
    }

    if (!isValidEmailFormat(emailVal)) {
      if (emailStatus) {
        emailStatus.textContent = "Please enter a valid email format";
        emailStatus.style.color = "#dc2626";
      }
      emailInput.classList.add("is-invalid");
      emailInput.classList.remove("is-valid");
      isEmailValidAndAvailable = false;
      return;
    }

    // Debounce the backend network check
    emailCheckTimer = setTimeout(function () {
      checkEmailAvailability(emailVal);
    }, 400);
  }

  async function checkEmailAvailability(email) {
    if (emailStatus) {
      emailStatus.textContent = "Checking availability...";
      emailStatus.style.color = "#64748b";
    }

    try {
      const checkEndpoint = "https://globalenrollment.us/partner-register/check-email";
      const bodyData = new URLSearchParams();
      bodyData.append("email", email);

      const response = await fetch(checkEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyData.toString(),
      });

      if (!response.ok) {
        throw new Error("Server responded with status " + response.status);
      }

      const result = (await response.text()).trim();

      if (result === "exists") {
        if (emailStatus) {
          emailStatus.textContent = "Email already registered";
          emailStatus.style.color = "#dc2626";
        }
        emailInput.classList.add("is-invalid");
        emailInput.classList.remove("is-valid");
        if (submitBtn) submitBtn.disabled = true;
        isEmailValidAndAvailable = false;
      } else {
        if (emailStatus) {
          emailStatus.textContent = "Email available";
          emailStatus.style.color = "#16a34a";
        }
        emailInput.classList.remove("is-invalid");
        emailInput.classList.add("is-valid");
        if (submitBtn) submitBtn.disabled = false;
        isEmailValidAndAvailable = true;
      }
    } catch (err) {
      // Offline / CORS fallback: validate format locally without blocking the user
      console.warn("Email existence check fallback:", err.message);
      if (isValidEmailFormat(email)) {
        if (emailStatus) {
          emailStatus.textContent = "Email format valid";
          emailStatus.style.color = "#16a34a";
        }
        emailInput.classList.remove("is-invalid");
        emailInput.classList.add("is-valid");
        if (submitBtn) submitBtn.disabled = false;
        isEmailValidAndAvailable = true;
      }
    }
  }

  // ==========================================================================
  // 5. PASSWORD VISIBILITY TOGGLE
  // ==========================================================================
  if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
    togglePasswordBtn.addEventListener("click", function () {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordIcon.classList.remove("fa-eye");
        togglePasswordIcon.classList.add("fa-eye-slash");
        togglePasswordBtn.setAttribute("aria-label", "Hide password");
      } else {
        passwordInput.type = "password";
        togglePasswordIcon.classList.remove("fa-eye-slash");
        togglePasswordIcon.classList.add("fa-eye");
        togglePasswordBtn.setAttribute("aria-label", "Show password");
      }
    });
  }

  // ==========================================================================
  // 6. COMPANY LOGO VALIDATION (MAX 5MB, IMAGE FORMATS ONLY)
  // ==========================================================================
  if (logoInput) {
    logoInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (!file) {
        logoInput.classList.remove("is-invalid", "is-valid");
        return;
      }

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
      ];
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        logoInput.classList.add("is-invalid");
        logoInput.classList.remove("is-valid");
        if (logoError) {
          logoError.textContent = "Invalid file type. Please upload a PNG, JPG, WebP, or SVG.";
          logoError.style.display = "block";
        }
        logoInput.value = "";
        return;
      }

      if (file.size > maxSizeBytes) {
        logoInput.classList.add("is-invalid");
        logoInput.classList.remove("is-valid");
        if (logoError) {
          logoError.textContent = "File exceeds the 5MB size limit. Please upload a smaller image.";
          logoError.style.display = "block";
        }
        logoInput.value = "";
        return;
      }

      logoInput.classList.remove("is-invalid");
      logoInput.classList.add("is-valid");
      if (logoError) {
        logoError.style.display = "none";
      }
    });
  }

  // ==========================================================================
  // 7. DESCRIPTION WORD LIMIT (MAXIMUM 50 WORDS)
  // ==========================================================================
  if (descInput && descWordCounter) {
    function countWords(str) {
      const trimmed = str.trim();
      if (!trimmed) return 0;
      return trimmed.split(/\s+/).filter(Boolean).length;
    }

    descInput.addEventListener("input", function () {
      const words = countWords(this.value);
      descWordCounter.textContent = words + " / 50 words";

      if (words > 50) {
        descWordCounter.classList.add("over-limit");
        descInput.classList.add("is-invalid");
      } else {
        descWordCounter.classList.remove("over-limit");
        descInput.classList.remove("is-invalid");
      }
    });
  }

  // ==========================================================================
  // 7b. NETWORK CATEGORIES (DYNAMIC SORTING & LIVE VALIDATION)
  // ==========================================================================
  const networkCatInput = document.getElementById("network_categories");
  if (networkCatInput) {
    // Ensure all options appear in exact alphabetical order while keeping placeholder on top
    const placeholder = networkCatInput.querySelector('option[value=""]');
    const options = Array.from(networkCatInput.querySelectorAll('option:not([value=""])'));
    if (options.length > 0) {
      options.sort((a, b) => a.text.localeCompare(b.text));
      networkCatInput.innerHTML = "";
      if (placeholder) networkCatInput.appendChild(placeholder);
      options.forEach((opt) => networkCatInput.appendChild(opt));
    }

    networkCatInput.addEventListener("change", function () {
      if (this.value && this.value.trim()) {
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
      } else {
        this.classList.add("is-invalid");
        this.classList.remove("is-valid");
      }
    });
  }

  // ==========================================================================
  // 8. ALERT NOTIFICATION HELPERS
  // ==========================================================================
  function showAlert(msg, type) {
    if (!formAlertBox) return;
    formAlertBox.textContent = msg;
    formAlertBox.className = "form-alert " + (type === "success" ? "alert-success" : "alert-danger");
    formAlertBox.style.display = "block";
    formAlertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (!formAlertBox) return;
    formAlertBox.style.display = "none";
    formAlertBox.textContent = "";
  }

  // ==========================================================================
  // 9. CLIENT-SIDE VALIDATION
  // ==========================================================================
  function validateAllFields() {
    let isValid = true;
    let firstInvalidField = null;

    // Company Name
    const companyName = document.getElementById("company_name");
    if (companyName) {
      if (!companyName.value.trim()) {
        companyName.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = companyName;
      } else {
        companyName.classList.remove("is-invalid");
        companyName.classList.add("is-valid");
      }
    }

    // Contact Person
    const contactPerson = document.getElementById("contact_person");
    if (contactPerson) {
      if (!contactPerson.value.trim()) {
        contactPerson.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = contactPerson;
      } else {
        contactPerson.classList.remove("is-invalid");
        contactPerson.classList.add("is-valid");
      }
    }

    // Email
    if (emailInput) {
      const emailVal = emailInput.value.trim();
      if (!emailVal || !isValidEmailFormat(emailVal)) {
        emailInput.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = emailInput;
      }
    }

    // Network Categories
    if (networkCatInput) {
      if (!networkCatInput.value || !networkCatInput.value.trim()) {
        networkCatInput.classList.add("is-invalid");
        networkCatInput.classList.remove("is-valid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = networkCatInput;
      } else {
        networkCatInput.classList.remove("is-invalid");
        networkCatInput.classList.add("is-valid");
      }
    }

    // Password
    if (passwordInput) {
      if (!passwordInput.value || passwordInput.value.length < 6) {
        passwordInput.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = passwordInput;
      } else {
        passwordInput.classList.remove("is-invalid");
        passwordInput.classList.add("is-valid");
      }
    }

    // Website Link (optional, but if filled, must be valid URL)
    const websiteInput = document.getElementById("website_link");
    if (websiteInput && websiteInput.value.trim()) {
      try {
        new URL(websiteInput.value.trim());
        websiteInput.classList.remove("is-invalid");
        websiteInput.classList.add("is-valid");
      } catch (e) {
        websiteInput.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = websiteInput;
      }
    }

    // Description Word Count
    if (descInput) {
      const words = descInput.value.trim().split(/\s+/).filter(Boolean).length;
      if (words > 50) {
        descInput.classList.add("is-invalid");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = descInput;
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  // ==========================================================================
  // 10. SUCCESS MODAL CONTROLLER
  // ==========================================================================
  function showSuccessModal(message) {
    if (message) {
      const msgEl = document.getElementById("successModalMsg");
      if (msgEl) msgEl.textContent = message;
    }

    if (typeof $ !== "undefined" && typeof $.fn.modal !== "undefined") {
      $("#successModal").modal({
        backdrop: "static",
        keyboard: false,
        show: true,
      });
    } else {
      const modalEl = document.getElementById("successModal");
      if (modalEl) {
        modalEl.classList.add("show");
        modalEl.style.display = "block";
        modalEl.removeAttribute("aria-hidden");
        modalEl.setAttribute("aria-modal", "true");
        document.body.classList.add("modal-open");
      }
    }
  }

  function hideSuccessModal() {
    if (typeof $ !== "undefined" && typeof $.fn.modal !== "undefined") {
      $("#successModal").modal("hide");
    } else {
      const modalEl = document.getElementById("successModal");
      if (modalEl) {
        modalEl.classList.remove("show");
        modalEl.style.display = "none";
        modalEl.setAttribute("aria-hidden", "true");
        modalEl.removeAttribute("aria-modal");
        document.body.classList.remove("modal-open");
      }
    }
  }

  if (successOkBtn) {
    successOkBtn.addEventListener("click", function () {
      hideSuccessModal();
      window.location.href = "index.html";
    });
  }

  // ==========================================================================
  // 11. FORM SUBMISSION INTEGRATION
  // ==========================================================================
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert();

      // Validate inputs
      if (!validateAllFields()) {
        showAlert("Please fill in all required fields accurately before submitting.");
        return;
      }

      // Check if email was flagged as existing
      if (emailInput && emailInput.classList.contains("is-invalid")) {
        showAlert("Please resolve the email address issue before submitting.");
        emailInput.focus();
        return;
      }

      // Set submission loading state to prevent accidental duplicates
      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting Registration...';

      const formData = new FormData(form);
      const selectedCategoryVal = networkCatInput ? networkCatInput.value : "";
      if (selectedCategoryVal) {
        if (!formData.has("network_category")) formData.append("network_category", selectedCategoryVal);
        if (!formData.has("category")) formData.append("category", selectedCategoryVal);
      }
      const actionUrl = form.getAttribute("action") || "https://globalenrollment.us/partner-register/save";

      try {
        const response = await fetch(actionUrl, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          // Success from live registration endpoint
          showSuccessModal("Your partner registration has been submitted successfully. Our team will review your application and get in touch.");
          form.reset();
          if (usernameInput) usernameInput.value = "";
          if (emailStatus) emailStatus.textContent = "";
          if (descWordCounter) descWordCounter.textContent = "0 / 50 words";
          if (networkCatInput) networkCatInput.selectedIndex = 0;
          const allValidated = form.querySelectorAll(".is-valid, .is-invalid");
          allValidated.forEach((el) => el.classList.remove("is-valid", "is-invalid"));
        } else {
          showAlert("Registration request failed (Server code: " + response.status + "). Please verify your details and try again.");
        }
      } catch (networkErr) {
        console.warn("Async registration submission notice:", networkErr);

        // If running in local development (file:// or localhost) where cross-origin POST is blocked by browser CORS:
        // Gracefully submit the form via standard HTTP POST so the backend receives the real request.
        if (
          window.location.protocol === "file:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
        ) {
          showAlert("Submitting registration through standard server connection...");
          setTimeout(function () {
            form.submit();
          }, 800);
          return;
        }

        showAlert("Unable to connect to the registration server. Please check your internet connection and try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});
