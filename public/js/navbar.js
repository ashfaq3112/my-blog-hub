document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      if (mobileMenu.classList.contains("max-h-0")) {
        mobileMenu.classList.remove("max-h-0");
        mobileMenu.classList.add("max-h-96"); // expands
      } else {
        mobileMenu.classList.add("max-h-0"); // collapses
        mobileMenu.classList.remove("max-h-96");
      }
    });
  }
});
