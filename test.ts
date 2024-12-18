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

// console.log(rgbToHex((hexToRBG("#6ABBD3"))
console.log(rgbToHex(hexToRGB('#6ABBD3')))