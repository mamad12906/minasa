import { BrowserWindow } from 'electron'

// Resolve the BrowserWindow to parent dialogs against: prefer the sender,
// fall back to focused or the first visible window (matches prior behaviour).
export function getWin(event?: any): BrowserWindow {
  if (event?.sender) {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (w) return w
  }
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}
