import { create } from 'domain'
import './style.css'

const config = {
  sqSize: 2,
  rows: 100,
  cols: 100
}

const grid = create2DGrid()
populateGrid(grid)

function populateGrid(grid: string[][]): void {
  let box = document.getElementById('box')!
  box.innerHTML = ''
  for (let y = 0; y < config.rows; y++){
    let row = document.createElement('div')
    for (let x = 0; x < config.cols; x++){
      let sq = createSq(config.sqSize)
      sq.style.backgroundColor = grid[x][y]
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

function create2DGrid(): string[][] {
  return Array.from({length: config.rows})
  .map(
    ()=>{
      return Array.from({length: config.cols}).map(_=>"#000000")
    }
  )
}