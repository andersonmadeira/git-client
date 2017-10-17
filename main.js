const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let winMain;

app.on('ready', function(){
    winMain = new BrowserWindow({
        frame: false,
        titleBarStyle: 'hidden'
    });
    
    winMain.loadURL(url.format({
        pathname: path.join(__dirname, 'assets', 'views', 'main.html'),
        protocol: 'file:',
        slashes: true
    }));

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
});

const mainMenuTemplate = [
    {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
            app.quit();
        }
    }
];

if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toogle Dev Tools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

ipcMain.on('win:minimize', function(e) {
    winMain.minimize();
});

ipcMain.on('win:maximize', function(e) {
    if (winMain.isMaximized())
        winMain.restore();
    else 
        winMain.maximize();
});

ipcMain.on('win:close', function(e) {
    app.quit();
});