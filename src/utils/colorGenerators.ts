export const TAG_COLORS = [
  '#a3b18a', '#588157', '#52b788', '#344e41', // Greens
  '#ade8f4', '#00b4d8', '#0077b6', '#003554', // Blues
  '#ffea00', '#ffd000', '#ffa200', '#ff7b00', // Yellows/Oranges
  '#cdb4db', '#ffc8dd', '#ff5c8a', '#ff0a54', // Pinks
]

export function getRandomTagColor(): string {
  const randomIndex = Math.floor(Math.random() * TAG_COLORS.length)
  return TAG_COLORS[randomIndex]
}
