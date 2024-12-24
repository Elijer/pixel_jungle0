import { simplexPositive } from "./simplex"

export function createMineralGrid(config: any){
  const mineralGrid: number[][] = []
  for (let y = 0; y < config.rows; y++){
    const row = []
    for (let x = 0; x < config.cols; x++){
      let noise = +simplexPositive(x, y, config.mineralNoiseScale).toFixed(1) * 10 // noise is just the size of noise distributed over coords
      console.log(noise)
      row.push(noise)
    }
    mineralGrid.push(row)
  }
  return mineralGrid
}
