import Swiper from "swiper";
import { Pagination } from "swiper/modules";

document.addEventListener("DOMContentLoaded", () => {
  initSwipers();
  initQuantitySelectors();
});

function initSwipers() {
  const swipers = document.querySelectorAll(".swiper");

  swipers.forEach((swiperEl) => {
    new Swiper(swiperEl, {
      modules: [Pagination],
      pagination: {
        el: swiperEl.querySelector(".swiper-pagination"),
        clickable: true,
      },
    });
  });
}

function initQuantitySelectors() {
  const selectors = document.querySelectorAll("[data-quantity-selector]");

  selectors.forEach((selector) => {
    const decrementBtn = selector.querySelector("[data-quantity-decrement]");
    const incrementBtn = selector.querySelector("[data-quantity-increment]");
    const valueDisplay = selector.querySelector("[data-quantity-value]");

    let quantity = parseInt(valueDisplay.textContent, 10) || 1;

    decrementBtn.addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        valueDisplay.textContent = quantity;
      }
    });

    incrementBtn.addEventListener("click", () => {
      if (quantity < 1000) {
        quantity++;
        valueDisplay.textContent = quantity;
      }
    });
  });
}
