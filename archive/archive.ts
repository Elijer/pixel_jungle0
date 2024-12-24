// function multipleMutations(dna: DNA): DNA {
//   let randomNumberOfMutations = Math.floor(Math.random() * 10)
//   while (randomNumberOfMutations > 0){
//     dna = potentiallyMutateDNA(dna)
//     randomNumberOfMutations--
//   }
//   return dna
// }

// function visualizeMineralGrid(mineralGrid: number[][]): void {
//   for (let y = 0; y < config.rows; y++){
//     for (let x = 0; x < config.cols; x++){
//       // console.log(rgbToHex([0, 0, Math.floor(300*mineralGrid[x][y])]))
//       // [0, 0, Math.floor(30*mineralGrid[x][y])]
//       offscreenCtx!.fillStyle = rgbToHex(Array.from({length: 3},()=>Math.floor(30*mineralGrid[x][y])))
//       offscreenCtx!.fillRect(x*config.scale, y*config.scale, config.scale, config.scale)
//     }
//   }
// }