let mic;
let analizador;

let volumen = 0;
let tipoSonido = "";

function inicializarAudio() {
  mic = new p5.AudioIn();
  mic.start();

  analizador = new p5.FFT();
  analizador.setInput(mic);
}

function procesarAudio() {
  let volCrudo = mic.getLevel();
  volumen = volCrudo * 500; 

  analizador.analyze();

  let energiaGraves = analizador.getEnergy(80, 250);   
  let energiaAgudos = analizador.getEnergy(400, 2000); 

  if (volumen < 5) { 
    tipoSonido = "SILENCIO";
  } else {
    if (energiaGraves > energiaAgudos) {
      tipoSonido = "GRAVE";
    } else {
      tipoSonido = "AGUDO";
    }
  }
}