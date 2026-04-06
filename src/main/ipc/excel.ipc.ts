// Excel IPC handlers are now registered in index.ts directly
// This file is kept for backward compatibility but registerExcelIPC is a no-op
// since all Excel/Backup handlers are registered before SQLite IPC

export function registerExcelIPC(): void {
  // All handlers moved to index.ts registerFileIPC()
  // This prevents duplicate registration errors
  console.log('[excel.ipc] Handlers already registered in index.ts')
}
