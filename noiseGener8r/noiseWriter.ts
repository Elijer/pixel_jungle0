import fs from 'fs'
import { simplexPositive } from './simplex.js';

function rgbToHex(rgb: number[]): string {
  return rgb.reduce((str, curr)=>str + curr.toString(16), "#")
}

const config = {
  sqSize: 2,
  rows: 500,
  cols: 500,
  timeScale: 10,
  mutationChance: 20,
  maxEntities: 1000000,
  scale: 10,
  mineralNoiseScale: 200
}


function createMineralGrid(){
  const mineralGrid: number[][] = []
  for (let y = 0; y < config.rows; y++){
    const row: number[] = []
    for (let x = 0; x < config.cols; x++){
      let noise = Math.max((+simplexPositive(x, y, config.mineralNoiseScale).toFixed(1) * 10) + 4, 0) // noise is just the size of noise distributed over coords
      row.push(noise)
    }
    mineralGrid.push(row)
  }
  return mineralGrid
}

function visualizeMineralGrid(mineralGrid: number[][]): void {
  const mineralGridInColors: string[][] = []
  for (let y = 0; y < config.rows; y++){
    const row: string[] = []
    for (let x = 0; x < config.cols; x++){
      // console.log(rgbToHex([0, 0, Math.floor(300*mineralGrid[x][y])]))
      // [0, 0, Math.floor(30*mineralGrid[x][y])]
      const color = rgbToHex(Array.from({length: 3},()=>Math.floor(30*mineralGrid[x][y])))
      row.push(color)
    }
  }
}

const mineralGrid = createMineralGrid()


function writeSomeNoise(name, dims){

  fs.writeFile(`../src/mineralFiles/${name}@${dims}x${dims}.ts`, `export const mins = ${JSON.stringify(mineralGrid)}`, err=>{
    console.error("problem writing file")
  })
}

writeSomeNoise('mins-4', config.cols)