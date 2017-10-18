const electron = require('electron');
const url = require('url');
const path = require('path');
const Git = require('nodegit');

const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let winMain;
let repository = null;

var getMostRecentCommit = function(repository) {
    return repository.getBranchCommit("master");
}
  
var getCommitMessage = function(commit) {
    return commit.message();
};

app.on('ready', function(){
    winMain = new BrowserWindow({
        frame: false,
        titleBarStyle: 'hidden',
        minHeight: 400,
        minWidth: 700
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

ipcMain.on('repo:open', function(e) {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    },
    function (filePath) {
        if ( filePath ) {
            Git.Repository.open(filePath[0])
            .then(getMostRecentCommit)
            .then(getCommitMessage)
            .then(function(message) {
                winMain.webContents.send('repo:selected', message);
            });
        }
    });
});