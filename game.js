// game.js — playable demo logic
(() => {
  const NIGHT_SECONDS = 60; // seconds per night
  const TOTAL_NIGHTS = 3;

  // DOM
  const startBtn = document.getElementById('start');
  const timeEl = document.getElementById('time');
  const nightEl = document.getElementById('night');
  const powerEl = document.getElementById('power');
  const powerFill = document.getElementById('power-fill');
  const camFeed = document.getElementById('cam-feed');
  const camBtns = Array.from(document.querySelectorAll('.cam-btn'));
  const toggleMonitorBtn = document.getElementById('toggle-monitor');
  const msg = document.getElementById('message');

  // State
  let night = 1;
  let timeLeft = NIGHT_SECONDS;
  let power = 100;
  let playing = false;
  let monitorOn = false;
  let currentCam = 0;
  let clockInterval = null;

  // Enemy state: distance 3 (far) -> 0 (in office)
  let enemyDistance = 3;
  let enemyTimer = null;

  function setMessage(text, timeout=2000){
    msg.textContent = text;
    msg.classList.remove('hidden');
    if(timeout>0) setTimeout(()=>msg.classList.add('hidden'), timeout);
  }

  function updateUI(){
    timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
    nightEl.textContent = night;
    powerEl.textContent = Math.max(0, Math.floor(power));
    powerFill.style.width = Math.max(0, power) + '%';
    camBtns.forEach(b=>b.classList.toggle('active', Number(b.dataset.cam)===currentCam));
    camFeed.textContent = `CAM ${currentCam+1}`;
    // Visualize enemy distance subtly
    camFeed.style.background = enemyDistance<=1 ? 'radial-gradient(circle at 70% 30%, rgba(179,63,63,0.2), #000 60%)' : '#000';
  }

  function startNight(){
    if(playing) return;
    playing = true;
    timeLeft = NIGHT_SECONDS;
    power = 100;
    enemyDistance = 3;
    updateUI();
    setMessage(`Night ${night} started! Survive ${NIGHT_SECONDS}s.`);

    clockInterval = setInterval(()=>{
      // tick
      const dt = 0.25; // quarter-second ticks
      timeLeft -= dt;
      if(monitorOn){
        power -= 0.13; // drain when monitor is on
      } else {
        power -= 0.02; // small passive drain
      }
      if(power<=0){
        power = 0; // blackout
        monitorOn = false; // monitor dies
      }
      updateUI();

      // enemy moves more when monitor is off
      if(enemyDistance>0 && Math.random() < (monitorOn ? 0.01 : 0.045)){
        enemyAdvance();
      }

      if(timeLeft<=0){
        endNight(true);
      }

      if(enemyDistance<=0){
        endNight(false);
      }
    }, 250);

    // enemy randomizer
    enemyTimer = setInterval(()=>{
      // small chance to teleport forward
      if(enemyDistance>0 && Math.random()<0.06) enemyAdvance();
    }, 2000);
  }

  function enemyAdvance(){
    enemyDistance -= 1;
    if(enemyDistance<0) enemyDistance = 0;
    // If player is watching the camera where the enemy currently is, slow it
    if(monitorOn && currentCam===0){
      // when on cam 1, enemy is more visible and less likely to fully advance
      if(Math.random()<0.6) enemyDistance += 1; // retreat
    }
    updateUI();
  }

  function endNight(survived){
    clearInterval(clockInterval); clockInterval = null;
    clearInterval(enemyTimer); enemyTimer = null;
    playing = false;
    monitorOn = false;
    updateUI();
    if(!survived){
      // jump-scare
      camFeed.textContent = '!!! MAKS !!!';
      camFeed.style.background = 'radial-gradient(circle at 50% 50%, rgba(179,63,63,0.95), #000 60%)';
      setMessage('You were caught! Game Over.', 4000);
      night = 1; // reset
      return;
    }
    // survived night
    setMessage(`Night ${night} survived!`);
    night += 1;
    if(night>TOTAL_NIGHTS){
      setMessage('You survived all nights! You Win!', 6000);
      night = 1; // reset to allow replay
    }
  }

  // Controls
  startBtn.addEventListener('click', ()=>{
    if(!playing) startNight();
  });

  toggleMonitorBtn.addEventListener('click', ()=>{
    if(!playing) return setMessage('Start a night first.');
    if(power<=0) return setMessage('No power left.');
    monitorOn = !monitorOn;
    setMessage(monitorOn ? 'Monitor ON' : 'Monitor OFF', 800);
    updateUI();
  });

  camBtns.forEach(b=>b.addEventListener('click', ()=>{
    currentCam = Number(b.dataset.cam);
    updateUI();
  }));

  // Keyboard
  window.addEventListener('keydown', (e)=>{
    if(e.key>='1' && e.key<='4'){
      currentCam = Number(e.key)-1;
      updateUI();
    }
    if(e.key.toLowerCase()==='m'){
      toggleMonitorBtn.click();
    }
    if(e.key.toLowerCase()===' '){
      startBtn.click();
    }
  });

  // Initial
  updateUI();
})();
