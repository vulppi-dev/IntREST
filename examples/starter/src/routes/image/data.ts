import { assetsStream } from '@vulppi/intrest'

export const getImage = () => assetsStream('image.jpg', 'gzip, deflate')
