export function hexToRGB(str: string): number[]{
  const meat = str.replace(/^#/, '')
  const one = parseInt(meat.slice(0, 2), 16)
  const two = parseInt(meat.slice(2, 4), 16)
  const three = parseInt(meat.slice(4, 6), 16)
  return [one, two, three]
}

export function rgbToHex(rgb: number[]): string {
  return rgb.reduce((str, curr)=>str + curr.toString(16), "#")
}

export const randomSign = () => (Math.random() < 0.5 ? -1 : 1);

export function mutateArray<T>(input: T[], choices: T[]): T[] {
  const newArray = [...input]
  const popPushModify = Math.floor(Math.random() * 3) // return 0, 1 or 2

  if (popPushModify === 0){
    newArray.pop()
  }

  const randomAction = choices[Math.floor(Math.random() * choices.length)]

  if (popPushModify === 1){
    newArray.push(randomAction)
  }

  if (popPushModify === 2){
    const randomIndex = Math.floor(Math.random() * input.length)
    newArray[randomIndex] = randomAction
  }

  return newArray
} 