// ========================================================
// 1. CONFIGURACIÓN MANUAL DE PALETAS (RGB PURO)
// ========================================================
const PALETAS_CONFIG = {
  A: [
    [243, 197, 99], [7, 64, 168], [170, 65, 60], 
    [219, 197, 118], [188, 59, 47], [227, 177, 65], [198, 211, 228]
  ],
  B: [
    [172, 36, 21], [90, 54, 47], [57, 111, 71], 
    [200, 47, 26], [27, 74, 73]
  ],
  C: [
    [223, 2, 1], [237, 141, 1], [39, 48, 105], 
    [2, 1, 0], [98, 139, 169], [5, 29, 77], [27, 58, 39]
  ],
  D: [
    [225, 63, 59], [239, 125, 97], [6, 100, 173], 
    [227, 106, 85], [236, 22, 63], [222, 59, 52]
  ]
};

// ========================================================
// VARIABLES DE CALIBRACIÓN MANUAL
// ========================================================
const MULTIPLICADOR_TEMBLOR = 2.5; 

// ========================================================
// 2. VARIABLES GLOBALES Y ESTADOS DE LOS MÓDULOS
// ========================================================
let mic;               
let fft;               
let detectorAplauso;   

let volumenAnterior = 0;
let tiempoUltimoCambioColor = 0;

let sateliteFondo = [];
let sateliteFrente = [];
let sateliteSuperFrente = []; 
let ultimaFigura = null; 
let bancoPaletas = {};
let paletaActiva = [];
let paletaObjetivo = []; 
let factorTransicionColor = 1.0; 
let paddingSatelites = 60; 
let construyendoComposicion = false;
let indiceSateliteActual = 0;
let totalSatélitesAConstruir = 8;
let fotogramaUltimaInyeccion = 0;
let intervaloFotogramas = 5; 

// 🖼️ Contenedores para los archivos de textura
let imgFiltro1; 
let imgFiltro2;
let imgLienzoFondo; 

// 🛠️ Contenedores optimizados para las texturas invertidas en setup
let imgFiltro1Invertido;
let imgFiltro2Invertido;

// Sistema de anclas
let anclas = {
  circulo: { x: 0, y: 0, tam: 0, color: null, textura: null, texturaInvertida: null }, 
  cuadrado: { x: 0, y: 0, ancho: 0, alto: 0, angulo: 0, textura: null, texturaInvertida: null } 
};

let escalaCirculo = 1.0;
let escalaCuadrado = 1.0;

let activandoTelon = false;
let desvaneciendoTelon = false;
let telon = { x: 0, y: 0, anchoActual: 0, altoActual: 0, anchoObj: 2200, altoObj: 2200, angulo: 0, alpha: 0 }; 

// 🎛️ Tablero UI
let sliderMinVol, sliderHabla, sliderAplauso, botonMute;
let estaEnsordecido = false; 
let txtRuido, txtHabla, txtAplauso, txtMoniVol, txtMoniVar;

// ========================================================
// 2B. PRECARGA DE ASSETS
// ========================================================
function preload() {
  imgFiltro1 = loadImage('filtro.png'); 
  imgFiltro2 = loadImage('filtro2.png'); 
  imgLienzoFondo = loadImage('lienzofiltro.png'); 
}

// ========================================================
// 3. CICLO DE VIDA PRINCIPAL (p5.js Core)
// ========================================================
function setup() {
  let canvas = createCanvas(800, 1200);
  canvas.parent('canvas-contenedor');
  
  ellipseMode(CORNER);
  rectMode(CENTER); 
  angleMode(DEGREES); 
  colorMode(RGB, 255); 

  // 🛠️ PRE-PROCESAMIENTO: Invertimos las texturas UNA sola vez en memoria para no saturar el draw
  imgFiltro1Invertido = imgFiltro1.get();
  imgFiltro1Invertido.filter(INVERT);
  imgFiltro2Invertido = imgFiltro2.get();
  imgFiltro2Invertido.filter(INVERT);

  mic = new p5.AudioIn();
  mic.start();
  
  fft = new p5.FFT(0.8, 1024);
  fft.setInput(mic);
  
  detectorAplauso = new p5.PeakDetect(1000, 4000, 0.25, 20);

  let uiContainer = 'controles-ui';

  botonMute = createButton('🔇 Ensordecer Proyecto');
  botonMute.parent(uiContainer);
  botonMute.style('width', '100%');
  botonMute.style('padding', '8px');
  botonMute.style('margin-bottom', '15px');
  botonMute.style('cursor', 'pointer');
  botonMute.mousePressed(alternarMute); 

  txtRuido = createP('1. VIBRAR PALETAS:');
  txtRuido.parent(uiContainer);
  txtRuido.style('margin', '5px 0 0 0');
  sliderMinVol = createSlider(0, 0.1, 0.065, 0.005);
  sliderMinVol.parent(uiContainer);
  sliderMinVol.style('width', '100%');
  
  txtHabla = createP('2. PARLANTE DE VOZ:');
  txtHabla.parent(uiContainer);
  txtHabla.style('margin', '15px 0 0 0');
  sliderHabla = createSlider(0.002, 0.03, 0.008, 0.001);
  sliderHabla.parent(uiContainer);
  sliderHabla.style('width', '100%');
  
  txtAplauso = createP('3. APLAUSO RESTART:');
  txtAplauso.parent(uiContainer);
  txtAplauso.style('margin', '15px 0 0 0');
  sliderAplauso = createSlider(0.05, 0.6, 0.6, 0.01); 
  sliderAplauso.parent(uiContainer);
  sliderAplauso.style('width', '100%');

  createP('<hr style="border-color:#555;"><strong>Monitores en vivo:</strong>').parent(uiContainer);
  txtMoniVol = createP('Volumen Real: 0.000');
  txtMoniVol.parent(uiContainer);
  txtMoniVol.style('margin', '5px 0');
  
  txtMoniVar = createP('Variación (Dinámica): 0.000');
  txtMoniVar.parent(uiContainer);
  txtMoniVar.style('margin', '5px 0');
  
  bancoPaletas = {};
  for (let letra in PALETAS_CONFIG) {
    bancoPaletas[letra] = [];
    for (let rgb of PALETAS_CONFIG[letra]) { 
      bancoPaletas[letra].push(color(rgb[0], rgb[1], rgb[2]));
    }
  }
  
  ejecutarNuevaComposicionDirecta();
}

function draw() {
  background(244, 250, 252); 
  
  push();
  blendMode(MULTIPLY);
  imageMode(CORNER);
  image(imgLienzoFondo, 0, 0, width, height);
  pop();
  blendMode(BLEND); 

  let umbralRuidoFondo = sliderMinVol.value();
  let umbralCorteHabla = sliderHabla.value();
  let umbralEnergiaAplauso = sliderAplauso.value();

  detectorAplauso.threshold = umbralEnergiaAplauso;

  if (!estaEnsordecido) {
    fft.analyze(); 
    detectorAplauso.update(fft); 
  }

  let vol = mic.getLevel(); 
  if (estaEnsordecido) vol = 0;

  let fuerzaTemblor = 0;
  let variacionVolumen = abs(vol - volumenAnterior);
  volumenAnterior = vol; 

  txtRuido.html(`1. VIBRAR PALETAS: ${umbralRuidoFondo.toFixed(3)}`);
  txtHabla.html(`2. PARLANTE DE VOZ: ${umbralCorteHabla.toFixed(3)}`);
  txtAplauso.html(`3. APLAUSO RESTART: ${umbralEnergiaAplauso.toFixed(2)}`);
  txtMoniVol.html(`Volumen Real: ${vol.toFixed(3)}`);
  txtMoniVar.html(`Variación (Dinámica): ${variacionVolumen.toFixed(3)}`);

  if (!estaEnsordecido && detectorAplauso.isDetected && !activandoTelon && !desvaneciendoTelon) {
    dispararEfectonTelon();
  }

  // 🔍 FILTRO FRECUENCIAL: TARAREO "MMM"
  let energiaMmm = fft.getEnergy(80, 260) / 255.0; 
  let esTarareoMmm = (energiaMmm > 0.35 && vol > umbralRuidoFondo && variacionVolumen < umbralCorteHabla * 1.5);

  // --- INTERACCIONES DE ESCALA ---
  if (vol > umbralRuidoFondo) {
    if (variacionVolumen > umbralCorteHabla && !esTarareoMmm) { 
      let objCirculo = map(vol, umbralRuidoFondo, 0.3, 0.95, 3.0, true);
      let objCuadrado = map(vol, umbralRuidoFondo, 0.3, 0.95, 2.2, true);

      let umbralLimiteC = 2.0;
      if (objCirculo > umbralLimiteC) {
        let exceso = objCirculo - umbralLimiteC;
        objCirculo = umbralLimiteC + sqrt(exceso) * 0.4; 
      }

      let inerciaCirculo = map(anclas.circulo.tam, 40, 320, 0.60, 0.25, true);
      let ladoMayorCuadrado = max(anclas.cuadrado.ancho, anclas.cuadrado.alto);
      let inerciaCuadrado = map(ladoMayorCuadrado, 260, 555, 0.25, 0.08, true);

      escalaCirculo = lerp(escalaCirculo, objCirculo, inerciaCirculo);
      escalaCuadrado = lerp(escalaCuadrado, objCuadrado, inerciaCuadrado);
    } else {
      let suavidadRetornoC = map(anclas.circulo.tam, 40, 320, 0.25, 0.10, true);
      let ladoMayorCuadrado = max(anclas.cuadrado.ancho, anclas.cuadrado.alto);
      let suavidadRetornoQ = map(ladoMayorCuadrado, 260, 555, 0.08, 0.03, true);

      escalaCirculo = lerp(escalaCirculo, 1.0, suavidadRetornoC);
      escalaCuadrado = lerp(escalaCuadrado, 1.0, suavidadRetornoQ);
    }

    if (variacionVolumen <= umbralCorteHabla || esTarareoMmm) {
      let factorFuerza = esTarareoMmm ? energiaMmm : vol;
      fuerzaTemblor = map(factorFuerza, umbralRuidoFondo, 0.5, 5, 15, true) * MULTIPLICADOR_TEMBLOR; 
      
      // 🛠️ VELOCIDAD ACELERADA: Bajamos la espera del "mmm" a 250ms para que responda al toque
      if (factorTransicionColor >= 1.0 && millis() - tiempoUltimoCambioColor > 250) {
        prepararCambioPaletaEvolutivo();
        tiempoUltimoCambioColor = millis();
      }
    }

  } else {
    let suavidadRetornoC = map(anclas.circulo.tam, 40, 320, 0.25, 0.10, true);
    let ladoMayorCuadrado = max(anclas.cuadrado.ancho, anclas.cuadrado.alto);
    let suavidadRetornoQ = map(ladoMayorCuadrado, 260, 555, 0.08, 0.03, true);

    escalaCirculo = lerp(escalaCirculo, 1.0, suavidadRetornoC);
    escalaCuadrado = lerp(escalaCuadrado, 1.0, suavidadRetornoQ);
  }

  // --- MOTOR GRÁFICO PROCEDURAL ---
  if (factorTransicionColor < 1.0) {
    factorTransicionColor += 0.08; // 🛠️ ACELERACIÓN: Transición cromática el doble de rápido (de 0.03 a 0.08)
    actualizarColoresInterpolados();
  }
  
  if (construyendoComposicion) {
    if (frameCount - fotogramaUltimaInyeccion >= intervaloFotogramas) {
      generarSateliteProcedimental(indiceSateliteActual);
      indiceSateliteActual++;
      fotogramaUltimaInyeccion = frameCount;
      if (indiceSateliteActual >= totalSatélitesAConstruir) {
        construyendoComposicion = false;
      }
    }
  }
  
  // Dibujado por capas
  for (let s of sateliteFondo) { dibujarSatelite(s, fuerzaTemblor); }
  dibujarAnclas(escalaCirculo, escalaCuadrado);
  for (let s of sateliteFrente) { dibujarSatelite(s, fuerzaTemblor); }
  for (let s of sateliteSuperFrente) { dibujarSatelite(s, fuerzaTemblor); }

  gestionarAnimacionTelon();
}

function alternarMute() {
  estaEnsordecido = !estaEnsordecido; 
  if (estaEnsordecido) {
    botonMute.html('🔊 Escuchar Proyecto');
    botonMute.style('background-color', '#cc3a3a');
    botonMute.style('color', '#fff');
  } else {
    botonMute.html('🔇 Ensordecer Proyecto');
    botonMute.style('background-color', '#e1e1e1');
    botonMute.style('color', '#000');
  }
}

function keyPressed() {
  if (keyCode === BACKSPACE && !activandoTelon && !desvaneciendoTelon) {
    dispararEfectonTelon();
  }
}

function dispararEfectonTelon() {
  activandoTelon = true; desvaneciendoTelon = false;
  telon.x = anclas.cuadrado.x; telon.y = anclas.cuadrado.y;
  telon.anchoActual = anclas.cuadrado.ancho; telon.altoActual = anclas.cuadrado.alto;
  telon.angulo = anclas.cuadrado.angulo; telon.alpha = 255;
}

function gestionarAnimacionTelon() {
  if (!activandoTelon && !desvaneciendoTelon) return;
  push(); noStroke(); rectMode(CENTER);
  if (activandoTelon) {
    telon.anchoActual += (telon.anchoObj - telon.anchoActual) * 0.12;
    telon.altoActual += (telon.altoObj - telon.altoActual) * 0.12;
    telon.angulo += 1.5; 
    if (telon.anchoObj - telon.anchoActual < 20) {
      telon.anchoActual = telon.anchoObj; telon.altoActual = telon.altoObj;
      activandoTelon = false; desvaneciendoTelon = true; 
      ejecutarNuevaComposicionEnSecreto();
    }
  }
  if (desvaneciendoTelon) {
    telon.alpha -= 5; 
    if (telon.alpha <= 0) { telon.alpha = 0; desvaneciendoTelon = false; }
  }
  if (telon.alpha > 0) {
    push(); translate(telon.x, telon.y); rotate(telon.angulo);
    fill(0, 0, 0, telon.alpha); rect(0, 0, telon.anchoActual, telon.altoActual);
    pop();
  }
  pop();
}

function ejecutarNuevaComposicionDirecta() {
  sateliteFondo = []; sateliteFrente = []; sateliteSuperFrente = []; ultimaFigura = null;
  let nombresPaletas = ['A', 'B', 'C', 'D'];
  let paletaElegida = random(nombresPaletas);
  paletaActiva = [];
  for (let c of bancoPaletas[paletaElegida]) { paletaActActivePush(c); }
  paletaObjetivo = [...paletaActiva]; factorTransicionColor = 1.0;
  inicializarAnclas();
  for (let i = 0; i < totalSatélitesAConstruir; i++) { generarSateliteProcedimental(i); }
}

function ejecutarNuevaComposicionEnSecreto() {
  sateliteFondo = []; sateliteFrente = []; sateliteSuperFrente = []; ultimaFigura = null;
  let nombresPaletas = ['A', 'B', 'C', 'D'];
  let paletaElegida = random(nombresPaletas);
  paletaActiva = [];
  for (let c of bancoPaletas[paletaElegida]) { paletaActActivePush(c); }
  paletaObjetivo = [...paletaActiva]; factorTransicionColor = 1.0;
  inicializarAnclas();
  construyendoComposicion = true; indiceSateliteActual = 0; fotogramaUltimaInyeccion = frameCount;
}

function paletaActActivePush(c) { paletaActiva.push(color(red(c), green(c), blue(c))); }

function prepararCambioPaletaEvolutivo() {
  let nombresPaletas = ['A', 'B', 'C', 'D'];
  let paletaElegida = random(nombresPaletas);
  paletaObjetivo = bancoPaletas[paletaElegida];
  factorTransicionColor = 0.0; 
}

// Corregido bug de tipado duplicado en versiones anteriores
function actualizarColoresInterpolados() {
  for (let i = 0; i < paletaActiva.length; i++) {
    if (paletaObjetivo[i]) { paletaActiva[i] = lerpColor(paletaActiva[i], paletaObjetivo[i], factorTransicionColor); }
  }
  actualizarColoresFigurasVivas();
}

function actualizarColoresFigurasVivas() {
  let todas = [...sateliteFondo, ...sateliteFrente, ...sateliteSuperFrente];
  for (let s of todas) {
    if (s.indiceColorPalette !== undefined) { s.color = paletaActiva[s.indiceColorPalette % paletaActiva.length]; }
  }
}

function inicializarAnclas() {
  let dadoTamano = random(0, 100);
  if (dadoTamano < 50) { anclas.circulo.tam = random(40, 90); } 
  else { anclas.circulo.tam = random(200, 320); }
  
  let limiteMinimoX = 80; let limiteMaximoX = (width * 0.60) - anclas.circulo.tam;
  anclas.circulo.x = random(limiteMinimoX, max(limiteMinimoX + 20, limiteMaximoX));
  let limiteMinimoY = 80; let limiteMaximoY = (height * 0.45) - anclas.circulo.tam;
  anclas.circulo.y = random(limiteMinimoY, max(limiteMinimoY + 20, limiteMaximoY));
  
  let dadoColor = random(0, 100);
  if (dadoColor < 50) { anclas.circulo.color = color(0, 0, 0); } 
  else if (dadoColor < 75.6) { anclas.circulo.color = color(238, 58, 62); } 
  else { anclas.circulo.color = color(200, 179, 57); }
  
  // 🛠️ Asignamos tanto la textura normal como su contraparte invertida fija
  let dadoTexturaC = random([0, 1]);
  anclas.circulo.textura = dadoTexturaC === 0 ? imgFiltro1 : imgFiltro2;
  anclas.circulo.texturaInvertida = dadoTexturaC === 0 ? imgFiltro1Invertido : imgFiltro2Invertido;

  let dadoTexturaQ = random([0, 1]);
  anclas.cuadrado.textura = dadoTexturaQ === 0 ? imgFiltro1 : imgFiltro2;
  anclas.cuadrado.texturaInvertida = dadoTexturaQ === 0 ? imgFiltro1Invertido : imgFiltro2Invertido;

  let tamBaseMin = 260; let tamanoBaseMax = 370; let tamanoBase = random(tamBaseMin, tamanoBaseMax);
  anclas.cuadrado.ancho = tamanoBase; anclas.cuadrado.alto = tamanoBase;
  let probabilidadRectangulo = 0; if (tamanoBase <= 340) { probabilidadRectangulo = map(tamanoBase, tamBaseMin, 340, 85, 20); }
  let dadoMutacion = random(0, 100);
  if (dadoMutacion < probabilidadRectangulo) {
    if (random(0, 100) < 50) { anclas.cuadrado.ancho = tamanoBase * random(1.3, 1.5); } 
    else { anclas.cuadrado.alto = tamanoBase * random(1.3, 1.5); }
  }
  let ladoMayor = max(anclas.cuadrado.ancho, anclas.cuadrado.alto);
  let distanciaEsquina = ladoMayor * 0.75; 
  anclas.cuadrado.x = random(distanciaEsquina, width - distanciaEsquina);
  anclas.cuadrado.y = random((height / 2) + distanciaEsquina, height - distanciaEsquina);
  anclas.cuadrado.angulo = random(0, 360);
}

// ========================================================
// RENDEREADO DE ANCLAS OPTIMIZADO POR HARDWARE (SIN LAG)
// ========================================================
function dibujarAnclas(escC, escQ) {
  push(); noStroke(); 
  
  if (anclas.circulo.color) {
    let tamDinamico = anclas.circulo.tam * escC;
    let correccionDesplazamiento = (tamDinamico - anclas.circulo.tam) * 0.5;
    
    let capaCirculo = createGraphics(tamDinamico, tamDinamico);
    capaCirculo.ellipseMode(CENTER);
    capaCirculo.imageMode(CENTER);
    
    capaCirculo.noStroke();
    capaCirculo.fill(anclas.circulo.color);
    capaCirculo.circle(tamDinamico / 2, tamDinamico / 2, tamDinamico);
    
    // 🛠️ ALTA PERFORMANCE: Usamos la imagen pre-invertida sin llamar a .get() ni a .filter()
    capaCirculo.blendMode(SCREEN);
    capaCirculo.image(anclas.circulo.texturaInvertida, tamDinamico / 2, tamDinamico / 2, tamDinamico, tamDinamico);
    capaCirculo.blendMode(BLEND);
    
    (capaCirculo.canvas.getContext('2d')).globalCompositeOperation = 'destination-in';
    capaCirculo.fill(255);
    capaCirculo.circle(tamDinamico / 2, tamDinamico / 2, tamDinamico);
    
    imageMode(CORNER); 
    image(capaCirculo, anclas.circulo.x - correccionDesplazamiento, anclas.circulo.y - correccionDesplazamiento);
    capaCirculo.remove();
  }
  
  // Cuadrado Ancla de alto rendimiento
  fill(0, 0, 0); 
  push(); 
  translate(anclas.cuadrado.x, anclas.cuadrado.y); 
  rotate(anclas.cuadrado.angulo);  
  rect(0, 0, anclas.cuadrado.ancho * escQ, anclas.cuadrado.alto * escQ); 
  
  // 🛠️ ALTA PERFORMANCE: Usamos la textura pre-invertida limpia
  blendMode(SCREEN); 
  imageMode(CENTER);
  image(anclas.cuadrado.texturaInvertida, 0, 0, anclas.cuadrado.ancho * escQ, anclas.cuadrado.alto * escQ);
  pop(); 
  
  blendMode(BLEND); 
}

function generarSateliteProcedimental(indice) {
  let centroX, centroY; let tamanoBaseReferencia; let anguloFinal; let ancho, alto; let capaDestino;
  let vieneDelCirculo = false; let desfasajeX = 0; let indiceColorRandom = floor(random(10)); 
  let esCruzActiva = false; let anguloCompaneroRef = 0;

  if (indice < 2) {
    ancho = random(8, 18); tamanoBaseReferencia = 300; 
    if (indice === 0) {
      centroX = random(width * 0.30, width * 0.70); centroY = (height / 2) + random(-40, 80);
      anguloFinal = random(-12, 8); alto = random(450, 900); indiceColorRandom = 0; 
    } else {
      centroX = sateliteFondo.length > 0 ? sateliteFondo[0].x : sateliteFrente.length > 0 ? sateliteFrente[0].x : sateliteSuperFrente[0].x;
      centroY = sateliteFondo.length > 0 ? sateliteFondo[0].y : sateliteFrente.length > 0 ? sateliteFrente[0].y : sateliteSuperFrente[0].y;
      let anguloCompanero = sateliteFondo.length > 0 ? sateliteFondo[0].angulo : sateliteFrente.length > 0 ? sateliteFrente[0].angulo : sateliteSuperFrente[0].angulo;
      let altoCompanero = sateliteFondo.length > 0 ? sateliteFondo[0].alto : sateliteFrente.length > 0 ? sateliteFrente[0].alto : sateliteSuperFrente[0].alto;
      anguloCompaneroRef = anguloCompanero; centroX += random(-20, 20); centroY += random(-20, 20);
      if (random(0, 100) < 50) {
        esCruzActiva = true; anguloFinal = anguloCompanero + 90; alto = random(200, 250); 
        if (random(0, 100) < 50) { desfasajeX = random(['arriba', 'abajo']) === 'arriba' ? alto * 0.28 : -alto * 0.28; }
      } else { anguloFinal = anguloCompanero + random(-5, 5); alto = altoCompanero * random(1.0, 1.3); }
      indiceColorRandom = 0; 
    }
    let dadoCapaCentral = random(0, 100);
    if (dadoCapaCentral < 30) { capaDestino = "superFrente"; } 
    else if (centroX >= anclas.circulo.x && centroX <= (anclas.circulo.x + anclas.circulo.tam)) { capaDestino = "frente"; } 
    else { capaDestino = (random(0, 100) < 35) ? "frente" : "fondo"; }
  } 
  else {
    if (ultimaFigura === null || ultimaFigura === undefined) {
      let anclaDestino = random([0, 1]); let distancia;
      if (anclaDestino === 0) { 
        vieneDelCirculo = true; centroX = anclas.circulo.x + anclas.circulo.tam / 2; centroY = anclas.circulo.y + anclas.circulo.tam / 2;
        tamanoBaseReferencia = anclas.circulo.tam;
        distancia = random(tamanoBaseReferencia * map(anclas.circulo.tam, 40, 320, 1.1, 0.1), tamanoBaseReferencia * map(anclas.circulo.tam, 40, 320, 2.2, 0.6));
      } else { 
        centroX = anclas.cuadrado.x; centroY = anclas.cuadrado.y; tamanoBaseReferencia = max(anclas.cuadrado.ancho, anclas.cuadrado.alto);
        distancia = random(tamanoBaseReferencia * 0.1, tamanoBaseReferencia * 0.6);
      }
      let anguloPosicion = random(0, 360); centroX += p5.prototype.cos(anguloPosicion) * distancia; centroY += p5.prototype.sin(anguloPosicion) * distancia;
      anguloFinal = random(0, 360);
    } else {
      vieneDelCirculo = ultimaFigura.vieneDelCirculo; tamanoBaseReferencia = ultimaFigura.tamanoBaseReferencia || 100; 
      let distanciaAcoplamiento = random(25, 60); anguloFinal = ultimaFigura.angulo; let anguloAcoplamiento = random(0, 360); 
      centroX = ultimaFigura.x + p5.prototype.cos(anguloAcoplamiento) * distanciaAcoplamiento; centroY = ultimaFigura.y + p5.prototype.sin(anguloAcoplamiento) * distanciaAcoplamiento;
    }
    ancho = random(60, 180); alto = random(10, 100); 
    if (vieneDelCirculo) { capaDestino = "fondo"; } else { capaDestino = (random(0, 100) < 35) ? "frente" : "fondo"; }
  }

  centroX = constrain(centroX, paddingSatelites, width - paddingSatelites); centroY = constrain(centroY, paddingSatelites, height - paddingSatelites);
  
  let texturaAsignada = random([imgFiltro1, imgFiltro2]);

  let nuevoSatelite = { 
    x: centroX, y: centroY, yOriginal: centroY, ancho: ancho, alto: alto, 
    angulo: anguloFinal, anguloOriginal: anguloFinal, 
    color: paletaActiva.length > 0 ? paletaActiva[indiceColorRandom % paletaActiva.length] : color(0), 
    indiceColorPalette: indiceColorRandom, tamanoBaseReferencia: tamanoBaseReferencia, vieneDelCirculo: vieneDelCirculo, 
    esMonstruo: false, offsetX: desfasajeX, textura: texturaAsignada 
  };

  if (indice >= 2) { if (ultimaFigura === null) { ultimaFigura = nuevoSatelite; } else { ultimaFigura = null; } }
  if (capaDestino === "superFrente") { sateliteSuperFrente.push(nuevoSatelite); } else if (capaDestino === "frente") { sateliteFrente.push(nuevoSatelite); } else { sateliteFondo.push(nuevoSatelite); }

  if (indice === 1 && random(0, 100) < 30) {
    let anchoEspejo = random(30, 55); let anguloEspejo; let desfasajeXEspejo = 0;
    if (esCruzActiva) { anguloEspejo = anguloFinal; desfasajeXEspejo = -desfasajeX; } 
    else { anguloEspejo = anguloCompaneroRef - (anguloFinal - anguloCompaneroRef); }

    let sateliteEspejo = {
      x: centroX, y: centroY, yOriginal: centroY, ancho: anchoEspejo, alto: alto, angulo: anguloEspejo, anguloOriginal: anguloEspejo,
      color: paletaActiva.length > 0 ? paletaActiva[0] : color(0), indiceColorPalette: 0, tamanoBaseReferencia: tamanoBaseReferencia, 
      vieneDelCirculo: false, esMonstruo: false, offsetX: desfasajeXEspejo, 
      textura: random([imgFiltro1, imgFiltro2]) 
    };
    if (capaDestino === "superFrente") sateliteSuperFrente.push(sateliteEspejo);
    else if (capaDestino === "frente") sateliteFrente.push(sateliteEspejo);
    else sateliteFondo.push(sateliteEspejo);
  }
}

// ========================================================
// RENDEREADO DE LAS FIGURAS CON SU TEXTURA ASIGNADA (GRISES)
// ========================================================
function dibujarSatelite(s, temblor) {
  let vibracionX = random(-temblor, temblor); let vibracionY = random(-temblor, temblor); noStroke();
  
  if (temblor > 0) {
    push(); translate(s.x - vibracionX * 0.5, s.y - vibracionY * 0.5); rotate(s.angulo);
    fill(0, 0, 0, 90); rect(s.offsetX || 0, 0, s.ancho, s.alto); pop();
  }
  
  push(); 
  translate(s.x + vibracionX, s.y + vibracionY); 
  rotate(s.angulo); 
  fill(s.color); 
  rect(s.offsetX || 0, 0, s.ancho, s.alto); 
  
  blendMode(MULTIPLY); 
  imageMode(CENTER);
  image(s.textura, s.offsetX || 0, 0, s.ancho, s.alto);
  pop(); 
  
  blendMode(BLEND); 
}
