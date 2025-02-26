  // Toggle mobile navigation menu
  function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("active");
  }

  // Back-to-top button functionality
  const backToTopButton = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  });
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Fade-in animation on scroll for elements with class "fade-in"
  function revealOnScroll() {
    const fadeElements = document.querySelectorAll(".fade-in");
    const windowBottom = window.innerHeight + window.scrollY;
    fadeElements.forEach((el) => {
      if (el.offsetTop < windowBottom - 100) {
        el.classList.add("visible");
      }
    });
  }
  window.addEventListener("scroll", revealOnScroll);
  window.addEventListener("load", revealOnScroll);

  // Search filter for featured books
  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const bookCards = document.querySelectorAll(".book-card");
    bookCards.forEach((card) => {
      const title = card.querySelector("h4").textContent.toLowerCase();
      card.style.display = title.includes(query) ? "" : "none";
    });
  });