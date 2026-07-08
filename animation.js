/* ============================================================
   ANIMATION (JS-driven helpers)
   ============================================================
   Purpose:   The handful of animations that need JavaScript
              rather than pure CSS — confetti particles for the
              achievement popup, and the scroll-reveal
              IntersectionObserver used by .reveal elements.
              Every keyframe-based animation lives in
              animations.css instead; this file is only for the
              parts that need DOM/JS to drive them.
   Inputs:    spawnConfetti(containerEl); initScrollReveal()
              (called once at boot).
   Outputs:   Appends .confetti-piece nodes; toggles .in on
              .reveal elements as they scroll into view.
   Depends on: nothing.
   ============================================================ */
function spawnConfetti(container){
  if(!container) return;
  const colors=['#6F9D24','#8FD65C','#2F5F67','#F5B942','#D6E34B'];
  for(let i=0;i<24;i++){
    const p=document.createElement('div');
    p.className='confetti-piece';
    p.style.left = (Math.random()*100)+'%';
    p.style.background = colors[i%colors.length];
    p.style.animationDelay = (Math.random()*0.4)+'s';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    container.appendChild(p);
  }
}

function initScrollReveal(){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
  }, {threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
