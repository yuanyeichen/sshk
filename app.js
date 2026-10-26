'use strict';
const {stories}=window.FILM_CONTENT;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const phoneLayout=matchMedia('(max-width:699px), (hover:none) and (pointer:coarse) and (max-height:500px) and (max-width:1100px)');
const portraitPhoneLayout=matchMedia('(max-width:699px) and (orientation:portrait)');
const hero=$('.hero');
const heroViewport=hero.querySelector('.hero-sticky');
const heroVideo=$('#hero-video');
const brand=$('.brand-link');
const manifesto=$('.hero-manifesto');
const featureMedia=$$('.latest .film-visual');
const statement=$('.documentary-statement');
const statementText=statement?.querySelector('.statement-text');
const statementCharacters=statementText?Array.from(statementText.textContent,character=>{
 const span=document.createElement('span');
 span.className='statement-char';
 span.textContent=character;
 return span;
}):[];
if(statementText)statementText.replaceChildren(...statementCharacters);
let menuOpen=false;
let heroVisible=false;
let scrollFrame=0;
let mobileMotionHeight=0;
function syncHeroCopyHeight(){
 if(!portraitPhoneLayout.matches){hero.style.removeProperty('--mobile-copy-content-height');return;}
 const height=`${manifesto.offsetHeight}px`;
 if(hero.style.getPropertyValue('--mobile-copy-content-height')!==height){
  hero.style.setProperty('--mobile-copy-content-height',height);
  scheduleScroll();
 }
}
function syncResponsiveMetrics(){
 if(phoneLayout.matches){
  // Measure the same stable viewport used by CSS instead of the moving toolbar.
  const probe=document.createElement('div');
  probe.style.cssText='position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;width:0;height:100vh;height:100svh';
  document.body.append(probe);
  mobileMotionHeight=probe.getBoundingClientRect().height||innerHeight;
  probe.remove();
 }else mobileMotionHeight=0;
 syncHeroCopyHeight();
}
function motionViewportHeight(){return phoneLayout.matches?(mobileMotionHeight||innerHeight):innerHeight;}
function backgroundAllowed(){return !reduced.matches&&!document.hidden&&!menuOpen&&!$('dialog[open]');}
function playHeroVideo(){
 const video=heroVideo;
 if(!backgroundAllowed())return;
 video.defaultMuted=true;
 video.muted=true;
 video.playsInline=true;
 if(!video.getAttribute('src')){
  const compact=innerWidth<700||navigator.connection?.saveData;
  video.src=compact?video.dataset.srcMobile:video.dataset.srcDesktop;
 }
 const attempt=video.play();
 if(attempt)attempt.then(()=>{
  if(!backgroundAllowed()){video.pause();return;}
  video.classList.add('is-ready');
 }).catch(()=>video.classList.remove('is-ready'));
}
function updateMedia(){
 const allowed=backgroundAllowed();
 if(allowed&&heroVisible)playHeroVideo();
 else heroVideo.pause();
}
heroVideo.addEventListener('playing',()=>heroVideo.classList.add('is-ready'));
heroVideo.addEventListener('error',()=>heroVideo.classList.remove('is-ready'));
function resumeVisibleMedia(){
 if(!backgroundAllowed())return;
 const rect=heroViewport.getBoundingClientRect();
 if(rect.bottom>0&&rect.top<innerHeight&&heroVideo.paused)playHeroVideo();
}
// Retry in a real interaction handler when a mobile browser blocks autoplay.
['pointerdown','touchend','keydown'].forEach(type=>document.addEventListener(type,resumeVisibleMedia,{passive:true}));
addEventListener('pageshow',resumeVisibleMedia);
function paintFeatureMedia(){
 const vh=motionViewportHeight();
 const measurements=featureMedia.map(media=>({media,rect:media.parentElement.getBoundingClientRect(),height:media.offsetHeight}));
 measurements.forEach(({media,rect,height})=>{
  if(reduced.matches){['reveal','opacity','lift','pan','scale'].forEach(key=>media.style.removeProperty(`--feature-${key}`));return;}
  if(rect.bottom< -vh*.2||rect.top>vh*1.25)return;
  const progress=Math.min(1,Math.max(0,(vh*.96-rect.top)/Math.min(vh*.5,height*.85)));
  const eased=1-Math.pow(1-progress,3);
  const pan=Math.max(-12,Math.min(12,((rect.top+height/2)/vh-.5)*24));
  media.style.setProperty('--feature-reveal',eased.toFixed(4));
  media.style.setProperty('--feature-opacity',(.3+eased*.7).toFixed(4));
  media.style.setProperty('--feature-lift',`${((1-eased)*22).toFixed(2)}px`);
  media.style.setProperty('--feature-pan',`${pan.toFixed(2)}px`);
  media.style.setProperty('--feature-scale',(1.04+(1-eased)*.04).toFixed(4));
 });
}
function paintStatement(){
 if(!statement)return;
 const rect=statement.getBoundingClientRect();
 const vh=motionViewportHeight();
 if(!reduced.matches&&(rect.bottom<0||rect.top>vh*1.25))return;
 const progress=reduced.matches?1:Math.min(1,Math.max(0,(vh*.92-rect.top)/Math.min(vh*.5,rect.height+160)));
 statement.style.setProperty('--statement-reveal',progress.toFixed(4));
 const middle=(statementCharacters.length-1)/2;
 const expansion=progress*progress*(3-2*progress);
 statementCharacters.forEach((character,index)=>{
  const distance=Math.abs(index-middle)/Math.max(1,middle);
  const delay=distance*.44;
  const local=reduced.matches?1:Math.min(1,Math.max(0,(progress-delay)/(1-delay)));
  character.style.setProperty('--letter-shift',`${((middle-index)*.95*(1-expansion)).toFixed(4)}em`);
  character.style.setProperty('--letter-opacity',Math.min(1,local*3).toFixed(4));
 });
}
function paintScroll(){
 scrollFrame=0;
 paintFeatureMedia();
 paintStatement();
 const mobile=phoneLayout.matches;
 // Small viewport units keep this timeline stable as Safari's address bar moves.
 const vh=mobile?heroViewport.clientHeight:innerHeight;
 const p=Math.min(1,Math.max(0,scrollY/(vh*.72)));
 const maxWidth=mobile?Math.min(260,innerWidth*.48):Math.min(820,innerWidth*.44);
 const width=maxWidth+(110-maxWidth)*(1-Math.pow(1-p,2));
 const brandWidth=`${width.toFixed(2)}px`;
 if(brand.style.width!==brandWidth)brand.style.width=brandWidth;
 const small=p>.94||menuOpen;
 const wasSmall=brand.classList.contains('is-small');
 brand.classList.toggle('is-small',small);
 if(menuOpen)brand.style.width='110px';
 const heroP=Math.min(1,Math.max(0,scrollY/vh));
 hero.style.setProperty('--hero-scale',reduced.matches?'1':(1+heroP*.17).toFixed(4));
 hero.style.setProperty('--hero-shade',(.18+heroP*.4).toFixed(4));
 const reveal=Math.min(1,Math.max(0,(heroP-.48)/.35));
 const portraitPhone=portraitPhoneLayout.matches;
 const manifestoReveal=portraitPhone?Math.min(1,Math.max(0,heroP/.65)):reveal;
 manifesto.style.opacity=reduced.matches?'1':manifestoReveal.toFixed(3);
 manifesto.style.transform=reduced.matches?'none':`translate3d(0,${((1-manifestoReveal)*(portraitPhone?60:35)).toFixed(2)}px,0)`;
 if(wasSmall!==small)updateMedia();
}
function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);}
addEventListener('scroll',scheduleScroll,{passive:true});
addEventListener('resize',()=>{syncResponsiveMetrics();scheduleScroll();},{passive:true});
phoneLayout.addEventListener('change',()=>{syncResponsiveMetrics();scheduleScroll();});
if('ResizeObserver' in window)new ResizeObserver(syncHeroCopyHeight).observe(manifesto);
syncResponsiveMetrics();
paintScroll();
const mediaObserver=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
  heroVisible=entry.isIntersecting;
 });updateMedia();
},{threshold:[0,.1]});
mediaObserver.observe(heroViewport);
const revealTargets=new Map();
const revealObserver=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{if(entry.isIntersecting){revealTargets.get(entry.target)?.forEach(el=>el.classList.add('is-revealed'));revealObserver.unobserve(entry.target);}});
},{threshold:.06,rootMargin:'0px 0px 5% 0px'});
if(!reduced.matches)document.body.classList.add('js-motion');
$$('.media-reveal:not(.latest .media-reveal)').forEach(el=>{const target=el.parentElement;const list=revealTargets.get(target)||[];list.push(el);revealTargets.set(target,list);revealObserver.observe(target);});
reduced.addEventListener('change',()=>{document.body.classList.toggle('js-motion',!reduced.matches);paintScroll();updateMedia();});
document.addEventListener('visibilitychange',updateMedia);

updateMedia();

// Mobile navigation preserves native scrolling and closes before anchor navigation.
const menu=$('#mobile-menu');
const menuToggle=$('.menu-toggle');
function setMenu(open){
 menuOpen=open;
 document.body.classList.toggle('menu-is-open',open);
 menu.inert=!open;
 menuToggle.setAttribute('aria-expanded',String(open));
 paintScroll();updateMedia();
 if(open)requestAnimationFrame(()=>menu.querySelector('a').focus({preventScroll:true}));
}
menuToggle.addEventListener('click',()=>setMenu(!menuOpen));
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',event=>{
 if(!menuOpen)return;
 if(event.key==='Escape'){setMenu(false);menuToggle.focus();}
 if(event.key==='Tab'){
  const stops=[menuToggle,...menu.querySelectorAll('a')];
  const i=stops.indexOf(document.activeElement);
  if(event.shiftKey&&(i<=0)){event.preventDefault();stops.at(-1).focus();}
  else if(!event.shiftKey&&i===stops.length-1){event.preventDefault();stops[0].focus();}
 }
});
addEventListener('resize',()=>{if(innerWidth>=700&&menuOpen)setMenu(false);});

// Dialogs for story details, packages and WeChat consultation.
const pricingDialog=$('#pricing-dialog');
const consultDialog=$('#consult-dialog');
const storyDialog=$('#story-dialog');
function openDialog(dialog){setMenu(false);dialog.showModal();document.body.classList.add('dialog-is-open');updateMedia();}
$$('dialog').forEach(dialog=>{
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{
  document.body.classList.toggle('dialog-is-open',!!$('dialog[open]'));
  updateMedia();
 });
});
$$('[data-story]').forEach(button=>button.addEventListener('click',()=>{
 const story=stories[Number(button.dataset.story)];
 $('#dialog-story-image').src=story.image;$('#dialog-story-image').alt=story.title;
 $('#dialog-story-category').textContent=story.label;
 $('#dialog-story-title').textContent=story.title;
 $('#dialog-story-description').textContent=story.description;
 openDialog(storyDialog);
}));
function openConsult(packageName='聊聊我的故事'){
 const selected=packageName!=='聊聊我的故事';
 $('#wechat-package').textContent=selected?`${packageName}咨询`:'';
 $('#wechat-package').hidden=!selected;
 openDialog(consultDialog);
}
$$('[data-consult]').forEach(button=>button.addEventListener('click',()=>{if(pricingDialog.open)pricingDialog.close();openConsult(button.dataset.consult);}));
$('#story-consult').addEventListener('click',()=>{storyDialog.close();openConsult();});
$$('[data-open-pricing]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openDialog(pricingDialog);}));
if(location.hash==='#pricing')openDialog(pricingDialog);
