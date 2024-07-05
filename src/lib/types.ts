export interface Watermark {
  from: string,
  to: string,
  time?: Date
}

export interface TabProps{
  pluginId?: string,
  tenantKey?: string
  baseUserId?: string
}