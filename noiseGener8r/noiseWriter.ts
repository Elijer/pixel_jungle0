import fs from 'fs'
import { simplexPositive } from './simplex.js';

function rgbToHex(rgb: number[]): string {
  return rgb.reduce((str, curr)=>str + curr.toString(16), "#")
}

const config = {
  sqSize: 2,
  rows: 500,
  cols: 500,
  timeScale: 20,
  mutationChance: 100,
  maxEntities: 1000000,
  scale: 10,
  mineralNoiseScale: 100,
  invertedMinerals: true,
  startingColor: "#02745C"
}


function createMineralGrid(){
  const mineralGrid: number[][] = []
  for (let y = 0; y < config.rows; y++){
    const row: number[] = [] // Explicitly declare row as number[]
    for (let x = 0; x < config.cols; x++){
      let noise = +simplexPositive(x, y, config.mineralNoiseScale).toFixed(1) * 10; // Noise is coerced to a number
      row.push(noise)
    }
    mineralGrid.push(row)
  }
  return mineralGrid
}


const mineralGrid = createMineralGrid()


function writeSomeNoise(name, dims){

  fs.writeFile(`../src/mineralFiles/${name}@${dims}x${dims}.ts`, `export const mins = ${JSON.stringify(mineralGrid)}`,  err => {
    if (err){
      console.error(err)
    } else {
      console.log("File written successfully")
    }
  })
}

writeSomeNoise('mins-6', config.cols)