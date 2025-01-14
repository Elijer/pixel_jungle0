import './style.css'
import { simplexPositive, simplex2Rounded, simplex2 } from './simplex.js';
import { create } from 'domain';
import { mins } from './mineralFiles/mins@500x500.ts'

const canvas = document.querySelector("canvas");
const ctx = canvas!.getContext("2d");
ctx?.reset()

// Create an off-screen canvas
const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = canvas!.width;
offscreenCanvas.height = canvas!.height;

const offscreenCtx = offscreenCanvas.getContext("2d");

const config = {
  sqSize: 2,
  rows: 500,
  cols: 500,
  timeScale: 20,
  mutationChance: 100,
  maxEntities: 1000000,
  scale: 10,
  invertedMinerals: true,
  mineralNoiseScale: 200
}

const ORGANISM_DECISIONS = {
  H: 0, // HOMEOSTASIS
  I: 1 // INVEST IN REPRODUCTION
} as const;

type OrganismDecisionKey = keyof typeof ORGANISM_DECISIONS;

/* REPRODUCTION DECISIONS
I can't make an enum for this, but here's the idea:
The reproduction decisions just stand for the number of offspring that organism has
whenever they have a reproduction opportunity (note opportunity)
*/

const clr = {
  teal: "#02745C"
  // teal: "#000000"
}
const emptyColor = "#000000"

const clrs = [
  // fireworks
  // "0000FF",
  // "0158F1",
  // "018BF2",
  // Green fireworks
  "#01A292",
  "#024B48",
  "#02745C",
  "#02c6B2"
]

function hexToRGB(str: string): number[]{
  const meat = str.replace(/^#/, '')
  const one = parseInt(meat.slice(0, 2), 16)
  const two = parseInt(meat.slice(2, 4), 16)
  const three = parseInt(meat.slice(4, 6), 16)
  return [one, two, three]
}

function rgbToHex(rgb: number[]): string {
  return rgb.reduce((str, curr)=>str + curr.toString(16), "#")
}

function runMutationChance(chance: number): boolean{
  const chanceOne = Math.floor(Math.random() * chance)
  const chanceTwo = Math.floor(Math.random() * chance)
  return chanceOne === chanceTwo
}

function cloneDNA(original: DNA): DNA {
  return {
    longevity: original.longevity,
    decisions: [...original.decisions],
    reproductiveDecisions: [...original.reproductiveDecisions],
    color: original.color
  }
}

const randomSign = () => (Math.random() < 0.5 ? -1 : 1);

function multipleMutations(dna: DNA): DNA {
  let randomNumberOfMutations = Math.floor(Math.random() * 10)
  while (randomNumberOfMutations > 0){
    dna = potentiallyMutateDNA(dna)
    randomNumberOfMutations--
  }
  return dna
}

function potentiallyMutateDNA(dna: DNA): DNA {

  const mutatedDNA: DNA = cloneDNA(dna)
  // make sure to make a copy and keep parent DNA untouched
  // We are using this special cloneDNA function to make sure we are making a deep copy of each field,
  // not maintaining references to existing decisions arrays, for example

  for (const key of Object.keys(dna) as (keyof DNA)[]){
    const mutation = runMutationChance(config.mutationChance);
    if (!mutation) continue

    switch(key){

      case "longevity":
        const longevityDiff = randomSign()
        const newLongevity = dna.longevity + longevityDiff
        if (newLongevity < 1 || newLongevity > dna.longevity + 1) break // break earlier before exiting longevity bounds
        mutatedDNA.longevity = newLongevity
        break

      case "decisions":
        
        const pushPopModify = Math.floor(Math.random() * 3) // return 0, 1 or 2

        if (!pushPopModify && mutatedDNA.decisions.length > 1){
          mutatedDNA.decisions.pop()
          break
        }

        const randomAction = Math.random() < .5 ? "H" : "I"

        if (pushPopModify === 1){
          mutatedDNA.decisions.push(randomAction)
          break
        }

        const randomIndex = Math.floor(Math.random() * mutatedDNA.decisions.length)
        mutatedDNA.decisions[randomIndex] = randomAction
        break

      case "reproductiveDecisions":
        const pushPopModify2 = Math.floor(Math.random() * 3) // return 0, 1 or 2

        if (!pushPopModify2 && mutatedDNA.reproductiveDecisions.length > 1){
          mutatedDNA.reproductiveDecisions.pop()
          break
        }

        const maxBroodSize = 3
        const randomBroodSize = Math.floor(Math.random() * maxBroodSize) // + 1 would be inclusive of parent longevity, +2 is one more after that

        if (pushPopModify2 === 1){
          mutatedDNA.reproductiveDecisions.push(randomBroodSize)
          break
        }

        const randomIndex2 = Math.floor(Math.random() * mutatedDNA.reproductiveDecisions.length)
        mutatedDNA.reproductiveDecisions[randomIndex2] = randomBroodSize
        break
    }
    try {
      const colorArray = hexToRGB(mutatedDNA.color)

      // Color change based on number of decisions
      colorArray[1] = dna.longevity * 60
      mutatedDNA.color = rgbToHex(colorArray)

      // Color change based on generation
      // if (colorArray[1]>=30){
      //   colorArray[1] -= 10
      //   mutatedDNA.color = rgbToHex(colorArray)
      //   break
      // } else {
      //   colorArray[1] = 255
      //   mutatedDNA.color = rgbToHex(colorArray)
      // }

    } catch (error) {
      console.error("Problem showing mutation with color:", error);
    }

  }
  return mutatedDNA
}

interface DNA {
  longevity: number
  decisions: OrganismDecisionKey[]
  reproductiveDecisions: number[]
  color: string
}

interface Position {
  x: number,
  y: number
}


const defaultDNA: DNA = {
  longevity: 1,
  decisions: ['I'],
  reproductiveDecisions: [2],
  color:  "#6ABBD3"
}

const aberrantDNA: DNA = {
  longevity: 4,
  decisions: ['I'],
  reproductiveDecisions: [2],
  color:  "#6ABBD3"
}

interface Organism {
  id: number,
  mineralRichness: number
  position: Position
  vitality: number
  energy: number
  color: string, // will need to be moved to DNA
  turn: number
  reproductiveTurn: number
  dna: DNA,
}

// function create2DGrid(): (null | Organism)[][] {
//   return Array.from({length: config.rows})
//   .map(
//     ()=>{
//       return Array.from({length: config.cols}).map(_=>null)
//     }
//   )
// }

function createMineralGrid(){
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

const mineralGrid = createMineralGrid()
// const mineralGrid = mins

function visualizeMineralGrid(mineralGrid: number[][]): void {
  for (let y = 0; y < config.rows; y++){
    for (let x = 0; x < config.cols; x++){
      // console.log(rgbToHex([0, 0, Math.floor(300*mineralGrid[x][y])]))
      // [0, 0, Math.floor(30*mineralGrid[x][y])]
      offscreenCtx!.fillStyle = rgbToHex(Array.from({length: 3},()=>Math.floor(30*mineralGrid[x][y])))
      offscreenCtx!.fillRect(x*config.scale, y*config.scale, config.scale, config.scale)
    }
  }
}

// visualizeMineralGrid(mineralGrid)

const grid = create2DGrid()
const entities: Map<number, Organism> = new Map()
let entityCounter = 0

createPlant(aberrantDNA) // create first plant

setInterval(()=>{
  if (entities.size > config.maxEntities){
    for (const [_, plant] of [...entities]){
      plantDie(plant.id)
    }
    return
  }
  for (const [_, plant] of [...entities]){
    handlePlantLifeCycle(plant)
  }
}, config.timeScale)

// let totalEmergences = 6
setInterval(()=>{
  // if (totalEmergences > 0){
    createPlant(aberrantDNA)
    // totalEmergences--
  // }
}, 800)


/* --------- this stuff uses a shadow canvas to batch rendering for performance ---- */
function renderToMainCanvas() {
  ctx!.clearRect(0, 0, canvas!.width, canvas!.height); // Optional: Clear the main canvas
  ctx!.drawImage(offscreenCanvas, 0, 0);
}

function animationLoop() {
  renderToMainCanvas();
  requestAnimationFrame(animationLoop);
}

animationLoop(); // Start the animation loop
/* --------- this stuff uses a shadow canvas to batch rendering for performance ---- */

function handlePlantLifeCycle(plant: Organism){

  plant.vitality-- // by default, plant is degenerating
  const cycle = plant.turn % plant.dna.decisions.length
  const decision = plant.dna.decisions[cycle]
  
  switch (decision){
    case "I": // Invest in future reproduction 
      plant.energy += config.invertedMinerals ? 20 / plant.mineralRichness / 5 : 2 * plant.mineralRichness / 5
      break;
    case "H": // homeostasis - abstain and hang in there
      plant.vitality += 2 * (plant.mineralRichness/10)
  }

  // Now that the plant has handled its energy
  // Can it afford to reproduce? If so, what is its reproduction choice?
  if (plant.energy >= plant.dna.longevity){

    const rCycle = plant.reproductiveTurn % plant.dna.reproductiveDecisions.length
    let progeny = plant.dna.reproductiveDecisions[rCycle] // this translates to a number "how many kids this plant wants to have rn"
    while (progeny){
      // const childDNA = potentiallyMutateDNA(plant.dna) //  get child's DNA
      const childDNA = multipleMutations(plant.dna) //  get child's DNA
      // const childDNA = plant.dna
      if (childDNA.longevity <= plant.energy){
        plant.energy -= childDNA.longevity
        plantReproduce(childDNA, plant.position)
      }
      progeny--
    }
  }

  if (plant.vitality <= 0) plantDie(plant.id)
  plant.turn++
}

// TODO: These directions are biased - since they always go around in the same order,
// They are heavily biased to the reproducing in a certain corner I think
// I'd expect it to be middle bottom, but it looks like it's left bottom
// gotta randomize which one is the start
const directions = [
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [1, -1],
  [-1, 1],
]

function getRandomRelativeLocation(pos: Position, dna: DNA): Position | null {
  for (let i = 0; i < 8; i++) {
    const ranX = Math.floor(Math.random() * 3) - 1;
    const ranY = Math.floor(Math.random() * 3) - 1;
    const x = pos.x + ranX;
    const y = pos.y + ranY;
    if (x >= 0 && x < config.cols && y >= 0 && y < config.rows && (!grid[x][y] || grid[x][y].dna.longevity < dna.longevity / 3)) {
      return { x, y };
    }
  }
  return null;
}

function plantReproduce(dna: DNA, position: Position): void {
  const randomNeighboringSquare = getRandomRelativeLocation(position, dna)
  if (!randomNeighboringSquare){
    // tried 8 times and found no available squares, return null
    // TODO - might be worth saving up - this means plants are trying to reproduce but can't - if they can't, maybe don't make em pay?
    // Maybe they hold on to their energy?
  } else {
    createPlant(dna, randomNeighboringSquare)
  }
}

function plantDie(id: number): void{
  if (!entities.has(id)){
    console.error(`Tried to kill plant ${id} but it doesn't exist`)
    return
  }
  const plant = entities.get(id)!
  const {x, y} = plant.position
  grid[x][y] = null
  entities.delete(id)
  offscreenCtx!.fillStyle = 'black'
  offscreenCtx!.fillRect(x*config.scale, y*config.scale, config.scale, config.scale)
}

function createPlant(dna: DNA = defaultDNA, position: Position = getXY()): void {
  // const dna = potentiallyMutate(parent)
  const newDna = cloneDNA(dna)
  const {x, y} = position
  const id = entityCounter++
  const plant = {
    id,
    mineralRichness: mineralGrid[x][y],
    position: {x, y},
    vitality: dna.longevity,
    energy: 0,
    color: clr.teal,
    turn: 0,
    reproductiveTurn: 0,
    dna: newDna
  }
  grid[x][y] = plant
  // const el = document.getElementById(`sq-${x}-${y}`)
  entities.set(id, plant)
  offscreenCtx!.fillStyle = dna.color
  offscreenCtx!.fillRect(x*config.scale, y*config.scale, config.scale, config.scale)
  // el!.style.backgroundColor = newDna.color
}

function getXY(retries: number = 7){
  const rantile = Math.floor(Math.random() * config.rows * config.cols)
  const y = Math.floor(rantile / config.rows)
  const x = rantile % config.rows
  if (grid[x][y] && retries--){    
    return getXY(retries)
  } else if (!retries){
    console.error("exceeding 7 retries on finding a random spot - there may be no more space left on the board.")
  }
  return {x, y}
}

function create2DGrid(): (null | Organism)[][] {
  return Array.from({length: config.rows})
  .map(
    ()=>{
      return Array.from({length: config.cols}).map(_=>null)
    }
  )
}