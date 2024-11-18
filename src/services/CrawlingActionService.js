import axios from 'axios'
import { BASE_URL } from './Parameters'

const MAIN_URL = `${BASE_URL}/crawling/operations`

export const useCrawlingActionService = () => {
  const process = async profileId => {
    try {
      const response = await axios.post(`${MAIN_URL}/process`, { profileId })
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const start = async profileId => {
    try {
      const response = await axios.post(`${MAIN_URL}/start`, { profileId })
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const stop = async profileId => {
    try {
      const response = await axios.post(`${MAIN_URL}/stop`, { profileId })
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const status = async profileId => {
    try {
      const response = await axios.post(`${MAIN_URL}/status`, { profileId })
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const statusBatch = async idList => {
    try {
      const response = await axios.post(`${MAIN_URL}/status-batch`, {
        idList,
      })
      return {
        success: true,
        message: 'İşlem tamamlandı',
        response: response,
      }
    } catch (error) {
      console.error('process error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  return {
    process,
    start,
    stop,
    status,
    statusBatch,
  }
}
