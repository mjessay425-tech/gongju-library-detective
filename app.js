const $=s=>document.querySelector(s);
const game=$('#game');
const files=Array.from({length:16},(_,i)=>`stage-${String(i+1).padStart(2,'0')}.png`);
let idx=0,currentInput=null,fromCorrect=-1;

const memos={
  1:'어딘가에 중요한 단서가 숨겨져 있어!\n사진을 잘 보고 추리해보자!',
  3:'어딘가에 중요한 단서가 숨겨져 있어!\n사진을 잘 보고 추리해보자!',
  4:'이 길을 따라가다보면 금방 찾아갈 수 있겠지?\n그 곳엔 책도 참 많을 거야!',
  6:'나무 표지판은 이 길의 중요한 단서일 거야!\n글자를 잘 살펴보고 입력해보자!',
  7:'벽화를 자세히 보면 단서가 숨어있을지도 몰라!\n꼼꼼하게 살펴보고 입력해보자!',
  8:'벽에 적힌 글씨를 자세히 살펴보자!',
  9:'계단을 올라가면 공주도서관이 가까워질 거야!',
  10:'계단을 올라가면 공주도서관이 가까워질 거야!',
  11:'드디어 공주도서관에 도착했어!\n마지막 관문을 통과해보자!',
  13:'간판에는 도서관의 이름이나\n이용 안내 문구가 적혀 있을 거야!'
};

// Known answers from the supplied game artwork. Other answers are intentionally left open until confirmed.
const answers={
  4:['5'],
  7:['중앙공원'],
  8:['2026'],
  9:['13'],
  14:['공주도서관']
};

function pct(v,max){return (v/max*100)+'%'}
function zone(s,x,y,w,h,fn,z=30,sw=832,sh=1792){
  const b=document.createElement('button');
  b.className='hotspot'; b.type='button';
  b.style.cssText=`left:${pct(x,sw)};top:${pct(y,sh)};width:${pct(w,sw)};height:${pct(h,sh)};z-index:${z}`;
  b.setAttribute('aria-label','게임 선택 영역'); b.onclick=fn; s.appendChild(b); return b;
}
function addInput(s,x,y,w,h,sw=832,sh=1792){
  const i=document.createElement('input');
  i.className='answer-input'; i.type='text'; i.placeholder=''; i.autocomplete='off'; i.spellcheck=false;
  i.inputMode='text'; i.setAttribute('aria-label','정답 입력');
  i.style.cssText=`left:${pct(x,sw)};top:${pct(y,sh)};width:${pct(w,sw)};height:${pct(h,sh)};`;
  s.appendChild(i); currentInput=i;
  // Keep the field fully tappable on mobile and stop taps from bubbling to other zones.
  i.addEventListener('pointerdown',e=>e.stopPropagation());
  i.addEventListener('click',e=>{e.stopPropagation(); i.focus();});
  // The placeholder text is part of the original artwork. When the player taps
  // the field, cover that baked-in text so only the player's input is visible.
  i.addEventListener('focus',()=>i.classList.add('is-editing'));
  i.addEventListener('blur',()=>{ if(!i.value) i.classList.remove('is-editing'); });
  return i;
}
function modal(t,wrong=false){const card=$('#modalText');card.textContent=t;card.classList.toggle('wrong-modal',wrong);$('#modal').classList.remove('hidden')}
function closeModal(){ $('#modal').classList.add('hidden'); }
function correct(){ fromCorrect=idx; $('#correct').classList.remove('hidden'); addCorrectCelebration(); }
function nextAfterCorrect(){
  if(fromCorrect<0)return;
  $('#correct').classList.add('hidden');
  idx=fromCorrect+1;
  render();
}
function normalizeAnswer(v){
  return String(v||'')
    .trim()
    .toLowerCase()
    .replace(/\s+/g,'')
    .replace(/[.!?。、，,~～]/g,'');
}
function check(){
  const v=normalizeAnswer(currentInput?.value||'');
  const ok=(answers[idx]||[]).some(a=>v===normalizeAnswer(a));
  if(ok) correct(); else modal('다시 한번 고민해보자!',true);
}
function memoZone(s,story,x,y,w,h,sw=832,sh=1792){
  zone(s,x,y,w,h,()=>modal(memos[story]||'힌트를 다시 살펴보자!'),80,sw,sh);
}
function showNext(){
  const screen=game.querySelector('.screen');
  if(screen) screen.classList.add('screen-exit');
  setTimeout(()=>{idx++;render();},170);
}

function addFx(s){
  // V19 base effects, kept deliberately subtle.
  s.classList.add('fx-enabled');

  // Magnifying-glass light sweep: FIRST PAGE ONLY.
  if(idx===0){
    const glint=document.createElement('span');
    glint.className='fx-glint';
    s.appendChild(glint);
  }

  // Tiny paw trail on selected story pages. It never blocks controls.
  if([0,2,4,6,7,12].includes(idx)){
    const trail=document.createElement('span');
    trail.className='fx-paw-trail';
    trail.textContent='•  •  •';
    s.appendChild(trail);
  }

  addCharacterBlink(s, idx);
  addTypingDialogue(s, idx);
  if(idx===13) addDogSparkles(s);
  if(idx===15){ addFinalCelebration(s); addFinalPollen(s); }
}
function addDogSparkles(s){
  if(s.querySelector('.dog-sparkles')) return;
  const fx=document.createElement('div');
  fx.className='dog-sparkles';
  const spots=[
    [39,57,0],[53,53,.25],[66,59,.5],[35,69,.8],[61,70,1.05],[72,66,.35],
    [47,76,.65],[76,75,.95],[31,61,.45],[58,49,.75]
  ];
  spots.forEach(([x,y,d])=>{
    const e=document.createElement('span'); e.className='dog-sparkle';
    e.textContent=['✦','✧','★'][Math.floor((x+y)%3)];
    e.style.left=x+'%'; e.style.top=y+'%'; e.style.setProperty('--delay',d+'s');
    fx.appendChild(e);
  });
  s.appendChild(fx);
}

function buildFireworkFX(className,big=false){
  const fx=document.createElement('div');
  fx.className=className;

  // A restrained celebration: fewer bursts and fewer rays.
  const bursts=big ? [
    [18,25,1.0],[50,20,1.12],[82,28,.95],[50,52,1.0]
  ] : [
    [25,30,1.0],[65,35,.95]
  ];

  bursts.forEach(([x,y,scale],bi)=>{
    const b=document.createElement('div');
    b.className='firework';
    b.style.left=x+'%';
    b.style.top=y+'%';
    b.style.setProperty('--scale',scale);
    b.style.setProperty('--delay',(bi*(big?.35:.5))+'s');

    const rays=big?14:12;
    for(let i=0;i<rays;i++){
      const p=document.createElement('i');
      p.style.setProperty('--angle',(i*(360/rays))+'deg');
      p.style.setProperty('--dist',(big?(42+(i%3)*7):(34+(i%3)*6))+'px');
      p.style.setProperty('--pdelay',((i%5)*(big?.035:.05))+'s');
      b.appendChild(p);
    }
    fx.appendChild(b);
  });

  return fx;
}

function addCorrectCelebration(){
  const wrap=document.querySelector('.correct-wrap');
  if(!wrap || wrap.querySelector('.fx-celebrate')) return;
  wrap.appendChild(buildFireworkFX('fx-celebrate',true));
}
function addFinalCelebration(s){
  if(s.querySelector('.fx-final-celebrate')) return;
  s.appendChild(buildFireworkFX('fx-final-celebrate',true));
}

function addFinalPollen(s){
  if(s.querySelector('.final-pollen')) return;
  const fx=document.createElement('div');
  fx.className='final-pollen';
  for(let i=0;i<18;i++){
    const e=document.createElement('i');
    e.style.left=(7+i*5.1+(i%3)*2)+'%';
    e.style.top=(58+(i%6)*6)+'%';
    e.style.setProperty('--delay',((i%9)*.24)+'s');
    e.style.setProperty('--drift',(((i%5)-2)*24)+'px');
    e.style.setProperty('--rot',((i%2?1:-1)*(18+(i%4)*12))+'deg');
    fx.appendChild(e);
  }
  s.appendChild(fx);
}

// Character blink: a small, animation-only eyelid overlay. The original artwork
// stays untouched; the overlay is pointer-events:none and appears briefly at
// irregular intervals. Coordinates are per original 852/853px artwork.
// Character blink: only the FIRST screen uses a custom closed-eye overlay.
// Later screens stay exactly as the original artwork (no blink effect).
function addCharacterBlink(s,stage){
  if(stage!==0)return;
  // V20 opening blink restored exactly: two small eyelid shapes over the
  // existing cat eyes. The original artwork remains untouched.
  const blink=document.createElement('div');
  blink.className='fx-blink-opening';
  blink.innerHTML='<i class="eye eye-l"></i><i class="eye eye-r"></i>';
  s.appendChild(blink);
}

// Dialogue typing: fresh HTML text is revealed one Korean character at a time.
// It is pointer-events:none so all original transparent controls remain usable.
const dialogueData={
  0:{tx:135,ty:468,tw:590,th:150,text:'명탐정 냥냥에게 의뢰가 도착했어요!\n공주에 숨겨진 도서관을 찾아보자냥!',size:19},
  1:{tx:325,ty:1020,tw:405,th:160,text:'여기가 바로 우리 수사의 시작점!\n공주목!\n여기서 어떻게 가야될까?',size:15},
  2:{tx:235,ty:595,tw:380,th:220,text:'혹시 공주도서관을 찾고있니?\n내가 가는 길을 잘 아는데!\n간판 자음에 ‘ㄱㅈㅈ’이\n있는 곳으로 가봐!',size:15},
  3:{tx:330,ty:1075,tw:400,th:130,text:'어? 이쪽으로 가면\n공주도서관으로 갈 수 있다던데?',size:15},
  4:{tx:375,ty:975,tw:370,th:125,text:'흠..! 예쁜 주택이 보이네!\n파란색 주소 표지판에\n적힌 숫자는 무엇일까?',size:15},
  5:{tx:335,ty:1145,tw:430,th:115,text:'오른쪽 위로 공주도서관이 보이네!\n잘 가고 있는 것 같아.',size:15},
  6:{tx:372,ty:780,tw:270,th:210,text:'어느 쪽으로 가야\n공주도서관이 나올까?\n표지판 퍼즐을 맞춰서\n단서를 찾아보자냥!',size:15},
  7:{tx:345,ty:1035,tw:370,th:135,text:'나무 표지판에\n써져 있는 글자를 읽어보자냥!\n정답을 입력해봐!',size:15},
  9:{tx:338,ty:1068,tw:425,th:155,text:'벽에 해바라기 그림이 그려져 있네! 🌻\n해바라기는 모두 몇 개일까?\n정답을 입력해봐!',size:13},
  10:{tx:330,ty:1145,tw:420,th:150,text:'조금 더 가다가 오른쪽을 보니까\n계단이 보여!\n여기가 공주도서관으로 가는 길일까?',size:14},
  11:{tx:325,ty:1135,tw:430,th:135,text:'계단 오느라 힘들었지?\n드디어 보인다!\n건물 앞으로 가보자!',size:15},
  12:{tx:325,ty:1170,tw:430,th:140,text:'드디어 공주도서관에 도착했어!\n이제 마지막 관문을 통과하러\n공주도서관에 들어가 보자.',size:15},
  13:{tx:270,ty:735,tw:315,th:105,text:'와! 정말 도착했잖아!\n너 정말 명탐정이다!',size:15},
  14:{tx:345,ty:1073,tw:400,th:175,text:'드디어 도착했어!\n하지만 이 간판에 적힌 글이\n중요한 단서일지도 몰라!\n무엇이 쓰여 있는지 맞춰보자냥!',size:15},
  15:{tx:420,ty:1062,tw:350,th:225,text:'의뢰 해결!\n공주도서관 종합자료실에\n도착했어!\n안으로 들어가서\n상품을 받아가자!',size:15}
};
function addTypingDialogue(s,stage){
  const d=dialogueData[stage];
  if(!d)return;
  const text=document.createElement('div');
  text.className='typing-text';
  text.style.position='absolute';
  text.style.zIndex='24';
  text.style.left=pct(d.tx,853);
  text.style.top=pct(d.ty,1844);
  text.style.width=pct(d.tw,853);
  text.style.height=pct(d.th,1844);
  text.style.fontSize=(d.size||27)+'px';
  s.appendChild(text);
  const chars=Array.from(d.text); let n=0;
  const tick=()=>{
    if(n>=chars.length)return;
    text.textContent+=chars[n++];
    const ch=chars[n-1];
    const delay=ch==='\n'?190:52;
    setTimeout(tick,delay);
  };
  requestAnimationFrame(()=>setTimeout(tick,260));
}

function render(){
  game.innerHTML=''; currentInput=null;
  const s=document.createElement('div'); s.className='screen';
  const b=document.createElement('img'); b.className='bg'; b.src='assets/'+files[idx]; b.alt='';
  s.appendChild(b); game.appendChild(s);
  addFx(s);

  // Intro / story 1 / story 2 remain as before.
  if(idx===0){ zone(s,130,1145,570,180,showNext,40,853,1844); return; }
  if(idx===1){ zone(s,194,1406,435,84,showNext,40,853,1844); memoZone(s,1,40,1510,770,210,853,1844); return; }
  if(idx===2){
    // Story 1 choice: top retry, bottom correct.
    zone(s,96,1074,644,107,()=>modal('다시 한번 고민해보자!'),60,853,1844);
    zone(s,100,1192,644,104,correct,60,853,1844);
    memoZone(s,3,40,1510,770,210,853,1844);
    return;
  }
  if(idx===3){
    // Story 2 choice: top correct, bottom retry.
    zone(s,75,1147,701,105,correct,60,853,1844);
    zone(s,82,1259,688,92,()=>modal('다시 한번 고민해보자!'),60,853,1844);
    memoZone(s,4,40,1510,770,210,853,1844);
    return;
  }

  // From Story 3 onward, every colored marker is an invisible interaction zone.
  if(idx===4){
    // Story 3: purple=input, green=check, pink=memo.
    addInput(s,74,1191,449,71);
    zone(s,536,1191,230,71,check,70);
    memoZone(s,3,64,1275,702,67);
    return;
  }
  if(idx===5){
    // Story 4: the entire screen is the invisible next-page button.
    // Tapping anywhere on this stage advances immediately.
    zone(s,0,0,853,1844,showNext,60,853,1844);
    return;
  }
  if(idx===6){
    // Story 5: only the four blue puzzle pieces are draggable.
    renderPuzzle(s); return;
  }
  if(idx===7){
    // Story 6: purple=input, green=check, pink=memo.
    addInput(s,115,1290,391,78);
    zone(s,533,1288,187,80,check,70);
    memoZone(s,6,107,1388,613,58);
    return;
  }
  if(idx===8){
    // Story 7: purple=input, green=check.
    addInput(s,296,1541,280,78);
    zone(s,594,1540,183,80,check,70);
    return;
  }
  if(idx===9){
    // Story 8: purple=input, green=check.
    addInput(s,88,1354,424,78);
    zone(s,547,1347,212,92,check,70);
    return;
  }
  if(idx===10){
    // Story 9: red=next, sky blue=retry. No correct screen here.
    zone(s,109,1458,300,119,showNext,60);
    zone(s,427,1458,290,115,()=>modal('다시 한번 고민해보자!'),60);
    return;
  }
  if(idx===11){
    // Story 10: red=next, sky blue=retry. No correct screen here.
    zone(s,109,1461,300,119,showNext,60);
    zone(s,427,1460,290,116,()=>modal('다시 한번 고민해보자!'),60);
    return;
  }
  if(idx===12){
    // Story 11: red=next, sky blue=retry. No correct screen here.
    zone(s,107,1499,300,126,showNext,60);
    zone(s,433,1499,290,132,()=>modal('다시 한번 고민해보자!'),60);
    return;
  }
  if(idx===13){
    // Story 12: red=next. No correct screen here.
    zone(s,143,1528,548,114,showNext,60);
    return;
  }
  if(idx===14){
    // Story 13: purple=input, green=check.
    addInput(s,93,1381,425,78);
    zone(s,546,1374,218,95,check,70);
    return;
  }
  if(idx===15){
    // Story 14 / final artwork: no additional overlay needed.
    return;
  }
}

function renderPuzzle(s){
  // Use the guide taken directly from the user's original Story 5 artwork.
  // It is an exact rectangular crop of the original sign-shaped frame, so the
  // arrow tip and the complete lower edge cannot be distorted by CSS stretching.
  const guide=document.createElement('img');
  guide.src='assets/puzzle-guide-exact.png';
  guide.className='puzzle-guide puzzle-guide-exact';
  guide.alt='퍼즐 맞추기 틀';
  guide.style.left=pct(180,853);
  guide.style.top=pct(1138,1844);
  guide.style.width=pct(510,853);
  guide.style.height=pct(182,1844);
  s.appendChild(guide);


  // Story 5 puzzle: the four blue pieces must be placed IN ORDER,
  // left-to-right, into the orange arrow-shaped guide above.
  // Each piece has its own snap position; dropping in the wrong position
  // returns it to its original place.
  // The pieces are scaled to 80% so the four pieces fit INSIDE the
  // dashed sign guide, with a small margin.  The guide begins around
  // x=198 and y=1153 in the 853x1844 artwork and ends around x=675.
  const pieces=[
    {src:'puzzle-1.png',x:82,y:1340,w:139,h:146},
    {src:'puzzle-2.png',x:247,y:1340,w:183,h:146},
    {src:'puzzle-3.png',x:462,y:1340,w:140,h:146},
    {src:'puzzle-4.png',x:640,y:1340,w:134,h:146}
  ];

  // Exact left-to-right order inside the dashed guide:
  // 영명 → 학당2길 → 19-1 ↑ 19-5 → arrow tip.
  // Widths preserve each original piece's proportions at 80%.
  // Snapped pieces: slightly larger than v11 and shifted down by another ~16px.
  // They remain centered as one completed sign inside the orange guide.
  const slots=[
    {x:187.6,y:1186,w:115.65,h:121.5},
    {x:303.25,y:1186,w:152.26,h:121.5},
    {x:455.51,y:1186,w:116.48,h:121.5},
    {x:571.99,y:1186,w:111.49,h:121.5}
  ];

  const placed=new Set();
  const hitPadding=22;

  pieces.forEach((p,i)=>{
    const e=document.createElement('img');
    e.className='puzzle-piece';
    e.src='assets/'+p.src;
    e.draggable=false;
    e.style.left=pct(p.x,853);
    e.style.top=pct(p.y,1844);
    e.style.width=pct(p.w,853);
    e.style.height=pct(p.h,1844);

    let dragging=false,startX=0,startY=0,startLeft=0,startTop=0;

    e.addEventListener('pointerdown',ev=>{
      if(placed.has(i)) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragging=true;
      e.setPointerCapture(ev.pointerId);
      startX=ev.clientX;
      startY=ev.clientY;
      startLeft=parseFloat(e.style.left);
      startTop=parseFloat(e.style.top);
      e.classList.add('dragging');
    });

    e.addEventListener('pointermove',ev=>{
      if(!dragging) return;
      ev.preventDefault();
      const r=s.getBoundingClientRect();
      e.style.left=(startLeft+(ev.clientX-startX)/r.width*100)+'%';
      e.style.top=(startTop+(ev.clientY-startY)/r.height*100)+'%';
    });

    const finish=ev=>{
      if(!dragging) return;
      dragging=false;
      e.classList.remove('dragging');
      const r=s.getBoundingClientRect();
      const px=ev.clientX-r.left;
      const py=ev.clientY-r.top;
      const slot=slots[i];
      const sx=r.width*slot.x/853;
      const sy=r.height*slot.y/1844;
      const sw=r.width*slot.w/853;
      const sh=r.height*slot.h/1844;

      // A piece only snaps when released in its OWN slot.
      // This prevents pieces from landing in strange positions.
      const inside=(px>=sx-hitPadding && px<=sx+sw+hitPadding &&
                    py>=sy-hitPadding && py<=sy+sh+hitPadding);

      if(inside){
        e.style.left=pct(slot.x,853);
        e.style.top=pct(slot.y,1844);
        e.style.width=pct(slot.w,853);
        e.style.height=pct(slot.h,1844);
        placed.add(i);
        if(placed.size===pieces.length){
          setTimeout(correct,220);
        }
      }else{
        e.style.left=pct(p.x,853);
        e.style.top=pct(p.y,1844);
        e.style.width=pct(p.w,853);
        e.style.height=pct(p.h,1844);
      }
    };

    e.addEventListener('pointerup',finish);
    e.addEventListener('pointercancel',finish);
    s.appendChild(e);
  });
}

$('#modalClose').onclick=closeModal;
$('#correctNext').onclick=nextAfterCorrect;
render();
