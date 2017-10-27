const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const which = require('which');
const process = require('process');

// private

var gitPath = ''; // TODO: Get git pref path on module load
var activeRepoDir = '';

// Get git path from environment
which('git', function(err, result) {
  gitPath = result;
});

function execute(command, callback) {
  exec(command, function(error, stdout, stderr){ callback(stdout, stderr); });
};

function exec_git(command, callback) {
  execute('git ' + command, callback);
}

// public

function getUser(callback){
  return new Promise(function (resolve, reject) {
    exec_git("config --global user.name", function(name, error) {
      if (error)  
        return reject(error);
      else
        exec_git("config --global user.email", function(email, error) {
          if (error)
            return reject(error);
          else 
            return resolve({ name: name.replace("\n", ""), email: email.replace("\n", "") });
        });
    });
  });
}

function open(directoryPath) {
  return new Promise(function (resolve, reject) {
    fs.stat(path.join(directoryPath, '.git'), function (err, stats) {
      // Directory doesn't exist or something.
      if (err)
        return reject(err);
      // This isn't a directory!
      if (!stats.isDirectory())
        return reject(false);
      // Is dir
      else {
        activeRepoDir = directoryPath;
        process.chdir(activeRepoDir);
        return resolve(true);
      }
    });
  });
}

function init(directoryPath) {
  return new Promise(function (resolve, reject) {
    exec_git('init ' + directoryPath, function(out, err) {
      if (err)
        return reject(err);
      else
        return resolve(out);
    });
  });
}

function log() {
  return new Promise(function (resolve, reject) {
    if (!activeRepoDir)
      return reject(false);
    exec_git('log --oneline', function(out, err) {
      if (err)
        return reject(err);
      else {
        return resolve(out.split('\n'));
      }
    })
  });
}

function status() {
  return new Promise(function (resolve, reject) {
    if (!activeRepoDir)
      return reject(false);
    exec_git('status --short', function(out, err) {
      if (err)
        return reject(err);
      else {
        return resolve(out.split('\n'));
      }
    })
  });
}

function get_remotes() {
  return new Promise(function (resolve, reject) {
    if (!activeRepoDir)
      return reject(false);
    exec_git('remote', function(out, err) {
      if (err)
        return reject(err);
      else {
        return resolve(out.split('\n'));
      }
    })
  });
} 

module.exports.repo = {
  getUser: getUser,
  open: open,
  init: init,
  status: status,
  get_remotes: get_remotes,
  log: log
};