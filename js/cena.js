/* Cena 3D do túnel do catálogo (WebGL / Three.js r128).
   Tudo é gerado em código: os pôsteres são pintados em canvas 2D, nenhum título real existe aqui.
   API: Cena.progresso(p) · .capitulo(c) · .info(i) · .zona() · .velocidade() · .pronto() */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') { document.documentElement.classList.add('sem-webgl'); return; }

  var canvas = document.getElementById('gl');
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('sem-webgl'); return; }

  var reduz = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var pequeno = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pequeno ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 1);

  var scene = new THREE.Scene();
  var fog = new THREE.FogExp2(0x010000, .056);
  scene.fog = fog;
  var camera = new THREE.PerspectiveCamera(50, 1, .1, 160);

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- dados fictícios ---------- */
  var ZONAS = [
    { id: 'acao',   nome: 'Ação',        cor: [255, 112, 32] },
    { id: 'terror', nome: 'Terror',      cor: [44, 214, 170] },
    { id: 'romance',nome: 'Romance',     cor: [255, 92, 156] },
    { id: 'ficcao', nome: 'Ficção',      cor: [64, 150, 255] },
    { id: 'comedia',nome: 'Comédia',     cor: [255, 206, 44] },
    { id: 'doc',    nome: 'Documentário',cor: [244, 176, 96] }
  ];
  var TITULOS = [
    [['ÚLTIMA PONTE', 'Uma cidade. Sessenta minutos.', 'Quando a única ponte da cidade é sabotada, uma engenheira tem uma hora para impedir o colapso.', 'Filme · 1h 52min · 14+'],
     ['ROTA ZERO', 'Não existe volta.', 'Um ex-piloto aceita um último trabalho que atravessa três fronteiras em uma só noite.', 'Série · 8 episódios · 16+'],
     ['FOGO CRUZADO', 'Todo lado tem um dono.', 'No meio de uma guerra de bairros, uma enfermeira descobre que o socorro também tem preço.', 'Filme · 2h 04min · 16+'],
     ['CONTRA O RELÓGIO', 'Cada segundo cobra juros.', 'Um motorista de ambulância tem dez minutos para atravessar uma cidade em greve com um paciente que sabe demais.', 'Filme · 1h 46min · 14+'],
     ['LINHA DE TIRO', 'Quem dispara primeiro perde.', 'Uma atiradora aposentada é chamada para proteger uma testemunha durante uma única madrugada.', 'Filme · 1h 58min · 16+'],
     ['RESGATE NO GELO', 'Sem sinal. Sem volta.', 'Uma equipe de resgate cruza um lago congelado para chegar a uma estação que parou de responder.', 'Série · 7 episódios · 14+']],
    [['A CASA DO VENTO', 'Algo aprendeu o seu nome.', 'Uma família se muda para uma casa de fazenda onde todas as portas se abrem sozinhas à noite.', 'Série · 6 episódios · 16+'],
     ['SUSSURRO', 'Não responda.', 'Uma operadora de rádio recebe, todas as madrugadas, a voz de alguém que ainda não nasceu.', 'Filme · 1h 38min · 16+'],
     ['NOITE SEM ECO', 'O silêncio também assusta.', 'Em uma vila isolada, o som desaparece toda sexta-feira às três da manhã.', 'Série · 5 episódios · 18+'],
     ['ÚLTIMO ANDAR', 'Alguém ainda mora aqui.', 'Um zelador percebe que o elevador sempre para em um andar que não existe no prédio.', 'Filme · 1h 33min · 16+'],
     ['A FESTA DOS OUTROS', 'Você foi convidado.', 'Um jantar de reencontro termina quando todos percebem que ninguém lembra de ter convidado o anfitrião.', 'Série · 6 episódios · 16+'],
     ['PORÃO 13', 'Não desça sozinho.', 'Três irmãos herdam uma casa e um porão que ganha um degrau a mais a cada visita.', 'Filme · 1h 44min · 16+']],
    [['ENTRE MARÉS', 'Dois verões, uma praia.', 'Uma bióloga marinha e um pescador se reencontram quando a maré muda o mapa da cidade.', 'Filme · 1h 47min · Livre'],
     ['CARTAS DE MARÇO', 'Ainda dá tempo.', 'Vinte cartas nunca enviadas chegam, de uma vez, à porta de quem as escreveu.', 'Série · 10 episódios · 12+'],
     ['QUASE VERÃO', 'Todo começo é um quase.', 'Três amigos tentam fazer a última viagem da juventude antes do casamento de um deles.', 'Filme · 1h 41min · 12+'],
     ['CHUVA DE VERÃO', 'Ficar também é um jeito.', 'Dois vizinhos presos pela enchente descobrem que dividem o mesmo piano, em horários diferentes.', 'Filme · 1h 39min · Livre'],
     ['TREM PARA O MAR', 'Alguém vai ficar.', 'Um maquinista e uma fotógrafa cruzam o país no último trem de passageiros antes de ele ser desativado.', 'Série · 8 episódios · 12+'],
     ['ENDEREÇO ERRADO', 'Chegou para você.', 'Uma entregadora recebe, todo mês, o mesmo bilhete de um desconhecido que mora no endereço errado.', 'Filme · 1h 35min · Livre']],
    [['ÓRBITA FRIA', 'A Terra ficou para trás.', 'Uma tripulação de seis precisa decidir quem volta quando o combustível só chega para quatro.', 'Filme · 2h 11min · 14+'],
     ['CIDADE ESPELHO', 'Lá também tem você.', 'Uma arquiteta descobre que a cidade foi construída duas vezes, e a outra ainda está habitada.', 'Série · 8 episódios · 14+'],
     ['PROTOCOLO LUA', 'Nada pode sair do plano.', 'Na primeira base lunar permanente, uma falha de rotina vira um segredo de Estado.', 'Série · 6 episódios · 12+'],
     ['MAR DE VIDRO', 'Debaixo da Terra, outra Terra.', 'Mergulhadores descobrem que o fundo do oceano reflete uma cidade que ainda não foi construída.', 'Série · 8 episódios · 14+'],
     ['DIA 400', 'Ninguém contou o resto.', 'Uma astronauta volta de uma missão de 400 dias e encontra uma Terra onde só passaram quatro.', 'Filme · 2h 03min · 12+'],
     ['SINAL AZUL', 'Chegou antes de partir.', 'Uma radioastrônoma recebe uma mensagem com a própria voz, datada de daqui a dez anos.', 'Série · 6 episódios · 14+']],
    [['CASA DE TODO MUNDO', 'Cabe mais um.', 'Uma família que nunca fecha a porta vê a casa virar república, ateliê e, às vezes, hospital.', 'Série · 12 episódios · Livre'],
     ['PLANTÃO DO CAOS', 'Ninguém sabe o que faz.', 'Um pronto-socorro de interior onde o médico mais experiente é o porteiro.', 'Série · 10 episódios · 12+'],
     ['SEM FILTRO', 'Dizer a verdade custa caro.', 'Depois de um acidente, uma influenciadora perde a capacidade de mentir. Em todas as redes.', 'Filme · 1h 36min · 12+'],
     ['GENTE DEMAIS', 'Um convite virou duzentos.', 'Um aniversário de criança ganha vida própria depois que o grupo da família decide ajudar.', 'Filme · 1h 32min · Livre'],
     ['MUDANÇA DE PLANOS', 'O voo era só o começo.', 'Dois irmãos que se odeiam tentam chegar ao casamento da mãe com uma única mala e nenhuma conexão.', 'Filme · 1h 40min · 12+'],
     ['O SÍNDICO', 'Reunião às 20h. Sem falta.', 'Um síndico acidental tenta resolver, em um único prédio, todos os problemas do planeta.', 'Série · 10 episódios · Livre']],
    [['RIOS DO SERTÃO', 'A água que o mapa esqueceu.', 'Uma expedição segue rios temporários que aparecem uma única vez a cada década.', 'Documentário · 1h 28min · Livre'],
     ['A ÚLTIMA SAFRA', 'Quem planta ainda espera.', 'Três famílias de cafeicultores contam um ano inteiro, da flor à xícara.', 'Documentário · 6 episódios · Livre'],
     ['LUZ DE JANEIRO', 'Cidades vistas de cima.', 'Um fotógrafo sobrevoa dez cidades pequenas sempre no primeiro nascer do sol do ano.', 'Documentário · 1h 15min · Livre'],
     ['CHÃO DE BARRO', 'O que uma casa guarda.', 'Seis famílias reconstroem, com as próprias mãos, as casas levadas pela última cheia do rio.', 'Documentário · 5 episódios · Livre'],
     ['VOZES DA FEIRA', 'Todo balcão tem uma história.', 'Uma câmera fixa em uma feira livre registra, madrugada após madrugada, a cidade que acorda cedo.', 'Documentário · 1h 22min · Livre'],
     ['O MESTRE DO RIO', 'Navegar é lembrar.', 'O último barqueiro de uma travessia centenária ensina o ofício a quem nunca viu o rio.', 'Documentário · 1h 31min · Livre']]
  ];
  var TOTAL = 36;
  var info = [];   // por título 0..17
  TITULOS.forEach(function (zs, z) {
    zs.forEach(function (t, k) {
      info.push({ idx: z * 6 + k, zona: z, zonaNome: ZONAS[z].nome, cor: ZONAS[z].cor, titulo: t[0], tag: t[1], sin: t[2], meta: t[3], canvas: null, tex: null });
    });
  });

  /* ---------- pôsteres pintados em código ---------- */
  var PW = 512, PH = 768;
  var FONTE_T = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
  var FONTE_S = '"Manrope", system-ui, sans-serif';

  function grad(ctx, stops, x0, y0, x1, y1) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function arvore(ctx, x, y, len, ang, d, r) {
    if (d <= 0 || len < 4) return;
    var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.lineWidth = d * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    arvore(ctx, x2, y2, len * (.68 + r() * .12), ang - .42 - r() * .25, d - 1, r);
    arvore(ctx, x2, y2, len * (.68 + r() * .12), ang + .38 + r() * .3, d - 1, r);
  }
  var PINTORES = {
    acao: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#0d0508'], [.5, '#7a1d0c'], [1, '#ff8a1f']], 0, 0, 0, h); c.fillRect(0, 0, w, h);
      var sg = c.createRadialGradient(w * .5, h * .5, 10, w * .5, h * .5, 230);
      sg.addColorStop(0, 'rgba(255,240,190,1)'); sg.addColorStop(.35, 'rgba(255,170,60,.85)'); sg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = sg; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.12)';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(110, 0); c.lineTo(w * .5, h * .5); c.fill();
      c.beginPath(); c.moveTo(w, 0); c.lineTo(w - 110, 0); c.lineTo(w * .5, h * .5); c.fill();
      c.fillStyle = '#050204';
      for (var x = -10; x < w; x += 30) { var bh = h * (.12 + r() * .28); c.fillRect(x, h * .8 - bh, 30 + r() * 6, bh + h * .3); }
      c.fillStyle = 'rgba(255,170,70,.9)';
      for (var i = 0; i < 70; i++) c.fillRect(r() * w, h * .56 + r() * h * .24, 3, 4);
      c.fillStyle = '#050204'; // figura
      c.beginPath(); c.arc(w * .5, h * .56, 12, 0, 6.2832); c.fill();
      c.beginPath(); c.moveTo(w * .5 - 16, h * .8); c.lineTo(w * .5 - 8, h * .58); c.lineTo(w * .5 + 8, h * .58); c.lineTo(w * .5 + 16, h * .8); c.fill();
    },
    terror: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#010607'], [.55, '#0b2a28'], [1, '#02100f']], 0, 0, 0, h); c.fillRect(0, 0, w, h);
      var mg = c.createRadialGradient(w * .7, h * .22, 4, w * .7, h * .22, 150);
      mg.addColorStop(0, 'rgba(230,255,246,.95)'); mg.addColorStop(.25, 'rgba(120,230,200,.35)'); mg.addColorStop(1, 'rgba(60,200,160,0)');
      c.fillStyle = mg; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e9fff8'; c.beginPath(); c.arc(w * .7, h * .22, 44, 0, 6.2832); c.fill();
      c.strokeStyle = '#010404'; c.lineCap = 'round';
      arvore(c, w * .22, h * .82, 120, -Math.PI / 2 + .1, 8, r);
      arvore(c, w * .86, h * .84, 90, -Math.PI / 2 - .15, 6, r);
      c.fillStyle = '#010404'; c.fillRect(w * .42, h * .62, 120, 90);
      c.beginPath(); c.moveTo(w * .42 - 14, h * .62); c.lineTo(w * .42 + 60, h * .62 - 50); c.lineTo(w * .42 + 134, h * .62); c.fill();
      c.fillStyle = '#ffd36a'; c.fillRect(w * .42 + 70, h * .62 + 24, 18, 24);
      for (var i = 0; i < 4; i++) { c.fillStyle = 'rgba(160,230,210,' + (.07 + i * .02) + ')'; c.fillRect(0, h * (.62 + i * .08), w, 60); }
    },
    romance: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#22092b'], [.5, '#c13a74'], [1, '#ffb88d']], 0, 0, 0, h); c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,220,180,.85)'; c.beginPath(); c.arc(w * .4, h * .42, 130, 0, 6.2832); c.fill();
      c.fillStyle = 'rgba(255,90,150,.55)'; c.beginPath(); c.arc(w * .6, h * .46, 130, 0, 6.2832); c.fill();
      for (var k = 0; k < 5; k++) {
        c.fillStyle = 'rgba(' + (120 - k * 14) + ',' + (20 + k * 4) + ',' + (60 + k * 10) + ',.55)';
        c.beginPath(); c.moveTo(0, h);
        for (var x = 0; x <= w; x += 8) c.lineTo(x, h * (.7 + k * .05) + Math.sin(x * .02 + k) * 14);
        c.lineTo(w, h); c.fill();
      }
      for (var i = 0; i < 18; i++) {
        c.save(); c.translate(r() * w, r() * h * .8); c.rotate(r() * 6); c.fillStyle = 'rgba(255,200,215,' + (.3 + r() * .5) + ')';
        c.beginPath(); c.ellipse(0, 0, 8 + r() * 8, 4 + r() * 4, 0, 0, 6.2832); c.fill(); c.restore();
      }
    },
    ficcao: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#01030c'], [.55, '#13248a'], [1, '#08c6ff']], 0, 0, 0, h); c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff';
      for (var i = 0; i < 90; i++) { c.globalAlpha = .3 + r() * .7; c.fillRect(r() * w, r() * h * .7, 2, 2); }
      c.globalAlpha = 1;
      var pg = c.createRadialGradient(w * .42, h * .36, 10, w * .5, h * .4, 130);
      pg.addColorStop(0, '#9fd6ff'); pg.addColorStop(.6, '#3066d8'); pg.addColorStop(1, '#0b1850');
      c.fillStyle = pg; c.beginPath(); c.arc(w * .5, h * .4, 120, 0, 6.2832); c.fill();
      c.strokeStyle = 'rgba(200,235,255,.8)'; c.lineWidth = 6;
      c.beginPath(); c.ellipse(w * .5, h * .4, 220, 46, -.28, 0, 6.2832); c.stroke();
      c.strokeStyle = 'rgba(0,230,255,.55)'; c.lineWidth = 2;
      for (var j = 0; j < 12; j++) { var yy = h * .72 + Math.pow(j / 12, 2) * h * .28; c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke(); }
      for (var k = -8; k <= 8; k++) { c.beginPath(); c.moveTo(w * .5 + k * 8, h * .72); c.lineTo(w * .5 + k * 90, h); c.stroke(); }
    },
    comedia: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#ffd23a'], [1, '#ff7a1c']], 0, 0, w, h); c.fillRect(0, 0, w, h);
      var cores = ['#ff3d71', '#2f6bff', '#ffffff', '#12c2a2', '#8a3dff'];
      for (var i = 0; i < 16; i++) {
        c.fillStyle = cores[i % cores.length]; c.strokeStyle = '#1a1030'; c.lineWidth = 5;
        var x = r() * w, y = r() * h * .75, s = 30 + r() * 60;
        c.beginPath();
        if (i % 3 === 0) c.arc(x, y, s / 2, 0, 6.2832);
        else if (i % 3 === 1) { c.moveTo(x, y - s / 2); c.lineTo(x + s / 2, y + s / 2); c.lineTo(x - s / 2, y + s / 2); c.closePath(); }
        else c.rect(x - s / 2, y - s / 3, s, s * .66);
        c.fill(); c.stroke();
      }
      c.fillStyle = '#fff'; c.strokeStyle = '#1a1030'; c.lineWidth = 8;
      c.beginPath(); c.arc(w * .5, h * .42, 130, 0, 6.2832); c.fill(); c.stroke();
      c.fillStyle = '#1a1030';
      c.beginPath(); c.arc(w * .5 - 44, h * .42 - 26, 14, 0, 6.2832); c.fill();
      c.beginPath(); c.arc(w * .5 + 44, h * .42 - 26, 14, 0, 6.2832); c.fill();
      c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.arc(w * .5, h * .42 + 6, 70, .2, Math.PI - .2); c.stroke();
    },
    doc: function (c, w, h, r) {
      c.fillStyle = grad(c, [[0, '#241810'], [.5, '#b3702f'], [1, '#f6d9a2']], 0, 0, 0, h); c.fillRect(0, 0, w, h);
      var sg = c.createRadialGradient(w * .5, h * .4, 4, w * .5, h * .4, 140);
      sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(.4, 'rgba(255,214,130,.8)'); sg.addColorStop(1, 'rgba(255,170,70,0)');
      c.fillStyle = sg; c.fillRect(0, 0, w, h);
      var cs = ['#5a3a20', '#7d5230', '#a8723f'];
      for (var k = 0; k < 3; k++) {
        c.fillStyle = cs[k]; c.beginPath(); c.moveTo(0, h);
        var base = h * (.5 + k * .1);
        for (var x = 0; x <= w; x += 16) c.lineTo(x, base - Math.abs(Math.sin(x * .011 + k * 2.1)) * 90 - r() * 8);
        c.lineTo(w, h); c.fill();
      }
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * .46, h * .72);
      c.bezierCurveTo(w * .3, h * .8, w * .7, h * .86, w * .5, h);
      c.stroke();
      c.strokeStyle = '#1b120a'; c.lineWidth = 3;
      for (var b = 0; b < 5; b++) { var bx = r() * w, by = h * .2 + r() * h * .2; c.beginPath(); c.moveTo(bx - 8, by); c.lineTo(bx, by + 6); c.lineTo(bx + 8, by); c.stroke(); }
    }
  };

  function espacado(c, txt, x, y, sp, centro) {
    var larg = 0, i;
    for (i = 0; i < txt.length; i++) larg += c.measureText(txt[i]).width + sp;
    larg -= sp;
    var xx = centro ? x - larg / 2 : x, alin = c.textAlign;
    c.textAlign = 'left';
    for (i = 0; i < txt.length; i++) { c.fillText(txt[i], xx, y); xx += c.measureText(txt[i]).width + sp; }
    c.textAlign = alin;
  }
  function pintaPoster(it) {
    var cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
    var c = cv.getContext('2d'), z = ZONAS[it.zona];
    var rnd = mulberry(it.idx * 977 + 13);
    var base = document.createElement('canvas'); base.width = PW; base.height = PH;
    PINTORES[z.id](base.getContext('2d'), PW, PH, rnd);
    var kv = it.idx % 6, HUE = [0, 16, -18, 30, -28, 9][kv];
    c.save();
    if (kv % 2) { c.translate(PW, 0); c.scale(-1, 1); }
    if (HUE) c.filter = 'hue-rotate(' + HUE + 'deg) saturate(1.08)';
    c.drawImage(base, 0, 0);
    c.restore(); c.filter = 'none';
    // grão
    for (var i = 0; i < 700; i++) { c.fillStyle = 'rgba(255,255,255,' + (rnd() * .07) + ')'; c.fillRect(rnd() * PW, rnd() * PH, 2, 2); }
    // degradê de leitura
    c.fillStyle = grad(c, [[0, 'rgba(0,0,0,0)'], [.55, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,.92)']], 0, PH * .5, 0, PH); c.fillRect(0, PH * .5, PW, PH * .5);
    c.fillStyle = grad(c, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']], 0, 0, 0, 110); c.fillRect(0, 0, PW, 110);
    // selo
    c.fillStyle = '#e50914'; c.fillRect(26, 26, 8, 40);
    c.fillStyle = '#fff'; c.font = '800 20px ' + FONTE_S; c.textAlign = 'left';
    espacado(c, (it.meta.indexOf('Filme') === 0 ? 'FILME' : (it.meta.indexOf('Docu') === 0 ? 'DOCUMENTÁRIO' : 'SÉRIE')), 46, 54, 4, false);
    // título
    var palavras = it.titulo.split(' '), l1 = it.titulo, l2 = '';
    if (it.titulo.length > 11 && palavras.length > 1) {
      var m = Math.ceil(palavras.length / 2); l1 = palavras.slice(0, m).join(' '); l2 = palavras.slice(m).join(' ');
    }
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '400 104px ' + FONTE_T;
    c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 18;
    if (l2) { espacado(c, l1, PW / 2, PH - 214, 5, true); espacado(c, l2, PW / 2, PH - 118, 5, true); }
    else { espacado(c, l1, PW / 2, PH - 150, 5, true); }
    c.shadowBlur = 0;
    c.font = '600 22px ' + FONTE_S; c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillText(it.tag, PW / 2, PH - 62);
    c.font = '700 13px ' + FONTE_S; c.fillStyle = 'rgba(255,255,255,.5)';
    espacado(c, 'CONCEITO · FICTÍCIO', PW / 2, PH - 26, 4, true);
    it.canvas = cv;
    if (pequeno) {
      if (!it.texCanvas) it.texCanvas = document.createElement('canvas');
      it.texCanvas.width = 320; it.texCanvas.height = 480;
      it.texCanvas.getContext('2d').drawImage(cv, 0, 0, 320, 480);
    } else it.texCanvas = cv;
    if (it.tex) it.tex.needsUpdate = true;
  }
  info.forEach(function (it) {
    pintaPoster(it);
    it.tex = new THREE.CanvasTexture(it.texCanvas);
    it.tex.encoding = THREE.sRGBEncoding;
    it.tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    it.mat = new THREE.MeshBasicMaterial({ map: it.tex });
    it.matRef = new THREE.MeshBasicMaterial({ map: it.tex, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false });
  });
  // repinta quando a fonte chegar
  function repinta() { info.forEach(pintaPoster); }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('104px "Bebas Neue"'), document.fonts.load('600 22px "Manrope"')]).then(repinta, function () {});
  }

  /* ---------- o túnel ---------- */
  var ZLEN = 18, NZ = 6, ZL = ZLEN * NZ, PASSOS = pequeno ? 7 : 10, ESP = ZLEN / PASSOS;
  var geoP = new THREE.PlaneGeometry(1.5, 2.25);
  var posters = [];
  var tunel = new THREE.Group(); scene.add(tunel);

  for (var z = 0; z < NZ; z++) {
    for (var i = 0; i < PASSOS; i++) {
      var zpos = -(z * ZLEN + i * ESP + ESP / 2);
      for (var lado = -1; lado <= 1; lado += 2) {
        for (var fila = 0; fila < 2; fila++) {
          var k = (i * 2 + fila * 3 + (lado > 0 ? 1 : 0) + z) % 6;
          var it = info[z * 6 + k];
          var m = new THREE.Mesh(geoP, it.mat);
          m.position.set(lado * 3.7, fila ? -1.35 : 1.35, zpos);
          m.rotation.y = lado * (-Math.PI / 2 + .8);
          m.userData = { it: it, base: 1, alvo: 1, wz: zpos, lado: lado, p0: m.position.clone(), lift: 0 };
          tunel.add(m); posters.push(m);
          if (fila) {
            var rf = new THREE.Mesh(geoP, it.matRef);
            rf.position.set(lado * 3.7, -5.45, zpos); rf.rotation.y = m.rotation.y; rf.scale.y = -1;
            m.userData.ref = rf; tunel.add(rf);
          }
        }
      }
    }
  }
  // paredes, chão e teto
  var matParede = new THREE.MeshBasicMaterial({ color: 0x000000 });
  var TLEN = ZL + 34, TZ = .5 - TLEN / 2;
  var paredeGeo = new THREE.PlaneGeometry(TLEN, 8);
  var paredes = [], tiras = [];
  [-1, 1].forEach(function (l) {
    var p = new THREE.Mesh(paredeGeo, matParede); paredes.push([p, l * 3.8]);
    p.position.set(l * 3.8, 0, TZ); p.rotation.y = -l * Math.PI / 2; scene.add(p);
  });
  var chaoGeo = new THREE.PlaneGeometry(8, TLEN);
  [3.4].forEach(function (y) {
    var p = new THREE.Mesh(chaoGeo, matParede);
    p.position.set(0, y, TZ); p.rotation.x = y < 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(p);
  });
  // tiras de luz (cor da zona)
  var matTira = new THREE.MeshBasicMaterial({ color: 0xe50914, fog: false });
  var tiraGeo = new THREE.BoxGeometry(.07, .07, TLEN);
  [[-2.9, -3.3], [2.9, -3.3], [-2.9, 3.3], [2.9, 3.3], [-3.76, 0], [3.76, 0]].forEach(function (pp) {
    var t = new THREE.Mesh(tiraGeo, matTira); t.position.set(pp[0], pp[1], TZ); scene.add(t); tiras.push([t, pp[0]]);
  });

  // poeira
  var ND = pequeno ? 700 : 1500, dPos = new Float32Array(ND * 3);
  for (var d = 0; d < ND; d++) { dPos[d * 3] = (Math.random() - .5) * 7; dPos[d * 3 + 1] = (Math.random() - .5) * 6; dPos[d * 3 + 2] = 2 - Math.random() * (ZL + 8); }
  var dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  var poeira = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .035, transparent: true, opacity: .55, depthWrite: false }));
  scene.add(poeira);

  /* ---------- cortinas e risco de luz (abertura) ---------- */
  var matCortina = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  var cortS = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), matCortina); cortS.position.set(0, 12, .6);
  var cortI = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), matCortina); cortI.position.set(0, -12, .6);
  scene.add(cortS); scene.add(cortI);
  function texRadial(c0, c1) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  var risco = new THREE.Mesh(new THREE.PlaneGeometry(14, .07),
    new THREE.MeshBasicMaterial({ color: 0xff3a3a, blending: THREE.AdditiveBlending, transparent: true, fog: false, depthWrite: false }));
  risco.position.set(0, 0, .62); scene.add(risco);
  var brilhoRisco = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texRadial('rgba(255,70,70,.9)', 'rgba(255,20,20,0)'), blending: THREE.AdditiveBlending, transparent: true, fog: false, depthWrite: false }));
  brilhoRisco.position.set(0, 0, .64); brilhoRisco.scale.set(16, 3.4, 1); scene.add(brilhoRisco);

  /* ---------- sala final: tela e destaques ---------- */
  var sala = new THREE.Group(); sala.position.z = -ZL; scene.add(sala);
  var cvTela = document.createElement('canvas'); cvTela.width = 960; cvTela.height = 540;
  var texTela = new THREE.CanvasTexture(cvTela); texTela.encoding = THREE.sRGBEncoding;
  var tela = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 5.85), new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }));
  tela.position.set(0, .55, -11); sala.add(tela);
  tela.userData = { tela: true };
  var moldura = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 6.25), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  moldura.position.set(0, .55, -11.02); sala.add(moldura);
  var DEST = [1, 8, 15, 22, 29];   // títulos em destaque (índices)
  var destaques = [];
  DEST.forEach(function (idx, n) {
    var it = info[idx];
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.55), it.mat);
    var u = (n - 2);
    m.position.set(u * 2.1, -.5 + Math.abs(u) * .12, -5.4 - Math.abs(u) * .5);
    m.rotation.y = -u * .22;
    m.userData = { it: it, base: 1, alvo: 1, wz: -ZL + m.position.z, xs: m.position.x };
    sala.add(m); destaques.push(m); posters.push(m);
  });
  var luzSala = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texRadial('rgba(229,9,20,.55)', 'rgba(229,9,20,0)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  luzSala.position.set(0, .2, -10.5); luzSala.scale.set(22, 12, 1); sala.add(luzSala);

  function pintaTela(t, cap) {
    var c = cvTela.getContext('2d'), w = 960, h = 540;
    var n = Math.floor(t / 4) % DEST.length, it = info[DEST[n]];
    var f = (t % 4) / 4;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    // arte do título esticada, com zoom lento
    var s = 1.05 + f * .08;
    c.save(); c.translate(w * .7, h / 2); c.scale(s, s);
    c.globalAlpha = .85; c.drawImage(it.canvas, -h * .33, -h * .5, h * .66, h); c.restore();
    c.globalAlpha = 1;
    var g = c.createLinearGradient(0, 0, w * .75, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    var a = Math.min(1, f * 5) * Math.min(1, (1 - f) * 6);
    c.globalAlpha = a;
    c.fillStyle = '#e50914'; c.fillRect(48, 76, 8, 30);
    c.fillStyle = '#fff'; c.font = '800 22px ' + FONTE_S; c.textAlign = 'left';
    c.fillText('EM CARTAZ · ' + it.zonaNome.toUpperCase(), 68, 100);
    c.font = '400 104px ' + FONTE_T; c.fillText(it.titulo, 48, 230);
    c.font = '500 26px ' + FONTE_S; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(it.tag, 52, 280);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(52, 330, 190, 58, 6) : c.rect(52, 330, 190, 58); c.fill();
    c.fillStyle = '#000'; c.font = '800 24px ' + FONTE_S; c.fillText('▶  Assistir', 84, 368);
    c.globalAlpha = 1;
    texTela.needsUpdate = true;
  }


  /* ---------- portais de zona (anéis de luz) ---------- */
  var gates = [];
  (function () {
    var hb = new THREE.BoxGeometry(5.9, .05, .05), vb = new THREE.BoxGeometry(.05, 6.7, .05);
    for (var g = 0; g < NZ; g++) {
      var gr = new THREE.Group(), mt = new THREE.MeshBasicMaterial({ color: 0xffffff });
      var a = new THREE.Mesh(hb, mt); a.position.y = 3.3; var b = new THREE.Mesh(hb, mt); b.position.y = -3.3;
      var c1 = new THREE.Mesh(vb, mt); c1.position.x = -2.9; var c2 = new THREE.Mesh(vb, mt); c2.position.x = 2.9;
      gr.add(a); gr.add(b); gr.add(c1); gr.add(c2);
      gr.position.z = -(g * ZLEN) - .02; scene.add(gr);
      var cz = ZONAS[g].cor; mt.color.setRGB(Math.pow(cz[0] / 255, 2.2) * .5, Math.pow(cz[1] / 255, 2.2) * .5, Math.pow(cz[2] / 255, 2.2) * .5);
      gates.push(gr);
    }
  })();

  /* ---------- linhas de velocidade ---------- */
  var NS = pequeno ? 90 : 190, sPos = new Float32Array(NS * 6), sEnd = new Float32Array(NS * 2);
  for (var q = 0; q < NS; q++) {
    var sxp = (Math.random() - .5) * 6.4, syp = (Math.random() - .5) * 6.2, szp = 3 - Math.random() * (ZL + 10);
    sPos.set([sxp, syp, szp, sxp, syp, szp], q * 6); sEnd[q * 2] = 0; sEnd[q * 2 + 1] = 1;
  }
  var sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('aEnd', new THREE.BufferAttribute(sEnd, 1));
  var sMat = new THREE.ShaderMaterial({
    uniforms: { uLen: { value: 0 }, uOp: { value: 0 }, uCol: { value: new THREE.Color(1, .3, .2) } },
    vertexShader: 'uniform float uLen; attribute float aEnd; varying float vA; void main(){ vec3 p=position; p.z += aEnd*uLen; vA=1.-aEnd; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }',
    fragmentShader: 'uniform vec3 uCol; uniform float uOp; varying float vA; void main(){ gl_FragColor=vec4(uCol*vA*uOp, vA*uOp); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  var streaks = new THREE.LineSegments(sGeo, sMat); streaks.frustumCulled = false; scene.add(streaks);

  /* ---------- fitas de luz da abertura ---------- */
  var fitas = new THREE.Group(); scene.add(fitas);
  var fitaMats = [];
  (function () {
    var pal = [[1, .08, .1], [.9, 0, .26], [1, .42, .08], [.82, .1, .72], [.34, .2, 1], [1, .2, .2]];
    var rnd = mulberry(77);
    var vs = 'uniform float uT,uConv,uPh,uAmp,uFreq,uOff; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position; float w=sin(p.x*uFreq+uT*.8+uPh)*uAmp+sin(p.x*uFreq*2.3-uT*.6+uPh*1.7)*uAmp*.4; float sp=1.-uConv; p.y=p.y*(1.-uConv*.85)+(uOff+w)*sp; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }';
    var fs2 = 'uniform vec3 uC1,uC2; uniform float uApp,uConv,uBr; varying vec2 vUv; void main(){ float e=smoothstep(0.,.5,vUv.y)*smoothstep(1.,.5,vUv.y); float al=smoothstep(0.,.2,vUv.x)*smoothstep(1.,.8,vUv.x); float v=1.-smoothstep(uApp-.3,uApp,vUv.x); vec3 c=mix(uC1,uC2,vUv.x)*(1.+uConv*1.4); float a=e*e*al*v*uBr; gl_FragColor=vec4(c*a,a); }';
    for (var i = 0; i < 26; i++) {
      var c1 = pal[Math.floor(rnd() * pal.length)], c2 = pal[Math.floor(rnd() * pal.length)];
      var mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uConv: { value: 0 }, uPh: { value: rnd() * 6.28 }, uAmp: { value: .25 + rnd() * .9 }, uFreq: { value: .3 + rnd() * .55 },
          uOff: { value: (rnd() - .5) * 5 }, uC1: { value: new THREE.Color(c1[0], c1[1], c1[2]) }, uC2: { value: new THREE.Color(c2[0], c2[1], c2[2]) }, uApp: { value: 0 }, uBr: { value: .8 } },
        vertexShader: vs, fragmentShader: fs2, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
      });
      var f = new THREE.Mesh(new THREE.PlaneGeometry(17, .1 + rnd() * .42, 160, 1), mat);
      f.position.set(0, 0, .66 + i * .001); f.renderOrder = 5; fitas.add(f); fitaMats.push(mat);
    }
  })();

  /* ---------- moldura de destaque (hover) ---------- */
  var selo = new THREE.LineSegments(new THREE.EdgesGeometry(geoP), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, fog: false }));
  selo.visible = false; scene.add(selo);
  var vTmp = new THREE.Vector3(), qTmp = new THREE.Quaternion();

  /* ---------- pós-processamento: aberração cromática, brilho, vinheta e grão ---------- */
  var rt = null, post = null, postScene = null, postCam = null;
  try {
    var gl2 = renderer.capabilities.isWebGL2;
    rt = gl2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(4, 4, { format: THREE.RGBAFormat }) : new THREE.WebGLRenderTarget(4, 4, { format: THREE.RGBAFormat });
    rt.texture.encoding = THREE.sRGBEncoding; rt.texture.minFilter = THREE.LinearFilter; rt.texture.magFilter = THREE.LinearFilter; rt.texture.generateMipmaps = false;
    post = new THREE.ShaderMaterial({
      uniforms: { t: { value: rt.texture }, uAb: { value: .0006 }, uT: { value: 0 }, uVig: { value: .85 }, uBloom: { value: pequeno ? .5 : 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: [
        'uniform sampler2D t; uniform float uAb,uT,uVig,uBloom; uniform vec2 uRes; varying vec2 vUv;',
        'void main(){',
        '  vec2 c=vUv-.5; float d=dot(c,c); vec2 off=c*(uAb*(.5+d*3.));',
        '  vec3 col=vec3(texture2D(t,vUv+off).r, texture2D(t,vUv).g, texture2D(t,vUv-off).b);',
        '  vec3 bl=vec3(0.);',
        '  for(int i=0;i<8;i++){ float a=float(i)*.7854; vec2 dr=vec2(cos(a),sin(a)*uRes.x/uRes.y);',
        '    bl+=max(texture2D(t,vUv+dr*.006).rgb-.5,0.); bl+=max(texture2D(t,vUv+dr*.016).rgb-.5,0.)*.8; }',
        '  col+=bl*.07*uBloom;',
        '  col*=1.-smoothstep(.28,.98,length(c)*1.3)*uVig;',
        '  float n=fract(sin(dot(vUv*uRes+uT*61.,vec2(12.9898,78.233)))*43758.5453);',
        '  col+=(n-.5)*.05;',
        '  gl_FragColor=vec4(col,1.);',
        '}'
      ].join('\n'),
      depthTest: false, depthWrite: false
    });
    postScene = new THREE.Scene(); postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  } catch (e) { rt = null; post = null; }

  /* ---------- estado e câmera ---------- */
  var KEYS = [[0, 14], [.14, 3.2], [.34, -22], [.62, -72], [.8, -97], [1, -ZL - .2]];
  function zDe(p) {
    for (var i = 1; i < KEYS.length; i++) {
      if (p <= KEYS[i][0]) { var a = KEYS[i - 1], b = KEYS[i]; var t = (p - a[0]) / (b[0] - a[0]); t = t * t * (3 - 2 * t) * .35 + t * .65; return lerp(a[1], b[1], t); }
    }
    return KEYS[KEYS.length - 1][1];
  }
  var prog = 0, progAlvo = 0, camZ = 14, vz = 0, cap = 0;
  var mx = 0, my = 0, sx = 0, sy = 0;
  var zonaIdx = 0, corFog = new THREE.Color(0x010000), corAlvo = new THREE.Color(0x010000), corTira = new THREE.Color(0xe50914);
  var corZona = ZONAS[0].cor.slice();
  var W = 1, H = 1, visivel = true;
  var hover = null, ult = 0, lastE = null, nq = 0;

  function layout() {
    pequeno = window.innerWidth < 760;
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    if (rt) { var pr = renderer.getPixelRatio(); rt.setSize(Math.floor(W * pr), Math.floor(H * pr)); post.uniforms.uRes.value.set(W * pr, H * pr); }
    camera.aspect = W / H; camera.updateProjectionMatrix();
    // em tela vertical o corredor estreita e a sala se fecha, para os pôsteres ficarem dentro do quadro
    var ck = clamp(camera.aspect / 1.35, .5, 1);
    posters.forEach(function (m) {
      var u = m.userData;
      if (u.p0) { u.p0.x = u.lado * 3.7 * ck; m.position.x = u.p0.x - u.lado * (u.lift || 0) * .5; if (u.ref) u.ref.position.x = u.p0.x; }
      else if (u.xs !== undefined) m.position.x = u.xs * (.55 + .45 * ck);
    });
    paredes.forEach(function (a) { a[0].position.x = a[1] * ck; });
    tiras.forEach(function (a) { a[0].position.x = a[1] * ck; });
    gates.forEach(function (g) { g.scale.x = ck; });
    sala.position.y = camera.aspect < 1 ? (1 - camera.aspect) * 3.2 : 0;
    var tk = clamp(camera.aspect * 1.45, .55, 1); tela.scale.set(tk, tk, 1); moldura.scale.set(tk, tk, 1);
  }
  window.addEventListener('resize', layout);
  window.addEventListener('pointermove', function (e) { mx = e.clientX / W - .5; my = e.clientY / H - .5; lastE = { clientX: e.clientX, clientY: e.clientY, target: e.target }; verHover(lastE); }, { passive: true });

  /* ---------- raycast: hover e clique ---------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function interativo(el) { return el && el.closest && el.closest('a,button,input,label,details,summary,header,.player,.modal'); }
  function quem(e) {
    ndc.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var cz = camera.position.z;
    var alvos = posters.filter(function (m) { var d = cz - m.userData.wz; return d > 0 && d < 30; });
    if (cap === 4 || camZ < -ZL + 20) alvos.push(tela);
    var h = ray.intersectObjects(alvos, false);
    return h.length ? h[0].object : null;
  }
  var dica = document.getElementById('dica');
  function verHover(e) {
    if (!visivel || reduz || interativo(e.target) || document.body.classList.contains('modal-aberto')) { setHover(null); if (dica) dica.classList.remove('on'); return; }
    var m = quem(e); setHover(m);
    if (!dica) return;
    if (m) {
      var it = m.userData.it;
      dica.innerHTML = '<b>' + (it ? it.titulo : 'Em cartaz') + '</b><span>' + (it ? it.zonaNome + ' · clique para abrir' : 'clique para assistir') + '</span>';
      dica.style.transform = 'translate(' + Math.min(W - 250, e.clientX + 18) + 'px,' + Math.min(H - 80, e.clientY + 18) + 'px)';
      dica.classList.add('on');
    } else dica.classList.remove('on');
  }
  function setHover(m) {
    if (hover === m) return;
    if (hover && hover.userData.base !== undefined) hover.userData.alvo = 1;
    hover = m;
    if (hover && hover.userData.it) hover.userData.alvo = 1.1;
    document.body.style.cursor = hover ? 'pointer' : '';
  }
  window.addEventListener('click', function (e) {
    if (!visivel || interativo(e.target) || document.body.classList.contains('modal-aberto')) return;
    var m = quem(e);
    if (!m) return;
    if (m.userData.tela) { m = destaques[2]; }
    if (m.userData.it && window.abrirTitulo) window.abrirTitulo(m.userData.it);
  });

  /* ---------- laço ---------- */
  var relogio = new THREE.Clock();
  function quadro() {
    requestAnimationFrame(quadro);
    if (!visivel) return;
    var dt = Math.min(relogio.getDelta(), .05), t = relogio.elapsedTime;
    prog = lerp(prog, progAlvo, 1 - Math.exp(-dt * 4.2));
    var zAlvo = zDe(prog);
    var zAnt = camZ;
    camZ = zAlvo;
    vz = dt > 0 ? (zAnt - camZ) / dt : 0;       // positivo ao avançar

    sx = lerp(sx, mx, 1 - Math.exp(-dt * 4)); sy = lerp(sy, my, 1 - Math.exp(-dt * 4));
    camera.position.set(sx * .8, -sy * .5 + Math.sin(t * .6) * .03, camZ);
    camera.lookAt(sx * .4, -sy * .3, camZ - 10);
    camera.rotation.z = -sx * .035;
    camera.fov = 50 + Math.min(16, Math.abs(vz) * .85) + (camera.aspect < 1 ? (1 - camera.aspect) * 24 : 0);
    camera.updateProjectionMatrix();

    // cortinas e risco
    var abre = clamp(prog / .12, 0, 1); var ae = abre * abre * (3 - 2 * abre);
    var cortinaVis = prog < .2;
    cortS.visible = cortI.visible = cortinaVis; risco.visible = brilhoRisco.visible = cortinaVis;
    cortS.position.y = 12 + ae * 22; cortI.position.y = -12 - ae * 22;
    risco.scale.y = 1 + ae * 8; risco.material.opacity = 1 - ae;
    brilhoRisco.material.opacity = (1 - ae) * (.6 + .4 * Math.sin(t * 8));
    brilhoRisco.scale.set(16 + ae * 6, 3.4 + ae * 2, 1);

    // zona atual, cor e névoa
    zonaIdx = clamp(-camZ / ZLEN, 0, NZ - .001);
    var zi = Math.floor(zonaIdx), zf = zonaIdx - zi, z2 = Math.min(NZ - 1, zi + 1);
    var tz = clamp((zf - .55) / .45, 0, 1);
    var cA = ZONAS[zi].cor, cB = ZONAS[z2].cor;
    var cr = [lerp(cA[0], cB[0], tz), lerp(cA[1], cB[1], tz), lerp(cA[2], cB[2], tz)];
    corZona = cr;
    corAlvo.setRGB(Math.pow(cr[0] / 255, 2.2) * .03, Math.pow(cr[1] / 255, 2.2) * .03, Math.pow(cr[2] / 255, 2.2) * .03);
    corFog.lerp(corAlvo, .06);
    fog.color.copy(corFog); scene.background = corFog;
    fog.density = camZ > 0 ? .02 : .056;
    corTira.setRGB(Math.pow(cr[0] / 255, 2.2), Math.pow(cr[1] / 255, 2.2), Math.pow(cr[2] / 255, 2.2));
    matTira.color.copy(corTira);
    luzSala.material.color.setRGB(Math.pow(cr[0] / 255, 2.2), Math.pow(cr[1] / 255, 2.2), Math.pow(cr[2] / 255, 2.2));

    if (lastE && ++nq % 5 === 0) verHover(lastE);
    // hover suave: o pôster avança para o corredor
    for (var i = 0; i < posters.length; i++) {
      var u = posters[i].userData;
      if (Math.abs(u.base - u.alvo) > .002) { u.base = lerp(u.base, u.alvo, 1 - Math.exp(-dt * 12)); posters[i].scale.setScalar(u.base); }
      if (u.p0) {
        var lf = posters[i] === hover ? 1 : 0;
        if (Math.abs(u.lift - lf) > .003) { u.lift = lerp(u.lift, lf, 1 - Math.exp(-dt * 10)); posters[i].position.x = u.p0.x - u.lado * u.lift * .5; }
      }
    }
    if (hover) {
      hover.getWorldPosition(vTmp); hover.getWorldQuaternion(qTmp);
      selo.position.copy(vTmp); selo.quaternion.copy(qTmp); selo.scale.copy(hover.scale).multiplyScalar(1.025);
      selo.material.opacity = .65 + .3 * Math.sin(t * 6); selo.visible = true;
    } else selo.visible = false;

    // fitas da abertura
    var conv = clamp(prog / .1, 0, 1); conv = conv * conv * (3 - 2 * conv);
    var apar = clamp(t / 2.4, 0, 1); apar = (1 - Math.pow(1 - apar, 3)) * 1.35;
    var brF = (1 - clamp((prog - .075) / .06, 0, 1));
    fitas.visible = cortinaVis && brF > .01;
    if (fitas.visible) {
      fitas.position.set(sx * .7, -sy * .5 + 1.7 * (1 - conv), 0);
      for (var f = 0; f < fitaMats.length; f++) { var uf = fitaMats[f].uniforms; uf.uT.value = t; uf.uConv.value = conv; uf.uApp.value = apar; uf.uBr.value = .85 * brF; }
    }

    // portais e linhas de velocidade
    for (var g = 0; g < gates.length; g++) { var dg = camZ - gates[g].position.z; gates[g].visible = dg > -2 && dg < 40; }
    var vv = Math.abs(vz);
    sMat.uniforms.uLen.value = Math.min(16, vv * .6);
    sMat.uniforms.uOp.value = clamp(vv * .05, 0, .85);
    sMat.uniforms.uCol.value.setRGB(.3 + cr[0] / 255 * .9, .3 + cr[1] / 255 * .9, .3 + cr[2] / 255 * .9);
    // tela da sala
    if (camZ < -ZL + 28) pintaTela(t, cap);

    // poeira acompanha a velocidade
    poeira.rotation.z = Math.sin(t * .1) * .02;

    if (rt) {
      post.uniforms.uT.value = t % 10; post.uniforms.uAb.value = .0006 + Math.min(.007, vv * .0004);
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    } else renderer.render(scene, camera);
  }
  function visibilidade() {
    var el = document.getElementById('tunel'); if (!el) return;
    var r = el.getBoundingClientRect();
    visivel = r.bottom > -40 && r.top < window.innerHeight + 40;
    canvas.style.visibility = visivel ? 'visible' : 'hidden';
    document.body.classList.toggle('fora-do-tunel', !visivel);
  }
  window.addEventListener('scroll', visibilidade, { passive: true });

  window.Cena = {
    progresso: function (p) { progAlvo = clamp(p, 0, 1); if (reduz) prog = progAlvo; },
    capitulo: function (c) { cap = c; },
    info: function (i) { return info[i]; },
    zona: function () { return { i: Math.floor(zonaIdx), nome: ZONAS[Math.floor(zonaIdx)].nome, cor: corZona }; },
    velocidade: function () { return Math.abs(vz); },
    camZ: function () { return camZ; },
    totalZ: ZL,
    pronto: true,
    relayout: layout
  };
  layout(); visibilidade();
  document.documentElement.classList.add('webgl');
  requestAnimationFrame(quadro);
})();
