export interface NormalizedMention {
  externalId: string
  platform: "REDDIT" | "X"
  author?: string
  content: string
  keyword: string
  metadata?: any
}