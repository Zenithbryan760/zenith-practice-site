document.addEventListener("DOMContentLoaded", () => {
  // Simple fade-in animation for steps
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, index) => {
    step.style.opacity = 0;
    step.style.transform = "translateY(20px)";
    setTimeout(() => {
      step.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      step.style.opacity = 1;
      step.style.transform = "translateY(0)";
    }, 200 * index);
  });
});
