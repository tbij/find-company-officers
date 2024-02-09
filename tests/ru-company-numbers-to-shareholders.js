import Ava from 'ava'
import FSExtra from 'fs-extra'
import Reconcile from '../reconcile.js'

Ava('standard', async test => {
    test.timeout(30 * 1000)
    const filename = './tests/data/ru-company-numbers.csv'
    const reconcillation = await Reconcile('ru-company-numbers-to-shareholders', filename, {
        companyNumberField: 'companyNumber'
    })
    const processing = await reconcillation.run()
    const results = await processing.flatten().toArray()
    // await FSExtra.writeJson('./tests/expectations/ru-company-numbers-to-shareholders.json', results) // for updates!
    const resultsExpected = await FSExtra.readJson('./tests/expectations/ru-company-numbers-to-shareholders.json')
    test.deepEqual(results, resultsExpected)
})
