import './style.css'

const config = {
  sqSize: 2,
  rows: 100,
  cols: 100,
  timeScale: 500,
  mutationChance: 5,
  reproductionStagger: 3,
  maxEntities: 5000
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
  teal: "#6ABBD3"
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

function potentiallyMutateDNA(dna: DNA): DNA {

  const mutatedDNA: DNA = cloneDNA(dna)
  // make sure to make a copy and keep parent DNA untouched
  // We are using this special cloneDNA function to make sure we are making a deep copy of each field,
  // not maintaining references to existing decisions arrays, for example

  for (const key of Object.keys(dna) as (keyof DNA)[]){
    const mutation = runMutationChance(config.mutationChance);
    if (!mutation) continue;
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
      if (colorArray[1]>=10){
        colorArray[1] -= 10 
        mutatedDNA.color = rgbToHex(colorArray)
        break
      } else {
        colorArray[1] = 255
        mutatedDNA.color = rgbToHex(colorArray)
      }
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

interface Organism {
  id: number,
  stagger: number
  position: Position
  vitality: number
  energy: number
  color: string, // will need to be moved to DNA
  turn: number
  reproductiveTurn: number
  dna: DNA,
}

const grid = create2DGrid()
const entities: Map<number, Organism> = new Map()
let entityCounter = 0

buildEmptyGrid()
createPlant() // create first plant

setInterval(()=>{
  if (entities.size > config.maxEntities){
    for (const [_, plant] of [...entities]){
      plantDie(plant.id)
    }
    createPlant() // create first plant
    return
  }
  for (const [_, plant] of [...entities]){
    const stagger = new Date().getTime() % 10
    if (plant.stagger = stagger){
      handlePlantLifeCycle(plant)
    }
  }
}, config.timeScale)

// setInterval(()=>{
//   createPlant()
// }, 3000)

function handlePlantLifeCycle(plant: Organism){


  plant.vitality-- // by default, plant is degenerating
  const cycle = plant.turn % plant.dna.decisions.length
  const decision = plant.dna.decisions[cycle]
  
  switch (decision){
    case "I": // Invest in future reproductiong
      plant.energy += 2
      break;
    case "H": // homeostasis - abstain and hang in there
      plant.vitality++
  }

  // Now that the plant has handled its energy
  // Can it afford to reproduce? If so, what is its reproduction choice?
  if (plant.energy >= plant.dna.longevity){

    const rCycle = plant.reproductiveTurn % plant.dna.reproductiveDecisions.length
    let progeny = plant.dna.reproductiveDecisions[rCycle] // this translates to a number "how many kids this plant wants to have rn"
    while (progeny){
      const childDNA = potentiallyMutateDNA(plant.dna) //  get child's DNA
      // const childDNA = plant.dna
      if (childDNA.longevity <= plant.energy){
        plant.energy -= childDNA.longevity
        plantReproduce(childDNA, plant.position)
      }

      // yes, an overbudget superLongevitous plant might exit repro cycle early, but it's better than an infinite loop
      // So this will punish plants who try to reproduce when they don't have enough, which is fine
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
  [1, -1], 
  [1, 0],
  [1, 1],
  [0, 1],
  [0, -1],
  [-1, -1],
  [-1, 0]
]

function plantReproduce(dna: DNA, position: Position): void {
  const validDirections = []
  const {x: parentX, y: parentY} = position
  for (const dir of directions){
    const x = dir[0] + parentX
    const y = dir[1] + parentY
    if (x >= 0 && x < config.cols && y >= 0 && y < config.rows){
      if (!grid[x][y]){
        validDirections.push({x, y})
      }
    }
    if (!validDirections.length){
      // console.error("Tried to reproduce, but nowhere valid to go")
    } else {
      const randomDirection = Math.floor(Math.random() * validDirections.length)
      const { x: ranX, y: ranY } = validDirections[randomDirection]
      // TODO: I dunno if I'm checking to see if a plant exists already somewhere
      if (grid[ranX][ranY]) return
      createPlant(dna, {x: ranX, y: ranY})
    }
  }
  console.log("plant reproduce")
}

function plantDie(id: number): void{
  if (!entities.has(id)){
    console.error(`Tried to kill plant ${id} but it doesn't exist`)
    return
  }
  const plant = entities.get(id)!
  const {x, y} = plant.position
  const el = document.getElementById(`sq-${x}-${y}`)
  if (el){
    el.style.backgroundColor = "#000000"
  }
  grid[x][y] = null
  entities.delete(id)
}

function createPlant(dna: DNA = defaultDNA, position: Position = getXY()): void {
  // const dna = potentiallyMutate(parent)
  const newDna = cloneDNA(dna)
  const {x, y} = position
  const id = entityCounter++
  const plant = {
    id,
    stagger: Math.floor(Math.random()*config.reproductionStagger),
    // stagger: Math.floor(Math.random()*10),
    // stagger: 1,
    position: {x, y},
    vitality: dna.longevity,
    energy: 0,
    color: clr.teal,
    turn: 0,
    reproductiveTurn: 0,
    dna: newDna
  }
  grid[x][y] = plant
  const el = document.getElementById(`sq-${x}-${y}`)
  entities.set(id, plant)
  el!.style.backgroundColor = newDna.color
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

function buildEmptyGrid(): void {
  let box = document.getElementById('box')!
  box.innerHTML = ''
  for (let y = 0; y < config.rows; y++){
    let row = document.createElement('div')
    for (let x = 0; x < config.cols; x++){
      let sq = createSq(config.sqSize)
      sq.style.backgroundColor = emptyColor
      sq.id = `sq-${x}-${y}`
      row.appendChild(sq);
    }
    box.appendChild(row);
  }
}

function createSq(sqSize: number){
  let sq = document.createElement("div");
  sq.classList.add("sq");
  sq.style.cssText = `
    padding: ${sqSize}px;
    width: ${sqSize}px;
    height: ${sqSize}px;
    font-size: 10px;
    text-align: center;
  `;
  return sq;
}

function create2DGrid(): (null | Organism)[][] {
  return Array.from({length: config.rows})
  .map(
    ()=>{
      return Array.from({length: config.cols}).map(_=>null)
    }
  )
}