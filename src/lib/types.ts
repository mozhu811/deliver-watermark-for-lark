export interface Watermark {
  from: string
  to: string
  time?: Date
  pContent?: string
  customizeContent: string
}

export interface TabProps {
  pluginId?: string,
  tenantKey?: string,
  baseUserId?: string,
}