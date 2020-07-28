import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { IpcRenderer } from 'electron'

export enum KeyCode {
  VK_KEY_C = 0x43,
  VK_KEY_F = 0x46,
  VK_KEY_V = 0x56,
  VK_RETURN = 0x0d,
  VK_LMENU = 0xa4,
  VK_RMENU = 0xa5,
  VK_LEFT = 0x25,
  VK_RIGHT = 0x27,
  VK_X = 0x58,
  VK_ESC = 0x1b,
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  private readonly ipcRenderer: IpcRenderer

  constructor(electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public setKeyboardDelay(delay: number): void {
    this.ipcRenderer.sendSync('set-keyboard-delay', delay)
  }

  public keyTap(code: KeyCode, modifiers: string[] = []): void {
    this.ipcRenderer.sendSync('key-tap', code, modifiers)
  }

  public keyToggle(code: KeyCode, down: boolean, modifiers: string[] = []): void {
    this.ipcRenderer.sendSync('key-toggle', code, down ? 'down' : 'up', modifiers)
  }
}
