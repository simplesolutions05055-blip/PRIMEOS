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

  /* demo form: validates, then hands the details to WhatsApp */
  var f=document.getElementById('demoForm');
  if(f){f.addEventListener('submit',function(e){e.preventDefault();var ok=true,first=null;
    var rules={dName:function(v){return v.trim().length>1||'נא למלא שם מלא';},dOrg:function(v){return v.trim().length>1||'נא למלא את שם הרשות או הארגון';},
      dRole:function(v){return !!v||'נא לבחור תפקיד';},dPhone:function(v){return /^0\d{1,2}-?\d{7}$/.test(v.replace(/\s/g,''))||'מספר טלפון לא תקין, לדוגמה 050-1234567';}};
    Object.keys(rules).forEach(function(id){var el=document.getElementById(id),r=rules[id](el.value),box=el.closest('.field'),er=box.querySelector('.err');
      if(r!==true){ok=false;box.classList.add('bad');er.textContent=r;el.setAttribute('aria-invalid','true');if(!first)first=el;}else{box.classList.remove('bad');er.textContent='';el.removeAttribute('aria-invalid');}});
    if(!ok){first.focus();return;}
    var g=function(id){return document.getElementById(id).value.trim();};
    var txt='שלום, אשמח לתאם הדגמה של PrimeOS.\nשם: '+g('dName')+'\nארגון: '+g('dOrg')+'\nתפקיד: '+g('dRole')+'\nטלפון: '+g('dPhone')+(g('dNote')?'\nהערה: '+g('dNote'):'');
    /* the lead also goes straight into the PrimeOS CRM; WhatsApp stays as it was */
    try{fetch('/api/lead',{method:'POST',keepalive:true,headers:{'content-type':'application/json'},
      body:JSON.stringify({name:g('dName'),org:g('dOrg'),role:g('dRole'),phone:g('dPhone'),note:g('dNote'),
        website:(f.querySelector('[name=website]')||{}).value||'',page:location.href})}).catch(function(){});}catch(_){}
    var done=document.getElementById('formDone'),wa=document.getElementById('waSend');
    wa.href='https://wa.me/972547712034?text='+encodeURIComponent(txt);
    done.hidden=false;wa.focus();});}

  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
