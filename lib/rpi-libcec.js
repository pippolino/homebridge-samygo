
/* ****************************** */
/*      Need LibCec installed     */
/* sudo apt-get install cec-utils */
/* ****************************** */

const PiExec = require('./pi-exec');

class LibCec {
    constructor(log, config) {
        this.log = log;
        this.config = config;
    }

    adapterOn() {
        return execCommand.call(this, 'echo "on 0000" | cec-client -d 1 -s "standby 0" RPI', 'opening a connection to the CEC adapter');
    }

    adapterStandby() {
        return execCommand.call(this, 'echo "standby 0000" | cec-client -d 1 -s "standby 0" RPI', 'opening a connection to the CEC adapter');
    }

    adapterStatus() {
        return execCommand.call(this, 'echo "pow 0000" | cec-client -d 1 -s "standby 0" RPI', 'power status: standby');
    }
}

function execCommand(command, outputToSearch) {
    var log = this.log;
    return new Promise((resolve, reject) => {
        try {
            PiExec.exec(command, (out) => {
                log.debug(out);
                if(out.includes(outputToSearch)) {
                    resolve();
                } else {
                    reject("error");
                }
            }, (error) => {
                log.error(error)
                reject(error.message);
            });
        } catch (e) {
            log.error(e)
            reject(e.message);
        }
    });
}

module.exports = LibCec;