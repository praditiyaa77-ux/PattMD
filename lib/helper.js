import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'

export const clockString = (ms) => {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const fetchTermai = async (endpoint, params) => {
  if (!global.apiTermai || global.apiTermai === "-") {
    throw new Error("API Key Termai belum diisi! Silakan isi di settings.js (global.apiTermai)")
  }
  const query = new URLSearchParams({ ...params, key: global.apiTermai }).toString()
  const url = `${global.baseTermai}${endpoint}?${query}`
  try {
    const res = await axios.get(url, { timeout: 30000 })
    if (res.data && (res.data.status === false || res.data.status === 'false')) {
      throw new Error(res.data.message || res.data.msg || "API mengembalikan status false")
    }
    if (!res.data || (!res.data.data && !res.data.result)) {
      throw new Error("Format respons API tidak dikenali (data kosong)")
    }
    return res.data.data || res.data.result
  } catch (e) {
    if (e.response) {
      throw new Error(`API Error (${e.response.status}): ${e.response.data?.message || e.message}`)
    }
    throw e
  }
}

export const getBuffer = async (message, type) => {
  const stream = await downloadContentFromMessage(message, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}