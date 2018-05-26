const { exec } = require('child_process');

function piExec(command, fulfill, reject) {
    exec(command, (err, stdout) => {
        if (err) {
            reject(`${err}`);
            return;
        }
        fulfill(`${stdout}`);
    });
}

module.exports = {
    exec: piExec
};

