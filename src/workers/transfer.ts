import { transpileJS } from './work';
const file: string = require.resolve('../../fixtures/jquery.js')

;(async () => {
  try {
    await transpileJS(file, true)
  } catch (err) {
    console.error(err)
  }
})()
