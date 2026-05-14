let figuras = [];
let MColor = "calido";

function setup() {
  createCanvas(600, 1000);
}

function draw() {
  background(210);

  for (let i = 0; i < figuras.length; i++) {

    let f = figuras[i];

    if (keyIsDown(65)) { 
      f.rot += 2;
    }

    if (keyIsDown(68)) {
      f.tam += 0.5;
    }

    push();

    translate(
      f.x,
      f.y
    );

    rotate(radians(f.rot));

    fill(f.color);
    noStroke();

    if (f.tipo == "circulo") {
      ellipse(0, 0, f.tam, f.tam);
    }

    if (f.tipo == "cuadrado") {
      rectMode(CENTER);
      rect(0, 0, f.tam, f.tam);
    }

    if (f.tipo == "triangulo") {
      triangle(
        -f.tam/2, f.tam/2,
        0, -f.tam/2,
        f.tam/2, f.tam/2
      );
    }

    pop();
  }
}

function keyPressed() {

  if (keyCode === 32) {

    let tipos = ["circulo", "cuadrado", "triangulo"];
    let tipoRandom = random(tipos);

    let colorRandom;


    if (MColor == "calido") {

      let coloresCalidos = [
        color(255, 0, 0),
        color(255, 120, 0),
        color(255, 220, 0)
      ];

      colorRandom = random(coloresCalidos);

    } else {
      let coloresFrios = [
        color(0, 100, 255),
        color(120, 0, 255),
        color(0, 255, 255)
      ];
      colorRandom = random(coloresFrios);

    }

    let nuevaFigura = {
      tipo: tipoRandom,

      x: random(width),
      y: random(height),
      tam: random(50, 150),
      color: colorRandom,
      rot: 0
    };
    
    figuras.push(nuevaFigura);
  }


  if (key == 'w' || key == 'W') {
    MColor = "calido";
  }

  if (key == 'e' || key == 'E') {
    MColor = "frio";
  }

  if (keyCode === DELETE) {
    figuras.pop();
  }

}
