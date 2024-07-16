import axios from 'axios'

const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development' ? 'http://localhost:5010' : '/',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo)
      if (parsedUserInfo && parsedUserInfo.token) {
        config.headers.authorization = `Bearer ${parsedUserInfo.token}`
      } else {
        console.error('Token is missing in userInfo')
      }
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    Promise.reject(error)
  }
)

export default apiClient
