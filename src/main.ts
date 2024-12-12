import './style.css'

const config = {
  sqSize: 2,
  rows: 100,
  cols: 100
}

const clr = {
  teal: "#6ABBD3"
}

const emptyColor = "#000000"

const defaultPlantBlueprint: PlantBlueprint = {
  longevity: 1,
  decisions: [0],
  reproductiveDecisions: [2]
}

interface Organism {
  id: number,
  stagger: number
  position: Position
  longevity: number
  vitality: number
  energy: number
  color: string,
  turn: number
  decisions: number[]

  reproductiveTurn: number
  reproductiveDecisions: number[]
}

interface PlantBlueprint {
  longevity: number
  decisions: number[]
  reproductiveDecisions: number[]
}

interface Position {
  x: number,
  y: number
}

const grid = create2DGrid()
const entities: Map<number, Organism> = new Map()
let entityCounter = 0

buildEmptyGrid()
createPlant()

setInterval(()=>{
  for (const [_, plant] of [...entities]){
    const stagger = new Date().getTime() % 10
    if (plant.stagger = stagger){
      handlePlantCycle(plant)
    }
  }
}, 7)

function handlePlantCycle(plant: Organism){
  const {longevity, vitality, energy, turn} = plant
  console.log(`plant of id ${plant.id} has the follow properties at this time:`)
  console.log({longevity, vitality, energy, turn})

  const childLongevityCeiling = plant.longevity + 1    

  plant.vitality--
  const cycle = plant.turn % plant.decisions.length
  const decision = plant.decisions[cycle]

  if (!decision){
    // just survive
    plant.energy += 2
  } else {
    // add energy to store
    plant.vitality++
  }

  // Now that we've handled energy decisions, if plant has enough energy to reproduce, check if that's what it wants to do
  if (plant.energy >= plant.longevity){
    
    const parentPlantBlueprint = {
      longevity: plant.longevity,
      decisions: plant.decisions,
      reproductiveDecisions: plant.reproductiveDecisions
    }

    const rCycle = plant.reproductiveTurn % plant.reproductiveDecisions.length
    const rDecision = plant.reproductiveDecisions[rCycle]
    if (rDecision > 3){
      let childGoal = rDecision - 1
      while (plant.energy > 0 && childGoal > 0){
        plantReproduce(parentPlantBlueprint, plant.position)
        plant.energy -= plant.longevity
        childGoal--
      }
      plant.reproductiveTurn++
    } else if (rDecision === 3 && plant.energy === childLongevityCeiling ){
      plantReproduce(parentPlantBlueprint, plant.position, true) // reproduce with super offspring
      plant.reproductiveTurn++
      // do nothing - keep reproductive turn, and reproductive energy for next time or die trying
    } else if (rDecision === 3 && plant.energy < childLongevityCeiling){
      // do nothing, and hold out for next time
    } else if (rDecision === 2){
      plantReproduce(parentPlantBlueprint, plant.position) // reproduce normally
      plant.reproductiveTurn++
    }
  }

  // cleanup
  if (plant.vitality <= 0) plantDie(plant.id)
  plant.turn++
}

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

function plantReproduce(parent: PlantBlueprint, position: Position, superOffspring: boolean = false): void {
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
      console.error("Tried to reproduce, but nowhere valid to go")
    } else {
      const randomDirection = Math.floor(Math.random() * validDirections.length)
      const { x: ranX, y: ranY } = validDirections[randomDirection]
      createPlant(parent, superOffspring, {x: ranX, y: ranY})
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

function createPlant(parent: PlantBlueprint = defaultPlantBlueprint, superOffspring: boolean = false, position: Position = getXY()): void {
  const {x, y} = position
  const id = entityCounter++
  const computedLongevity =  superOffspring ? parent.longevity + 1 : parent.longevity
  const plant = {
    id,
    stagger: Math.floor(Math.random()*10),
    position: {x, y},
    longevity: computedLongevity,
    vitality: computedLongevity,
    energy: 0,
    color: clr.teal,
    turn: 0,
    decisions: parent.decisions, // 1 is store energy, 0 is maintain
    reproductiveTurn: 0,
    reproductiveDecisions: parent.reproductiveDecisions // 0 is wait, 1 is reproduce, 2 is reproduce with superOffspring (+1 relative longevity)
  }
  grid[x][y] = plant
  const el = document.getElementById(`sq-${x}-${y}`)
  entities.set(id, plant)
  el!.style.backgroundColor = clr.teal
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