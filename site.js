(function(){
  'use strict';
  /* mobile menu */
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
  if(btn&&nav){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.focus();}});}

  /* approval chain: walks one item through the hierarchy */
  var chain=document.querySelector('[data-chain]');
  if(chain){
    var nodes=chain.querySelectorAll('.node'),st=document.querySelector('[data-chain-status]'),i=0;
    var msgs=['מחלקת התרבות יוצרת פוסט לפסטיבל','הגורם המאשר במחלקה בודק ומאשר','הדוברות מאשרת סופית','הפוסט מתוזמן ומתפרסם בכל הערוצים'];
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var paint=function(){nodes.forEach(function(n,k){n.classList.toggle('on',k===i);n.classList.toggle('done',k<i);});
      if(st)st.innerHTML='<span class="pill">שלב '+(i+1)+' מתוך '+nodes.length+'</span><span>'+msgs[i]+'</span>';};
    paint();
    if(!reduce)setInterval(function(){i=(i+1)%nodes.length;paint();},2600);
  }

  /* guides filter */
  var fb=document.querySelectorAll('[data-filter]');
  if(fb.length){fb.forEach(function(b){b.addEventListener('click',function(){var c=b.getAttribute('data-filter');
    fb.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    document.querySelectorAll('[data-cat]').forEach(function(el){el.hidden=!(c==='all'||el.getAttribute('data-cat')===c);});});});}

  /* demo form: validates, then hands the details to an email */
  var f=document.getElementById('demoForm');
  if(f){f.addEventListener('submit',function(e){e.preventDefault();var ok=true,first=null;
    var rules={dName:function(v){return v.trim().length>1||'נא למלא שם מלא';},dOrg:function(v){return v.trim().length>1||'נא למלא את שם הרשות או הארגון';},
      dRole:function(v){return !!v||'נא לבחור תפקיד';},dPhone:function(v){return /^0\d{1,2}-?\d{7}$/.test(v.replace(/\s/g,''))||'מספר טלפון לא תקין, לדוגמה 050-1234567';}};
    Object.keys(rules).forEach(function(id){var el=document.getElementById(id),r=rules[id](el.value),box=el.closest('.field'),er=box.querySelector('.err');
      if(r!==true){ok=false;box.classList.add('bad');er.textContent=r;el.setAttribute('aria-invalid','true');if(!first)first=el;}else{box.classList.remove('bad');er.textContent='';el.removeAttribute('aria-invalid');}});
    if(!ok){first.focus();return;}
    var g=function(id){return document.getElementById(id).value.trim();};
    var txt='שלום, אשמח לתאם הדגמה של PrimeOS.\nשם: '+g('dName')+'\nארגון: '+g('dOrg')+'\nתפקיד: '+g('dRole')+'\nטלפון: '+g('dPhone')+(g('dNote')?'\nהערה: '+g('dNote'):'');
    /* the lead also goes straight into the PrimeOS CRM */
    try{fetch('/api/lead',{method:'POST',keepalive:true,headers:{'content-type':'application/json'},
      body:JSON.stringify({name:g('dName'),org:g('dOrg'),role:g('dRole'),phone:g('dPhone'),note:g('dNote'),
        website:(f.querySelector('[name=website]')||{}).value||'',page:location.href})}).catch(function(){});}catch(_){}
    var done=document.getElementById('formDone'),wa=document.getElementById('waSend');
    wa.href='mailto:simple.solutions05055@gmail.com?subject='+encodeURIComponent('תיאום הדגמה של PrimeOS - '+g('dOrg'))+'&body='+encodeURIComponent(txt);
    done.hidden=false;wa.focus();});}

  /* examples gallery: type tabs, in-view muted video loops, lightbox */
  var xg=document.getElementById('xgGrid'),cards=[].slice.call(document.querySelectorAll('.xg-card'));
  if(cards.length){
    var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(xg){var tabs=[].slice.call(document.querySelectorAll('[data-xf]'));
      var show=function(t){var k=t.getAttribute('data-xf');xg.setAttribute('data-type',k);xg.setAttribute('aria-labelledby',t.id);
        tabs.forEach(function(b){b.setAttribute('aria-selected',b===t?'true':'false');b.tabIndex=b===t?0:-1;});
        [].slice.call(xg.children).forEach(function(li){li.hidden=li.getAttribute('data-xk')!==k;});};
      tabs.forEach(function(b,i){b.addEventListener('click',function(){show(b);});
        b.addEventListener('keydown',function(e){var d=e.key==='ArrowLeft'?1:e.key==='ArrowRight'?-1:0;if(!d)return;
          var n=tabs[(i+d+tabs.length)%tabs.length];n.focus();show(n);});});
      show(tabs[0]);}
    /* videos load only when near the screen, play muted while visible */
    var vids=[].slice.call(document.querySelectorAll('.xg-card video'));
    var on=function(v){if(!v.src){v.src=v.getAttribute('data-src');}v.muted=true;var p=v.play();if(p&&p.catch)p.catch(function(){});v.parentNode.classList.add('playing');};
    var off=function(v){if(!v.paused)v.pause();v.parentNode.classList.remove('playing');};
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.isIntersecting&&e.target.offsetParent!==null)on(e.target);else off(e.target);});},{rootMargin:'120px 0px',threshold:.25});
      vids.forEach(function(v){io.observe(v);});}
    /* lightbox */
    var box=document.getElementById('xgBox');
    if(box&&typeof box.showModal==='function'){
      var stage=box.querySelector('.xg-stage'),cap=box.querySelector('.xg-cap'),list=[],at=0,from=null;
      var visible=function(c){var li=c.closest('.xg-it');return !li.hidden&&c.offsetParent!==null;};
      var paint=function(){var c=list[at];if(!c)return;var lbl=c.getAttribute('aria-label').replace(/^(הגדלה|צפייה): /,'');stage.innerHTML='';
        if(c.hasAttribute('data-video')){var v=document.createElement('video');v.src=c.getAttribute('data-video');v.poster=c.getAttribute('data-poster');
          v.controls=true;v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('aria-label',lbl);stage.appendChild(v);var p=v.play();if(p&&p.catch)p.catch(function(){});}
        else{var im=new Image();im.src=c.getAttribute('data-full');im.alt=lbl;stage.appendChild(im);}
        cap.textContent=lbl+(list.length>1?' · '+(at+1)+' מתוך '+list.length:'');
        [].forEach.call(box.querySelectorAll('.xg-nav'),function(n){n.hidden=list.length<2;});};
      var group=function(c){var root=c.closest('.xg-grid,.xg-strip');var g=root?[].slice.call(root.querySelectorAll('.xg-card')).filter(visible):[];return g.length?g:[c];};
      cards.forEach(function(c){c.addEventListener('click',function(){list=group(c);at=Math.max(0,list.indexOf(c));from=c;paint();box.showModal();});});
      var step=function(d){if(!box.open||list.length<2)return;at=(at+d+list.length)%list.length;paint();};
      box.addEventListener('click',function(e){var b=e.target.closest('[data-xg]');if(b){var a=b.getAttribute('data-xg');
          if(a==='close')box.close();else step(a==='next'?1:-1);return;}
        if(e.target===box||e.target===stage)box.close();});
      box.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')step(1);else if(e.key==='ArrowRight')step(-1);});
      box.addEventListener('close',function(){stage.innerHTML='';if(from)from.focus();});
    }
  }

  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
