let figuras = [];
let MColor = "calido";

function setup() {
  createCanvas(450, 600);
}

function draw() {
  background(224, 222, 223);

  for (let i = 0; i < figuras.length; i++) {

    let f = figuras[i];

    if (keyIsDown(65)) { 
      f.rot += 2;
    }

    if (keyIsDown(68)) {
      f.tam += 0.5;
      f.tamy += 0.5;
      f.tam_linea += 0.5;
      f.tamy_linea += 0.5;
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

    if (f.tipo == "rectangulo") {
      rectMode(CENTER);
      rect(0, 0, f.tam, f.tamy);
    }

    if (f.tipo == "linea") {
      rectMode(CENTER);
      rect(0, 0, f.tam_linea, f.tamy_linea);
    }

    pop();
  }
}

function keyPressed() {

  if (keyCode === 32) {

    if (figuras.length >=10) {
      return;
    }

    let tipos = ["circulo", "rectangulo", "linea"];
    let tipoRandom;

    let colorRandom;
    let chance = random(100);

     if (chance < 30) {
        tipoRandom = "linea";
      }
      else if (chance < 90) {
        tipoRandom = "rectangulo";
      }
      else {
        tipoRandom = "circulo";
      }

      let cantidadCirculos = figuras.filter(f => f.tipo === "circulo").length;

    
    if (tipoRandom === "circulo" && cantidadCirculos > 0) {
      tipoRandom = "rectangulo";
      }

      let colorNegro = color(15, 15, 15);

    let cantidadNegroTotal = figuras.filter(f => 
      f.color.levels[0] === 15 && 
      f.color.levels[1] === 15 && 
      f.color.levels[2] === 15
    ).length;

    if (MColor == "calido") {

      let cantidadNegro = figuras.filter(f => f.color.toString() === color(15, 15, 15).toString()).length;

      if (chance < 40) {
        colorRandom = color(181, 22, 22);
      }
      else if (chance < 70) {
        colorRandom = color(219, 172, 24);
      }
      else if (chance < 90) {
        colorRandom = color(97, 60, 51);
      }
      else if (cantidadNegroTotal === 0) {
        colorRandom = colorNegro;
      } else {
        colorRandom = color(181, 22, 22); 
      }

    }
    
    else {

      if (chance < 70) {
        colorRandom = color(38, 55, 99);
      }
      else if (chance < 30){
        colorRandom = color(91, 127, 69);
      }
      else if (cantidadNegroTotal === 0) {
        colorRandom = colorNegro;
      }
      else {
        colorRandom = color(91, 127, 69);
      }
    }

    let nuevaFigura = {
      tipo: tipoRandom,

      x: random(width),
      y: random(height),
      tam: random(50, 150),
      tamy: random(100, 150),
      tam_linea: random (10, 30),
      tamy_linea: random (100, 400),
      color: colorRandom,
      rot: random(0, 360),
    };
    
    figuras.push(nuevaFigura);
  }


  if (key == 'w' || key == 'W') {
    MColor = "calido";
  }

  if (key == 'e' || key == 'E') {
    MColor = "frio";
  }

  if (keyCode === BACKSPACE || keyCode === DELETE) {
    figuras.pop();
  }

}
