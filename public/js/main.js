const passwordBtns = document.querySelectorAll(".password-show-hide-btn");
const closeAlertBtn = document.querySelector(".close-alert");
const formElements = document.querySelectorAll("form");
const submitBtns = document.querySelectorAll("button");

passwordBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    console.dir(this.previousElementSibling);
    if (this.classList.contains("fa-eye-slash")) {
      this.classList.remove("fa-eye-slash");
      this.previousElementSibling.setAttribute("type", "password");
    } else {
      this.classList.add("fa-eye-slash");
      this.previousElementSibling.setAttribute("type", "text");
    }
  });
});

if (closeAlertBtn) {
  closeAlertBtn.addEventListener("click", function () {
    this.parentElement.remove();
  });
}

formElements.forEach(function (form) {
  form.addEventListener("submit", function (e) {
    submitBtns.forEach(function (btn) {
      btn.setAttribute("disabled", "true");
    });
  });
});
