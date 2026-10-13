/* Netflix · O túnel do catálogo — rolagem, capítulos, player, som e modal de título. */
(function () {
  'use strict';

  var reduz = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var raiz = document.documentElement;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  var alto = $('#tunel'), stage = $('#stage');
  var paineis = $$('.painel');
  var NOMES = ['Abertura', 'Catálogo', 'Gêneros', 'Maratona', 'Sala'];
  var LIMITES = [0, .14, .34, .62, .8];
  var cap = -1, pj = 0, topoAlto = 0, total = 1;

  /* ---------- carregamento ---------- */
  var loader = $('#loader'), pct = $('#loaderPct'), feitos = 0;
  function passo() {
    feitos++;
    if (pct) pct.textContent = String(Math.round(feitos / 2 * 100));
    if (feitos >= 2) setTimeout(function () {
      document.body.classList.remove('carregando');
      loader.classList.add('sumiu');
      medir(); aoRolar();
      if (window.Cena) Cena.relayout();
    }, 400);
  }
  var fontes = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontes, new Promise(function (r) { setTimeout(r, 4000); })]).then(passo);
  if (document.readyState === 'complete') passo(); else window.addEventListener('load', passo, { once: true });

  /* ---------- progresso ---------- */
  function medir() {
    var r = alto.getBoundingClientRect();
    topoAlto = r.top + window.scrollY;
    total = Math.max(1, alto.offsetHeight - window.innerHeight);
  }
  var trilhoBarra = $('#trilhoBarra'), trilhoBola = $('#trilhoBola'), tempo = $('#tempo'), capNome = $('#capNome'), trilho = $('#trilho');
  var fantasma = $('#fantasma'), proxN = $('#proxN');
  var ultZona = -1;

  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function defineCap(c) {
    if (c === cap) return;
    var anterior = cap;
    cap = c;
    stage.setAttribute('data-c', String(c));
    paineis.forEach(function (p) { var on = +p.getAttribute('data-c') === c; p.classList.toggle('on', on); p.setAttribute('aria-hidden', on ? 'false' : 'true'); });
    if (capNome) capNome.textContent = NOMES[c];
    if (window.Cena) Cena.capitulo(c);
    if (anterior === 0 && c === 1 && window.SomN) SomN.golpe(.55);
    fantasma.classList.toggle('on', c >= 1 && c <= 3);
  }

  function aoRolar() {
    var y = window.scrollY - topoAlto;
    pj = clamp(y / total, 0, 1);
    var c = 0;
    for (var i = 0; i < LIMITES.length; i++) if (pj >= LIMITES[i]) c = i;
    defineCap(c);
    if (window.Cena) Cena.progresso(pj);
    if (trilhoBarra) trilhoBarra.style.transform = 'scaleX(' + pj.toFixed(4) + ')';
    if (trilhoBola) trilhoBola.style.left = (pj * 100).toFixed(2) + '%';
    if (tempo) tempo.textContent = fmt(pj * 180) + ' / 3:00';
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', function () { medir(); aoRolar(); });

  // clique no trilho: pula para aquele ponto
  if (trilho) trilho.addEventListener('click', function (e) {
    var r = trilho.getBoundingClientRect();
    var p = clamp((e.clientX - r.left) / r.width, 0, 1);
    window.scrollTo({ top: topoAlto + total * p, behavior: reduz ? 'auto' : 'smooth' });
  });
  $('#btnTopoPlayer').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduz ? 'auto' : 'smooth' }); });
  var btnTopo = $('#btnTopo');
  if (btnTopo) btnTopo.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduz ? 'auto' : 'smooth' }); });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id === '#' || id === '#tunel') { if (id === '#tunel') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduz ? 'auto' : 'smooth' }); } return; }
      var el = $(id); if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: reduz ? 'auto' : 'smooth' });
    });
  });

  /* ---------- laço leve: zona, fantasma, contagem ---------- */
  var proxT0 = performance.now();
  function laco() {
    requestAnimationFrame(laco);
    if (!window.Cena) return;
    var z = Cena.zona();
    if (z.i !== ultZona) {
      ultZona = z.i;
      fantasma.textContent = z.nome.toUpperCase();
    }
    raiz.style.setProperty('--zona', Math.round(z.cor[0]) + ',' + Math.round(z.cor[1]) + ',' + Math.round(z.cor[2]));
    if (cap === 3 && proxN) proxN.textContent = String(5 - (Math.floor((performance.now() - proxT0) / 1000) % 5));
    if (window.SomN) SomN.atualiza(Cena.velocidade());
  }
  requestAnimationFrame(laco);

  /* ---------- som sintetizado ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, ruidoGain = null, ruidoFiltro = null, ligado = false;
  window.SomN = {
    suportado: !!AC,
    ligado: function () { return ligado; },
    alternar: function () {
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        var n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), b = 0;
        for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b = (b + .04 * w) / 1.04; d[i] = b * 3.2; }  // ruído rosa/marrom
        var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        ruidoFiltro = ctx.createBiquadFilter(); ruidoFiltro.type = 'bandpass'; ruidoFiltro.frequency.value = 260; ruidoFiltro.Q.value = .8;
        ruidoGain = ctx.createGain(); ruidoGain.gain.value = 0;
        src.connect(ruidoFiltro); ruidoFiltro.connect(ruidoGain); ruidoGain.connect(master); src.start();
        // zumbido grave da sala
        [55, 55.6].forEach(function (f) {
          var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = .07;
          o.connect(g); g.connect(master); o.start();
        });
      }
      if (ctx.state === 'suspended') ctx.resume();
      ligado = !ligado;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(ligado ? .8 : 0, ctx.currentTime, .2);
      return ligado;
    },
    atualiza: function (v) {
      if (!ctx || !ligado) return;
      var k = clamp(v / 18, 0, 1);
      ruidoGain.gain.setTargetAtTime(.04 + k * .5, ctx.currentTime, .12);
      ruidoFiltro.frequency.setTargetAtTime(220 + k * 1500, ctx.currentTime, .15);
    },
    golpe: function (vol) {
      if (!ctx || !ligado) return;
      var t = ctx.currentTime, v = vol || 1;
      [[62, 0, .9], [93, .11, .7]].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(p[0] * 1.8, t + p[1]); o.frequency.exponentialRampToValueAtTime(p[0], t + p[1] + .25);
        g.gain.setValueAtTime(0.0001, t + p[1]); g.gain.linearRampToValueAtTime(.9 * v, t + p[1] + .02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p[1] + p[2] + .5);
        o.connect(g); g.connect(master); o.start(t + p[1]); o.stop(t + p[1] + p[2] + .6);
      });
      var n = ctx.sampleRate * .8, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      var s = ctx.createBufferSource(); s.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
      var g2 = ctx.createGain(); g2.gain.value = .25 * v;
      s.connect(hp); hp.connect(g2); g2.connect(master); s.start(t + .05);
    }
  };
  var btnSom = $('#btnSom');
  function atualizaBtnSom() {
    var on = window.SomN && SomN.ligado();
    btnSom.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('.btn-som-txt', btnSom).textContent = on ? 'Som ligado' : 'Som';
    btnSom.title = on ? 'Desligar o som (M)' : 'Ligar o som (M)';
  }
  if (btnSom) {
    if (!SomN.suportado) btnSom.hidden = true;
    btnSom.addEventListener('click', function () { SomN.alternar(); atualizaBtnSom(); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M') { SomN.alternar(); atualizaBtnSom(); }
    if (e.key === 'Escape' && !$('#modal').hidden) fechar();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && SomN.ligado()) { SomN.alternar(); atualizaBtnSom(); }
  });

  /* ---------- modal do título ---------- */
  var modal = $('#modal'), ficha = $('#mFicha'), telaM = $('#mTela'), cvAb = $('#mAbertura');
  var atual = null, seqRaf = 0;
  var ultimoFoco = null;

  window.abrirTitulo = function (it) {
    atual = it;
    ultimoFoco = document.activeElement;
    $('#mGenero').textContent = it.zonaNome;
    $('#mTitulo').textContent = it.titulo;
    $('#mTag').textContent = it.tag;
    $('#mSin').textContent = it.sin;
    $('#mMeta').textContent = it.meta;
    var pc = $('#mPoster').getContext('2d');
    pc.clearRect(0, 0, 512, 768); pc.drawImage(it.canvas, 0, 0);
    raiz.style.setProperty('--zona', it.cor.join(','));
    ficha.hidden = false; telaM.hidden = true;
    modal.hidden = false;
    document.body.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('on'); $('#mFechar').focus(); });
    if (window.SomN) SomN.golpe(.35);
  };
  function fechar() {
    cancelAnimationFrame(seqRaf);
    modal.classList.remove('on');
    document.body.classList.remove('modal-aberto');
    document.body.style.overflow = '';
    setTimeout(function () { modal.hidden = true; }, 350);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  $('#mFechar').addEventListener('click', fechar);
  $('#mVoltar').addEventListener('click', fechar);
  modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
  $('#mSair').addEventListener('click', function () { cancelAnimationFrame(seqRaf); ficha.hidden = false; telaM.hidden = true; });

  var FT = '"Bebas Neue", Impact, sans-serif', FS = '"Manrope", system-ui, sans-serif';
  var golpeDado = false;
  function sequencia(it) {
    var c = cvAb.getContext('2d'), w = 1280, h = 720, t0 = performance.now();
    golpeDado = false;
    function quadro(agora) {
      var t = (agora - t0) / 1000, z = it.cor;
      c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
      // 1) risco de luz cresce
      var a = clamp((t - .6) / 1.0, 0, 1), ae = ease(a);
      var abre = clamp((t - 1.6) / 1.1, 0, 1), be = ease(abre);
      var gz = 'rgba(' + z[0] + ',' + z[1] + ',' + z[2] + ',';
      if (t > .6) {
        var altura = 3 + be * h * .9;
        var g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .55);
        g.addColorStop(0, gz + (.55 * be) + ')'); g.addColorStop(1, gz + '0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        var lg = c.createLinearGradient(0, h / 2 - altura / 2, 0, h / 2 + altura / 2);
        lg.addColorStop(0, gz + '0)'); lg.addColorStop(.5, 'rgba(255,255,255,' + (1 - be * .5) + ')'); lg.addColorStop(1, gz + '0)');
        c.fillStyle = lg; var larg = w * ae; c.fillRect(w / 2 - larg / 2, h / 2 - altura / 2, larg, altura);
      }
      // 2) o golpe e o título
      if (t > 2.2 && !golpeDado) { golpeDado = true; if (window.SomN) SomN.golpe(1); }
      var tt = clamp((t - 2.4) / 2.2, 0, 1);
      if (tt > 0) {
        var letras = it.titulo.split(''), tam = it.titulo.length > 12 ? 150 : 200;
        c.font = '400 ' + tam + 'px ' + FT; c.textBaseline = 'middle';
        var larguras = letras.map(function (ch) { return c.measureText(ch).width + 10; });
        var soma = larguras.reduce(function (s, v) { return s + v; }, 0) - 10;
        var x = w / 2 - soma / 2;
        c.save(); c.shadowColor = gz + '1)'; c.shadowBlur = 40 * (1 - tt) + 14;
        letras.forEach(function (ch, i) {
          var d = clamp(tt * 1.6 - i / letras.length * .6, 0, 1);
          c.globalAlpha = d; c.fillStyle = '#fff';
          c.fillText(ch, x, h / 2 + (1 - ease(d)) * 40);
          x += larguras[i];
        });
        c.restore(); c.globalAlpha = 1;
      }
      // 3) frase final
      var f = clamp((t - 5.2) / .9, 0, 1);
      if (f > 0) {
        c.globalAlpha = f; c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '600 30px ' + FS; c.textAlign = 'center';
        c.fillText(it.tag, w / 2, h / 2 + 150);
        c.font = '700 18px ' + FS; c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText('ABERTURA DE CONCEITO · TÍTULO FICTÍCIO', w / 2, h / 2 + 200);
        c.globalAlpha = 1; c.textAlign = 'left';
      }
      // grão
      for (var i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + Math.random() * .08 + ')'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      if (t < 8) seqRaf = requestAnimationFrame(quadro);
    }
    seqRaf = requestAnimationFrame(quadro);
  }
  $('#mAssistir').addEventListener('click', function () {
    if (!atual) return;
    ficha.hidden = true; telaM.hidden = false;
    sequencia(atual);
  });

  /* ---------- início ---------- */
  medir(); aoRolar(); defineCap(0);
})();
