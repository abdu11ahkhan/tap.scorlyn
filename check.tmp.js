const puppeteer=require('puppeteer');
const NAMES=JSON.parse(require('fs').readFileSync('names.json','utf8'));
(async()=>{const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
 const p=await b.newPage(); await p.setViewport({width:1440,height:1000});
 await p.goto('http://localhost:3000/templates',{waitUntil:'domcontentloaded',timeout:60000});
 await new Promise(s=>setTimeout(s,900));
 const h=await p.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<h;y+=700){await p.evaluate(v=>window.scrollTo(0,v),y);await new Promise(s=>setTimeout(s,320));}
 await new Promise(s=>setTimeout(s,8000));
 const rows=await p.evaluate((NAMES)=>{
   const out=[];
   for(const fr of document.querySelectorAll('iframe')){
     const id=(fr.getAttribute('src')||'').split('/preview/card/')[1]?.split('?')[0]||'?';
     // The visible window of the card, in card pixels.
     const style=getComputedStyle(fr);
     const m=/translateY\((-?[\d.]+)px\)/.exec(fr.style.transform||'');
     const top=m?Math.abs(parseFloat(m[1])):0;
     const bottom=top+1014;
     let name=false, buttons=0, words=0;
     try{
       const d=fr.contentDocument; if(!d?.body) { out.push({id,loaded:false}); continue; }
       const inWin=el=>{const r=el.getBoundingClientRect();
         const t=r.top+d.documentElement.scrollTop, bo=r.bottom+d.documentElement.scrollTop;
         return bo>top && t<bottom;};
       for(const el of d.body.querySelectorAll('p,span,h1,h2,h3,a,div')){
         if(el.children.length) continue;
         const t=(el.textContent||'').trim(); if(!t) continue;
         if(el.getBoundingClientRect().height<1) continue;
         if(!inWin(el)) continue;
         words+=t.split(/\s+/).length;
         if(t===NAMES[id]) name=true;
       }
       for(const a of d.body.querySelectorAll('a')){
         const r=a.getBoundingClientRect();
         if(r.height>28&&r.width>80&&(a.textContent||'').trim()&&inWin(a)) buttons++;
       }
       out.push({id,loaded:true,name,buttons,words});
     }catch(e){out.push({id,loaded:false});}
   }
   return out;},NAMES);
 let bad=[];
 for(const r of rows){
   if(!r.loaded){console.log(`????  ${r.id} not loaded`);continue;}
   // A thumbnail is good if the person's name is in frame and there is real
   // content with it. Buttons where the template has them.
   const ok = r.name && r.words>=8;
   if(!ok) bad.push(r.id);
   console.log(`${ok?'ok  ':'FAIL'} ${r.id.padEnd(13)} name=${r.name?'y':'n'} buttons=${String(r.buttons).padStart(2)} words=${String(r.words).padStart(3)}`);
 }
 console.log(`\n${rows.length} thumbnails, ${bad.length} failing${bad.length?': '+bad.join(', '):''}`);
 await b.close();})();
