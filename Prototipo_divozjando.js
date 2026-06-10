let figuras = [];
let interaccionActivada = false;

// --- Variables globales de control ---
let contadorLineasEspeciales = 0;
let lineaEspecialX = 0;
let lineaEspecialY = 0;
let lineaEspecialRot = 0;
let lineaEspecialTamY = 0;

// Variables de control para la figura negra y su límite de cercanía
let negraX = null;
let negraY = null;

// Ángulo maestro fijo para el 80% de las figuras (8 de 10).
let rotacionMaestra = 45; 

function setup() {
  createCanvas(450, 600);

  // --- PALETA DE COLORES EXACTA ---
  let azulBase = color(38, 55, 99);
  let rojoBase = color(181, 22, 22);
  let amarilloBase = color(219, 172, 24);
  
  let verde = color(91, 127, 69);
  let marron = color(97, 60, 51);
  let celeste = color(54, 114, 173); 

  let bolsaColores = [
    azulBase, azulBase,      
    rojoBase, rojoBase,      
    amarilloBase, amarilloBase, 
    verde,                    
    marron                    
  ];

  bolsaColores.sort(() => random() - 0.5);

  let celesteAsignado = false;

  // --- GENERACIÓN AUTOMÁTICA DE LAS 10 FIGURAS ---
  for (let i = 0; i < 10; i++) {
    let tipoRandom;
    let colorRandom;
    let chance = random(100);

    if (figuras.length === 0) {
      tipoRandom = "circulo";
    } 
    else {
      if (chance < 30) {
        tipoRandom = "linea";
      } else if (chance < 90) {
        tipoRandom = "rectangulo";
      } else {
        tipoRandom = "circulo";
      }

      let cantidadCirculos = figuras.filter(f => f.tipo === "circulo").length;
      let cantidadRectangulos = figuras.filter(f => f.tipo === "rectangulo").length;

      if (tipoRandom === "circulo" && cantidadCirculos > 0) {
        tipoRandom = "linea"; 
      }
      if (tipoRandom === "rectangulo" && cantidadRectangulos >= 2) {
        tipoRandom = "linea"; 
      }
    }

    if (figuras.length === 1) {
      colorRandom = color(15, 15, 15); 
    } 
    else if (tipoRandom === "linea" && !celesteAsignado) {
      colorRandom = celeste;
      celesteAsignado = true;
    } 
    else {
      colorRandom = bolsaColores.pop();
    }

    let posicionX, posicionY;
    let rotacionRandom;
    let tamPropuesto;
    let tamLineaAnchoPropuesto;
    let largoLineaPropuesto;

    if (tipoRandom === "linea" && contadorLineasEspeciales === 1) {
      let mitadLargo = lineaEspecialTamY / 2;
      let desfasajeSemicuerpo = random(20, mitadLargo);
      
      if (random(100) < 50) {
        desfasajeSemicuerpo *= -1; 
      }

      let anguloRadianes = radians(lineaEspecialRot);
      posicionX = lineaEspecialX - desfasajeSemicuerpo * sin(anguloRadianes);
      posicionY = lineaEspecialY + desfasajeSemicuerpo * cos(anguloRadianes);
      
      rotacionRandom = lineaEspecialRot + random(45, 90);
      contadorLineasEspeciales = 2;
      
      tamPropuesto = random(50, 150);
      tamLineaAnchoPropuesto = random(5, 30);
      largoLineaPropuesto = lineaEspecialTamY;
    } 
    else {
      let esLugarVacio = false;
      let intentos = 0;
      let maxIntentos = 1000; 

      while (!esLugarVacio && intentos < maxIntentos) {
        posicionX = random(60, width - 60);
        posicionY = random(60, height - 60);

        if (figuras.length < 8) {
          rotacionRandom = rotacionMaestra;
        } else {
          rotacionRandom = random(0, 360);
        }

        if (tipoRandom === "circulo") {
          posicionY = random(60, height / 3);
        }

        tamPropuesto = random(50, 130);
        tamLineaAnchoPropuesto = random(5, 20);
        largoLineaPropuesto = random(100, 300);

        if (intentos > 150) {
          tamPropuesto = random(30, 60);
          largoLineaPropuesto = random(60, 150);
        }

        esLugarVacio = true;

        // Filtro: Límite de cercanía con la figura negra
        if (negraX !== null && negraY !== null) {
          let figurasCercanasANegra = 0;
          for (let j = 0; j < figuras.length; j++) {
            let f = figuras[j];
            if (f.x !== negraX && f.y !== negraY) {
              let distANegra = dist(f.x, f.y, negraX, negraY);
              if (distANegra <= 100) {
                figurasCercanasANegra++;
              }
            }
          }

          let distanciaPropuestaANegra = dist(posicionX, posicionY, negraX, negraY);
          if (distanciaPropuestaANegra <= 100) {
            if (figurasCercanasANegra >= 3) {
              esLugarVacio = false;
              intentos++;
              continue;
            }
          }
        }

        // Filtro: Máximo 3 líneas superpuestas
        if (tipoRandom === "linea") {
          let lineasSuperpuestas = 0;
          for (let j = 0; j < figuras.length; j++) {
            let otra = figuras[j];
            if (otra.tipo === "linea") {
              let d = dist(posicionX, posicionY, otra.x, otra.y);
              let alcanceMinimo = (tamLineaAnchoPropuesto) + (otra.tam_linea);
              if (d < alcanceMinimo) {
                lineasSuperpuestas++;
              }
            }
          }
          if (lineasSuperpuestas >= 3) {
            esLugarVacio = false;
            intentos++;
            continue; 
          }
        }

        if (tipoRandom === "circulo" && intentos > 50) {
          esLugarVacio = true;
          break;
        }

        // Filtro: Espaciado general
        for (let j = 0; j < figuras.length; j++) {
          let otra = figuras[j];
          let d = dist(posicionX, posicionY, otra.x, otra.y);
          let distanciaMinima = (tamPropuesto / 2) + (otra.tam / 2) + 25;

          if (d < distanciaMinima) {
            esLugarVacio = false; 
            break; 
          }
        }
        
        intentos++;
      }

      if (tipoRandom === "linea" && contadorLineasEspeciales === 0) {
        lineaEspecialX = posicionX;
        lineaEspecialY = posicionY;
        lineaEspecialRot = rotacionRandom;
        lineaEspecialTamY = largoLineaPropuesto; 
        contadorLineasEspeciales = 1;
      }
    }

    let nuevaFigura = {
      tipo: tipoRandom,
      x: posicionX,
      y: posicionY,
      tam: tamPropuesto,
      tamy: random(100, 150),
      tam_linea: tamLineaAnchoPropuesto,
      tamy_linea: largoLineaPropuesto,
      color: colorRandom,
      rot: rotacionRandom,
    };
    
    if (figuras.length === 1) {
      negraX = posicionX;
      negraY = posicionY;
    }

    nuevaFigura.area = calcularArea(nuevaFigura);
    figuras.push(nuevaFigura);
  }
} // <--- AQUÍ SE CIERRA CORRECTAMENTE LA FUNCIÓN SETUP()

// --- FUNCIÓN AUXILIAR EXTERNA ---
function calcularArea(f) {
  if (f.tipo === "circulo") {
    let radio = f.tam / 2;
    return Math.PI * radio * radio;
  } 
  else if (f.tipo === "rectangulo") {
    return f.tam * f.tamy;
  } 
  else if (f.tipo === "linea") {
    return f.tam_linea * f.tamy_linea;
  }
  return 0;
}

function draw() {
  background(240); // Fondo gris claro estático
  noStroke();

  // 1. Detectamos todas las condiciones del mouse (los 4 cuadrantes)
  let mouseSuperiorDerecha = (mouseX > width / 2 && mouseY < height / 2); 
  let mouseSuperiorIzquierda = (mouseX < width / 2 && mouseY < height / 2); 
  let mouseInferiorDerecha = (mouseX > width / 2 && mouseY > height / 2);  
  let mouseInferiorIzquierda = (mouseX < width / 2 && mouseY > height / 2); 

  for (let f of figuras) {
    
    // --- LÓGICA PARA LAS LÍNEAS (Solo si interaccionActivada es true) ---
    if (interaccionActivada && f.tipo === "linea" && (mouseSuperiorDerecha || mouseSuperiorIzquierda)) {
      let velocidad = mouseSuperiorIzquierda ? -2 : 2; 
      let anguloRad = radians(f.rot - 90); 
      
      f.x += velocidad * cos(anguloRad);
      f.y += velocidad * sin(anguloRad);

      // Reaparición (Pac-man)
      let margen = f.tamy_linea;
      if (f.x < -margen) f.x = width + margen;
      else if (f.x > width + margen) f.x = -margen;
      if (f.y < -margen) f.y = height + margen;
      else if (f.y > height + margen) f.y = -margen;
    }

    // --- LÓGICA PARA LOS RECTÁNGULOS (Solo si interaccionActivada es true) ---
    if (interaccionActivada && f.tipo === "rectangulo" && (mouseInferiorDerecha || mouseInferiorIzquierda)) {
      let velocidad = mouseInferiorIzquierda ? 2 : -2; 
      let anguloRad = radians(f.rot - 90); 
      
      f.x += velocidad * cos(anguloRad);
      f.y += velocidad * sin(anguloRad);

      // Reaparición (Pac-man)
      let margen = max(f.tam, f.tamy);
      if (f.x < -margen) f.x = width + margen;
      else if (f.x > width + margen) f.x = -margen;
      if (f.y < -margen) f.y = height + margen;
      else if (f.y > height + margen) f.y = -margen;
    }

    // --- RENDERIZADO / DIBUJO DE LAS FIGURAS ---
    push();
    translate(f.x, f.y);
    rotate(radians(f.rot));
    fill(f.color);
    
    if (f.tipo === "circulo") {
      ellipse(0, 0, f.tam, f.tam);
    } 
    else if (f.tipo === "rectangulo") {
      rectMode(CENTER);
      rect(0, 0, f.tam, f.tamy);
    } 
    else if (f.tipo === "linea") {
      rectMode(CENTER);
      rect(0, 0, f.tam_linea, f.tamy_linea); 
    }
    pop();
  }
}

// --- NUEVA FUNCIÓN: SE ACTIVA AL HACER CLIC EN EL CANVAS ---
function mousePressed() {
  // Solo se activa si el clic ocurre DENTRO de los límites del canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    
    // El signo "!" invierte el valor actual (si es true pasa a false, y viceversa)
    interaccionActivada = !interaccionActivada; 
    
  }
}

function lineasArriba() {
  if (mouseX>width/2 && mouseY<height/2) {
    ;
  }
  else {
    return false;
  }
}

function lineasAbajo() {
  if (mouseX>width/2 && mouseY>height/2) {
    return true;
  }
  else {
    return false;
  }
}

function rectArriba() {
  if (mouseX<width/2 && mouseY<height/2) {
    return true;
  }
  else {
    return false;
  }
}
  function rectAbajo() {
  if (mouseX>width/2 && mouseY>height/2) {
    return true;
  }
  else {
    return false;
  }
}
