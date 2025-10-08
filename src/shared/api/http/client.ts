import { useHttpClient } from './http'
import { HTTP_CONFIG } from './config'

const http = useHttpClient(HTTP_CONFIG)

export { http }
