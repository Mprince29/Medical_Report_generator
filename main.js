const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let serverStarted = false; // Track if the server has started

function startServer() {
    return new Promise((resolve, reject) => {
        console.log("Starting backend server...");
        const serverProcess = exec('node systemserver.js');

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server output: ${data}`);
            if (data.includes("Server running on")) { // Ensure it’s fully running
                serverStarted = true;
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`Server stderr: ${data}`);
        });

        serverProcess.on('error', (err) => {
            console.error(`Error starting server: ${err.message}`);
            reject(err);
        });
    });
}

app.whenReady().then(async () => {
    try {
        await startServer();
    } catch (error) {
        console.error("Failed to start server:", error);
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // **✅ FIX: Wait for the server to start before loading the UI**
    if (serverStarted) {
        mainWindow.loadURL('http://localhost:3000'); // Adjust if needed
    } else {
        console.error("Server did not start. Check logs for errors.");
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
