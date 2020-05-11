import { transpileJS } from './work';
const file: string = require.resolve('../../fixtures/jquery.js')

;(async () => {
  try {
    await transpileJS(file, false)
  } catch (err) {
    console.error(err)
  }
})()
