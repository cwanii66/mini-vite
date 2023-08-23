import cac from 'cac'
import { startDevServer } from './server'

const cli = cac('mini-vite')

cli
  .command('[root]', 'Run the development server')
  .alias('serve')
  .alias('dev')
  .action(async () => {
    await startDevServer()
  })

cli.help()

cli.parse()
