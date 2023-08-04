import { object, string, optional, email } from 'valibot'

const schema = object({
  name: string(),
  birthday: string(),
})

console.log()
