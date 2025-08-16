// Swiper initialization + gentle scale transitions
window.addEventListener('load',()=>{
  const swiper = new Swiper('.testimonialSwiper',{
    loop:true,
    slidesPerView:3,
    slidesPerGroup:3,
    spaceBetween:24,
    autoplay:{delay:5000,disableOnInteraction:false,pauseOnMouseEnter:true},
    pagination:{el:'.swiper-pagination',clickable:true,dynamicBullets:true},
    navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'},
    breakpoints:{320:{slidesPerView:1,slidesPerGroup:1},768:{slidesPerView:2,slidesPerGroup:2},1024:{slidesPerView:3,slidesPerGroup:3}},
    on:{
      init(){
        this.slides.forEach(s=>{s.style.transition='all .45s ease'});
      },
      slideChangeTransitionStart(){
        this.slides.forEach(s=>{s.style.opacity='.8';s.style.transform='scale(.97)'});
      },
      slideChangeTransitionEnd(){
        const active=[this.slides[this.activeIndex],this.slides[this.activeIndex+1],this.slides[this.activeIndex+2]].filter(Boolean);
        active.forEach(s=>{s.style.opacity='1';s.style.transform='scale(1)'});
      }
    }
  });
});
