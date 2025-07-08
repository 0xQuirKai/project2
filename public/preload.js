contextBridge.exposeInMainWorld('api', {
    createTrip: (data) => ipcRenderer.invoke('create-trip', data),
    addBooking: (data) => ipcRenderer.invoke('add-booking', data),
    getClientFiles: (name) => ipcRenderer.invoke('get-client-files', name),
    deleteClient: (id) => ipcRenderer.invoke('delete-client', id),
    addClient: (data) => ipcRenderer.invoke('add-client', data),
    getTripClients: (tripId) => ipcRenderer.invoke('get-trip-clients', tripId),
    uploadPassport: (name, files) => ipcRenderer.invoke('upload-passport', name, files),
});