import { IpcMain, Rectangle } from 'electron'
import * as path from 'path'
import { getActiveWindow, Window } from './window'

const POE_NAMES = [
  'pathofexile_x64_kg.exe',
  'pathofexile_kg.exe',
  'pathofexile_x64steam.exe',
  'pathofexilesteam.exe',
  'pathofexile_x64.exe',
  'pathofexile.exe',
  'pathofexile_x64_kg',
  'pathofexile_kg',
  'pathofexile_x64steam',
  'pathofexilesteam',
  'pathofexile_x64',
  'pathofexile',
  'wine64-preloader', // linux
]

const POE_TITLES = ['Path of Exile']

const POE_ALTERNATIVE_TITLES = ['Path of Exile <---> ']

export class Game {
  private window: Window;
  private windowPath: string;

  public active?: boolean
  public bounds?: Rectangle

  private ipcMain: IpcMain;

  constructor(ipcMain:IpcMain){
    this.ipcMain = ipcMain;
  }

  public async update(): Promise<boolean> {
    const old = this.toString()

    const window = await getActiveWindow()
    if (window) {
      const windowPath = (window.path || '').toLowerCase();
      const name = path.basename(windowPath)
      if (POE_NAMES.includes(name)) {
        const title = window.title()
        if (POE_TITLES.includes(title) || POE_ALTERNATIVE_TITLES.some((x) => title.startsWith(x))) {
        this.ipcMain.emit('logs-file-found', `${windowPath.substring(0, windowPath.lastIndexOf('\\'))}\\logs\\Client.txt`);

          this.window = window
          this.active = true
          this.bounds = window.bounds()
        } else {
          this.active = false
        }
      } else {
        this.active = false
      }
    } else {
      this.active = false
    }
    return old !== this.toString()
  }

  public focus(): void {
    if (this.window?.bringToTop) {
      this.window.bringToTop()
    }
  }

  private toString(): string {
    return JSON.stringify({
      active: this.active,
      bounds: this.bounds,
      processId: this.window?.processId,
    })
  }
}

export function register(ipcMain: IpcMain, onUpdate: (game: Game) => void): void {
  const game = new Game(ipcMain)

  ipcMain.on('game-focus', (event) => {
    game.focus()
    event.returnValue = true
  })

  ipcMain.on('game-send-active-change', (event) => {
    onUpdate(game)
    event.returnValue = true
  });

  setInterval(async () => {
    if (await game.update()) {
      onUpdate(game)
    }
  }, 500)
}
