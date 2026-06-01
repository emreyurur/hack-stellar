import { trustlines, yieldPositions } from '../../data/stellarMock'

export type TerminalLine =
  | {
      id: string
      kind: 'log' | 'success' | 'error' | 'command'
      text: string
    }
  | {
      id: string
      kind: 'yield-table'
    }
  | {
      id: string
      kind: 'help'
    }

type CommandContext = {
  now: () => string
}

type CommandHandler = (context: CommandContext) => TerminalLine[]

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

const sweepAssets = trustlines.filter((asset) => asset.dust)

const commands: Record<string, CommandHandler> = {
  'sweep all': () => [
    {
      id: createId('sweep'),
      kind: 'log',
      text: `Sweeping ${sweepAssets.length} trustlines through PathPaymentStrictReceive...`,
    },
    {
      id: createId('sweep'),
      kind: 'log',
      text: 'Building batch operations with XLM bridge pathfinding.',
    },
    {
      id: createId('sweep'),
      kind: 'log',
      text: 'Applying fee bump envelope and requesting Freighter signature.',
    },
    {
      id: createId('sweep'),
      kind: 'success',
      text: 'Transaction signed. Dust consolidated into USDC.',
    },
  ],
  '/sweep': (context) => commands['sweep all'](context),
  'show yield': () => [
    {
      id: createId('yield'),
      kind: 'yield-table',
    },
  ],
  '/yield': (context) => commands['show yield'](context),
  help: () => [
    {
      id: createId('help'),
      kind: 'help',
    },
  ],
  '/help': (context) => commands.help(context),
}

export const availableCommands = Object.keys(commands)

export function runDeterministicCommand(rawCommand: string): TerminalLine[] {
  const command = rawCommand.trim().toLowerCase()
  const handler = commands[command]

  if (!handler) {
    return [
      {
        id: createId('error'),
        kind: 'error',
        text: `Unknown command: "${rawCommand}". Type help for the hardcoded command list.`,
      },
    ]
  }

  return handler({
    now: () => new Date().toLocaleTimeString(),
  })
}

export function getYieldRows() {
  return yieldPositions
}

