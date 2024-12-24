import './style.css'
import { simplexPositive } from './lib/mineralGen/simplex.js';
import { mins } from './lib/mineralGen/mineralFiles/mins-6@500x500.ts'
import { hexToRGB, rgbToHex, randomSign, mutateArray } from './lib/utility.ts';
import { createMineralGrid } from './lib/mineralGen/mineralGen.ts';

interface PlantDNA {
  longevity: number
  decisions: PlantDecisionKey[]
  reproductiveDecisions: number[]
  color: string
}
interface Position {
  x: number,
  y: number
}

interface Plant {
  id: number,
  mineralRichness: number
  position: Position
  vitality: number
  energy: number
  color: string, // will need to be moved to DNA
  turn: number
  reproductiveTurn: number
  dna: PlantDNA,
}

interface Animal {

}

type Organism = (Plant | Animal)

const canvas = document.querySelector("canvas");
const ctx = canvas!.getContext("2d");
ctx?.reset()

// Create an off-screen canvas
const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = canvas!.width;
offscreenCanvas.height = canvas!.height;

const offscreenCtx = offscreenCanvas.getContext("2d");

const simpleStartDNA: PlantDNA = {
  longevity: 1,
  decisions: ['I'],
  reproductiveDecisions: [2],
  color:  "#6ABBD3"
}

const config = {
  sqSize: 2,
  rows: 500,
  cols: 500,
  timeScalePlantLife: 10000,
  plantSpawnRate: 20000,
  mutationChance: 60,
  maxEntities: 1000000,
  scale: 10,
  mineralNoiseScale: 100,
  invertedMinerals: true,
  defaultDNA: simpleStartDNA,
  startingColor: "#02745C"
}

const ORGANISM_DECISIONS = {
  H: 0, // HOMEOSTASIS
  I: 1 // INVEST IN REPRODUCTION
} as const;

type PlantDecisionKey = keyof typeof ORGANISM_DECISIONS;

/* REPRODUCTION DECISIONS: I can't make an enum for this, but here's the idea:
The reproduction decisions just stand for the number of offspring that organism has
whenever they have a reproduction opportunity (note opportunity)
*/

function runMutationChance(chance: number): boolean{
  const chanceOne = Math.floor(Math.random() * chance)
  const chanceTwo = Math.floor(Math.random() * chance)
  return chanceOne === chanceTwo
}

function cloneDNA(original: PlantDNA): PlantDNA {
  return {
    longevity: original.longevity,
    decisions: [...original.decisions],
    reproductiveDecisions: [...original.reproductiveDecisions],
    color: original.color
  }
}

function potentiallyMutateDNA(dna: PlantDNA): PlantDNA {

  const mutatedDNA: PlantDNA = cloneDNA(dna)
  // make sure to make a copy and keep parent DNA untouched
  // We are using this special cloneDNA function to make sure we are making a deep copy of each field,
  // not maintaining references to existing decisions arrays, for example

  for (const key of Object.keys(dna) as (keyof PlantDNA)[]){
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
        mutatedDNA.decisions = mutateArray<PlantDecisionKey>(mutatedDNA.decisions, ["H", "I"])
        break

      case "reproductiveDecisions":
        const maxBroodSize = 3
        const potentialDecisions = [...Array(maxBroodSize)]
        mutatedDNA.reproductiveDecisions = mutateArray<number>(mutatedDNA.reproductiveDecisions, potentialDecisions)
        break
    }
    
    const colorArray = hexToRGB(mutatedDNA.color)
    colorArray[1] = dna.longevity * 50
    mutatedDNA.color = rgbToHex(colorArray)


  }
  return mutatedDNA
}

const mineralGrid = createMineralGrid(config)
// const mineralGrid = mins

const grid = create2DGrid()
const entities: Map<number, (Organism)> = new Map()
let entityCounter = 0

createPlant(simpleStartDNA) // create first plant

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
}, config.timeScalePlantLife)

// let totalEmergences = 6
setInterval(()=>{
  // if (totalEmergences > 0){
    createPlant(simpleStartDNA)
    // totalEmergences--
  // }
}, config.plantSpawnRate)


/* --------- this stuff uses a shadow canvas to batch rendering for performance ---- */
function renderToMainCanvas() {
  ctx!.clearRect(0, 0, canvas!.width, canvas!.height); // Optional: Clear the main canvas
  ctx!.drawImage(offscreenCanvas, 0, 0);
}

function handlePlantLifeCycle(plant: Plant){

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
      const childDNA = potentiallyMutateDNA(plant.dna) //  get child's DNA
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

// function createAnimal(dna: AnimalDNA = config.defaultAnimalDNA, position: Position = getXY()): void {

// }

function createPlant(dna: DNA = config.defaultDNA, position: Position = getXY()): void {
  const newDna = cloneDNA(dna)
  const {x, y} = position
  const id = entityCounter++
  const plant = {
    id,
    mineralRichness: mineralGrid[x][y],
    position: {x, y},
    vitality: dna.longevity,
    energy: 0,
    color: config.startingColor,
    turn: 0,
    reproductiveTurn: 0,
    dna: newDna
  }
  grid[x][y] = plant
  entities.set(id, plant)
  offscreenCtx!.fillStyle = dna.color
  offscreenCtx!.fillRect(x*config.scale, y*config.scale, config.scale, config.scale)
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

function animationLoop() {
  renderToMainCanvas();
  requestAnimationFrame(animationLoop);
}

animationLoop(); // Start the animation loop
/* --------- this stuff uses a shadow canvas to batch rendering for performance ---- */