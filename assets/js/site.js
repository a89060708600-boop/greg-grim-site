// Выбор читателя действует на все движения и видео, включая новые обложки.
  var grimMotion = (function(){
    var query = window.matchMedia("(prefers-reduced-motion: reduce)");
    var saved = null;
    try { saved = localStorage.getItem("greggrim-motion"); } catch (e) {}
    var allowed = saved === "on" || (saved !== "off" && !query.matches);
    var listeners = [];
    var toggle = document.getElementById("motionToggle");
    function active(){ return allowed && !document.hidden; }
    function sync(){
      document.documentElement.setAttribute("data-motion", allowed ? "on" : "off");
      document.documentElement.setAttribute("data-page-hidden", document.hidden ? "true" : "false");
      toggle.textContent = "Анимация: " + (allowed ? "вкл" : "выкл");
      toggle.setAttribute("aria-pressed", allowed ? "true" : "false");
      toggle.setAttribute("title", allowed ? "Выключить движение и видео" : "Включить движение и видео");
      if (!active()) document.querySelectorAll("video").forEach(function(v){ v.pause(); });
      listeners.forEach(function(fn){ fn(active()); });
    }
    toggle.hidden = false;
    toggle.addEventListener("click", function(){
      allowed = !allowed;
      saved = allowed ? "on" : "off";
      try { localStorage.setItem("greggrim-motion", saved); } catch (e) {}
      sync();
    });
    function systemChange(){ if (saved !== "on" && saved !== "off") { allowed = !query.matches; sync(); } }
    if (query.addEventListener) query.addEventListener("change", systemChange); else query.addListener(systemChange);
    document.addEventListener("visibilitychange", sync);
    sync();
    return { active:active, enabled:function(){ return allowed; }, subscribe:function(fn){ listeners.push(fn); fn(active()); } };
  })();

  // печатная машинка в хиро
  (function(){
    var text = "Если в доме слишком тихо, это ещё не значит, что он пуст.";
    var el = document.getElementById("typed");
    var i = 0, timer = null, complete = false;
    function tick(){
      if (!grimMotion.active()) return;
      el.textContent = text.slice(0, ++i);
      if (i < text.length) timer = setTimeout(tick, 45 + Math.random() * 70); else complete = true;
    }
    grimMotion.subscribe(function(active){
      clearTimeout(timer);
      if (!active) { el.textContent = text; complete = true; return; }
      if (!complete) { el.textContent = ""; timer = setTimeout(tick, 900); }
    });
  })();

  // тёмная комната: фонарик за курсором + выключатель
  (function(){
    var room = document.getElementById("darkroom");
    var veil = room.querySelector(".veil");
    var btn = document.getElementById("lightSwitch");
    var hint = document.getElementById("hint");

    var cursorHint = window.matchMedia("(pointer: coarse)").matches ? "водите по тексту пальцем, как фонариком" : "водите по тексту, как фонариком";
    hint.textContent = cursorHint;
    var hand = room.querySelector(".dark-hand");
    room.addEventListener("pointermove", function(e){
      var r = room.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      veil.style.setProperty("--x", x + "px");
      veil.style.setProperty("--y", y + "px");
      // луч у правого края — рука тянется к свету
      if (hand && grimMotion.active() && !room.classList.contains("lit")) {
        hand.classList.toggle("reach", x / r.width > 0.68);
      }
    });
    room.addEventListener("pointerleave", function(){
      veil.style.setProperty("--x", "-20%");
      veil.style.setProperty("--y", "-20%");
      if (hand) hand.classList.remove("reach");
    });
    btn.addEventListener("click", function(){
      var lit = room.classList.toggle("lit");
      if (hand) hand.classList.remove("reach");
      btn.setAttribute("aria-pressed", lit ? "true" : "false");
      btn.textContent = lit ? "Погасить свет" : "Включить свет";
      hint.textContent = lit ? "теперь можно прочитать весь фрагмент" : cursorHint;
    });
    grimMotion.subscribe(function(active){ if (!active && hand) hand.classList.remove("reach"); });
    room.classList.add("interactive");
    btn.hidden = false;
  })();

  // обложки поворачиваются к свету
  (function(){
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll(".cover-link").forEach(function(link){
      var cover = link.querySelector(".cover");
      if (!cover) return;
      var glare = cover.querySelector(".glare");
      link.addEventListener("pointermove", function(e){
        if (!grimMotion.active()) return;
        var r = link.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        cover.style.transform = "translateY(-8px) rotateX(" + ((0.5 - py) * 8).toFixed(2) +
          "deg) rotateY(" + ((px - 0.5) * 8).toFixed(2) + "deg)";
        if (glare) {
          glare.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
          glare.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        }
      });
      link.addEventListener("pointerleave", function(){
        cover.style.transform = "";
      });
      grimMotion.subscribe(function(active){ if (!active) cover.style.transform = ""; });
    });
  })();

  // имя как неоновая вывеска: буквы мерцают
  (function(){
    var h1 = document.querySelector("h1");
    var text = h1.textContent;
    h1.setAttribute("aria-label", text);
    h1.innerHTML = "";
    text.trim().split(/\s+/).forEach(function(word,index){
      if (index) h1.appendChild(document.createTextNode(" "));
      var group = document.createElement("span");
      group.className = "h1-word";
      group.setAttribute("aria-hidden", "true");
      word.split("").forEach(function(ch){
        var s = document.createElement("span");
        s.className = "h1-letter";
        s.textContent = ch;
        group.appendChild(s);
      });
      h1.appendChild(group);
    });
    var letters = h1.querySelectorAll(".h1-letter"), timer = null, introduced = false;
    function flick(el){
      if (!grimMotion.active()) return;
      el.classList.remove("flick");
      void el.offsetWidth;
      el.classList.add("flick");
    }
    letters.forEach(function(l){
      l.addEventListener("pointerenter", function(){ flick(l); });
      l.addEventListener("animationend", function(){ l.classList.remove("flick"); });
    });
    function ambient(){
        timer = setTimeout(function(){
          if (!grimMotion.active()) return;
          flick(letters[Math.floor(Math.random() * letters.length)]);
          ambient();
        }, 3500 + Math.random() * 4500);
    }
    grimMotion.subscribe(function(active){
      clearTimeout(timer);
      letters.forEach(function(l){ l.classList.remove("flick"); });
      if (active && !introduced) {
        introduced = true;
        timer = setTimeout(function(){ flick(letters[1] || letters[0]); ambient(); },800);
      } else if (active) ambient();
    });
  })();

  // фоновые видео-ленты: играют только когда видны на экране
  (function(){
    var scenes = Array.from(document.querySelectorAll(".ambience")).map(function(band){
      return {band:band,video:band.querySelector("video"),near:false,ratio:0};
    });
    if (!scenes.length || !("IntersectionObserver" in window)) return;
    var playing = null, version = 0;
    function prepare(scene){
      if (grimMotion.active() && (scene.near || scene.ratio > 0) && !scene.video.hasAttribute("src")) {
        scene.video.src = scene.video.getAttribute("data-src");
      }
    }
    function update(){
      scenes.forEach(prepare);
      var best = null;
      if (grimMotion.active()) scenes.forEach(function(scene){
        if (scene.ratio > 0.05 && (!best || scene.ratio > best.ratio)) best = scene;
      });
      if (best === playing) return;
      var ticket = ++version;
      scenes.forEach(function(scene){
        if (scene !== best) { scene.video.pause(); scene.band.classList.remove("playing"); }
      });
      playing = best;
      if (!best) return;
      prepare(best);
      best.video.play().then(function(){
        if (ticket === version && playing === best && grimMotion.active()) best.band.classList.add("playing");
        else if (playing !== best) best.video.pause();
      }).catch(function(){
        if (ticket === version) { best.band.classList.remove("playing"); playing = null; }
      });
    }
    var near = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ scenes.forEach(function(scene){ if (scene.band === en.target) scene.near = en.isIntersecting; }); });
      update();
    },{rootMargin:"600px 0px",threshold:0});
    var visible = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ scenes.forEach(function(scene){ if (scene.band === en.target) scene.ratio = en.isIntersecting ? en.intersectionRatio : 0; }); });
      update();
    },{threshold:[0,0.05,0.25,0.5,0.75,1]});
    scenes.forEach(function(scene){ near.observe(scene.band); visible.observe(scene.band); });
    grimMotion.subscribe(update);
  })();

  // Обложки: наведение на компьютере; явная кнопка на всех устройствах.
  (function(){
    var touch = window.matchMedia("(pointer: coarse)").matches;
    var players = [];
    document.querySelectorAll("[data-live]").forEach(function(cover){
      var link = cover.closest("a") || cover;
      var img = cover.querySelector("img");
      if (!img) return;
      var stage = document.createElement("div");
      stage.className = "cover-stage" + (link.classList.contains("start-cover") ? " cover-stage--featured" : "");
      link.parentNode.insertBefore(stage,link);
      stage.appendChild(link);
      var button = document.createElement("button");
      button.className = "cover-play-toggle";
      button.type = "button";
      button.textContent = "Оживить обложку";
      button.setAttribute("aria-pressed","false");
      stage.appendChild(button);
      var v = null, broken = false, hovered = false, focused = false, manual = false;
      var playing = false, pending = false, stopped = false;
      var inView = !("IntersectionObserver" in window), version = 0;
      function wanted(){ return !broken && !stopped && grimMotion.active() && inView && (manual || (!touch && (hovered || focused))); }
      function renderButton(){
        button.disabled = !grimMotion.enabled() || pending;
        button.textContent = broken ? "Повторить видео" : (playing ? "Остановить обложку" : "Оживить обложку");
        button.setAttribute("aria-pressed",playing ? "true" : "false");
        button.title = !grimMotion.enabled() ? "Включите анимацию переключателем внизу страницы" :
          (pending ? "Видео загружается" : (broken ? "Повторить загрузку видеообложки" : (playing ? "Остановить видеообложку" : "Запустить видеообложку")));
      }
      function pausePlayback(){
        version++;
        pending = false;
        playing = false;
        if (v) { v.classList.remove("on"); v.pause(); }
        renderButton();
      }
      function fail(instance){
        if (instance !== v) return;
        version++;
        broken = true;
        stopped = true;
        manual = false;
        playing = false;
        pending = false;
        v = null;
        instance.classList.remove("on");
        instance.pause();
        instance.remove();
        renderButton();
      }
      function ensure(){
        if (v || broken) return v;
        var instance = document.createElement("video");
        v = instance;
        instance.className = "live-media";
        instance.muted = true; instance.loop = true; instance.playsInline = true;
        instance.preload = "auto";
        instance.src = cover.getAttribute("data-live");
        instance.setAttribute("aria-hidden", "true");
        instance.addEventListener("error", function(){ fail(instance); }, { once:true });
        instance.addEventListener("pause", function(){
          if (instance !== v || !instance.paused) return;
          if (pending) { version++; pending = false; }
          playing = false;
          instance.classList.remove("on");
          renderButton();
        });
        img.insertAdjacentElement("afterend", instance);
        return instance;
      }
      function update(){
        if (!grimMotion.enabled()) manual = false;
        if (!wanted()) { pausePlayback(); return; }
        if (playing || pending) { renderButton(); return; }
        var vv = ensure();
        if (!vv) { renderButton(); return; }
        var ticket = ++version;
        pending = true;
        renderButton();
        var attempt;
        try { attempt = vv.play(); }
        catch (error) { fail(vv); return; }
        Promise.resolve(attempt).then(function(){
          if (ticket !== version || vv !== v) return;
          pending = false;
          if (wanted()) { playing = true; vv.classList.add("on"); }
          else { playing = false; vv.pause(); }
          renderButton();
        }).catch(function(error){
          if (ticket !== version || vv !== v || !wanted()) return;
          pending = false;
          playing = false;
          vv.classList.remove("on");
          if (error && error.name === "AbortError") { renderButton(); return; }
          fail(vv);
        });
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            inView = en.isIntersecting;
            update();
          });
        }, { threshold:0 });
        io.observe(cover);
      }
      if (!touch) {
        link.addEventListener("pointerenter", function(){ hovered = true; update(); });
        stage.addEventListener("pointerleave", function(){ hovered = false; update(); });
        link.addEventListener("focusin", function(){ focused = true; update(); });
        stage.addEventListener("focusout", function(event){
          if (event.relatedTarget && stage.contains(event.relatedTarget)) return;
          focused = false; update();
        });
      }
      var player = {stop:function(){ manual = false; pausePlayback(); }};
      players.push(player);
      button.addEventListener("click",function(){
        if (!grimMotion.enabled() || pending) return;
        if (playing) { manual = false; stopped = true; update(); return; }
        players.forEach(function(other){ if (other !== player) other.stop(); });
        broken = false;
        stopped = false;
        manual = true;
        update();
      });
      grimMotion.subscribe(update);
    });
  })();

  // появление секций при скролле
  (function(){
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function(e){ e.classList.add("on"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function(e){ e.classList.add("reveal-ready"); io.observe(e); });
    grimMotion.subscribe(function(active){ if (!active) els.forEach(function(e){ e.classList.add("on"); }); });
  })();
