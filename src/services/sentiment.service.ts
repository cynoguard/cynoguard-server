import type { SentimentType } from "../types/sentiment.js"

const positiveWords = ["good", "great", "love", "excellent", "amazing"]
const negativeWords = ["bad", "terrible", "hate", "worst", "awful"]

export function analyzeSentiment(text: string): SentimentType {
  const lower = text.toLowerCase()

  let score = 0

  positiveWords.forEach(word => {
    if (lower.includes(word)) score++
  })

  negativeWords.forEach(word => {
    if (lower.includes(word)) score--
  })

  if (score > 0) return "POSITIVE"
  if (score < 0) return "NEGATIVE"
  return "NEUTRAL"
}