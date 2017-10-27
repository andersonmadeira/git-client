const electron = require('electron');
const url = require('url');
const path = require('path');
const git = require('./modules/git');
const cronJob = require("cron").CronJob;

const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let winMain;
let repository = null;

var getMostRecentCommit = function(repository) {
    return repository.getBranchCommit("master");
}
  
var getCommitMessage = function(commit) {
    return commit.message();
};

// Run this cron job every 5 minutes
new cronJob("*/1 * * * *", function() {
    git.repo.status().then(function(lines) {
        winMain.webContents.send('repo:status', lines);
    }, console.err);
}, null, true);

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

ipcMain.on('repo:log', function(e) {
    git.repo.log().then(function(lines) {
        console.log(lines);
    }, console.err);
});

ipcMain.on('repo:open', function(e) {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    },
    function (filePath) {
        if ( filePath ) {
            git.repo.open(filePath[0]).then(function(isRepo) {
                git.repo.log().then(function(lines) {
                    winMain.webContents.send('repo:log', lines);
                }, console.err);
                git.repo.status().then(function(lines) {
                    winMain.webContents.send('repo:status', lines);
                }, console.err);
                git.repo.get_remotes().then(function(lines) {
                    winMain.webContents.send('repo:remotes', lines);
                }, console.err);
            }, function(err) {
                dialog.showMessageBox(winMain, {
                    type: 'question',
                    buttons: [ 'yes', 'no'],
                    title: 'Warning!',
                    message: 'There is not repository here, do you wanna init a new one?'
                }, function(response) {
                    // Confirmed to init repo
                    if (response == 0)
                        git.repo.init(filePath[0]).then(function(output) {
                            dialog.showMessageBox(winMain, { type: 'info', message: output});
                        }, 
                        function(err) {
                            dialog.showMessageBox(winMain, { type: 'error', message: err});
                        });
                });
            });
        }
    });
});