// Lightweight HTML partial loader: swaps any element with data-include="/path/file.html" with the file's markup.
(async()=>{
  const slots=[...document.querySelectorAll('[data-include]')];
  await Promise.all(slots.map(async slot=>{
    const url=slot.getAttribute('data-include');
    try{
      const res=await fetch(url,{cache:'no-store'});
      const html=await res.text();
      const wrap=document.createElement('div');
      wrap.innerHTML=html.trim();
      // Replace slot with loaded nodes
      const parent=slot.parentNode; const nodes=[...wrap.childNodes];
      nodes.forEach(n=>parent.insertBefore(n,slot));
      parent.removeChild(slot);
    }catch(err){
      console.error('Include failed:',url,err);
    }
  }));
})();
