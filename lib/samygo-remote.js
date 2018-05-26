const net = require('net');
const http = require('http');
const PiExec = require('./pi-exec');

const GetVolumeRegex = /<CurrentVolume>(\d+)<\/CurrentVolume>/i;

class Remote {
    constructor(log, config) {
        if (!config.ip) throw new Error("TV host is required");

        this.config = config;
        this.log = log;

        this.config.telnetPort = config.telnetPort || 2345;
        this.config.soapPort = config.soapPort || 52235;
        this.config.timeout = config.timeout || 5000;

        this.log.debug("*********************************");
        this.log.debug("Initialize SamyGO Remote");
        this.log.debug(`Host: ${this.config.ip}`);
        this.log.debug(`Telnet port: ${this.config.telnetPort}`);
        this.log.debug(`SOAP port: ${this.config.soapPort}`);
        this.log.debug(`Timeout: ${this.config.timeout}`);
        this.log.debug("*********************************");
    }

    sendKey(key, close) {
        var config = this.config;
        var log = this.log;
        return new Promise((resolve, reject) => {
            if (key) {
                var socket = new net.Socket();
                socket.setTimeout(config.timeout);
                log.debug(`Try to open socket to ${config.ip}:${config.telnetPort}`);
                socket.connect(config.telnetPort, config.ip, () => {
                    log.debug(`Socket connected to ${config.ip}:${config.telnetPort}`);
                    log.debug(`Write to socket: ${key}`);
                    socket.write(key);
                    if(close) {
                        socket.end();
                        socket.destroy();
                    }
                });

                socket.on('data', () => {
                    log.debug('Socket data');
                    socket.end();
                    socket.destroy();
                });

                socket.on('close', () => {
                    log.debug('Close socket');
                    resolve();
                });

                socket.on('error', (error) => {
                    socket.end();
                    socket.destroy();
                    log.error(`Socket error: ${error.message}`);

                    var errorMsg;
                    if (error.code === 'EHOSTUNREACH' || error.code === 'ECONNREFUSED') {
                        errorMsg = 'SamyGO Remote Client: Device is off or unreachable';
                    } else {
                        errorMsg = `SamyGO Remote Client: ${error.code}`;
                    }

                    reject(errorMsg);
                });

                socket.on('timeout', function() {
                    socket.end();
                    socket.destroy();
                    reject("Timeout");
                });
            } else {
                reject('Missing key');
            }
        });
    }

    setVolume(volume) {
        var soapMessage = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <ns0:SetVolume xmlns:ns0="urn:schemas-upnp-org:service:RenderingControl:1">
            <InstanceID>0</InstanceID>
            <Channel>Master</Channel>
            <DesiredVolume>${volume}</DesiredVolume>
        </ns0:SetVolume>
    </s:Body>
</s:Envelope>`;
        return executeSoap.call(this, 'SetVolume', soapMessage);
    }

    getVolume() {
        var soapMessage = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <ns0:GetVolume xmlns:ns0="urn:schemas-upnp-org:service:RenderingControl:1">
            <InstanceID>0</InstanceID>
            <Channel>Master</Channel>
        </ns0:GetVolume>
    </s:Body>
</s:Envelope>`;

        var log = this.log;
        return new Promise((resolve, reject) => {
            executeSoap.call(this, 'GetVolume', soapMessage).then((response) => {
                try {
                    var match = GetVolumeRegex.exec(response);
                    if (match !== null) {
                        resolve(parseInt(match[1]), 10);
                    } else {
                        log.error(`getVolume Error: ${response}`);
                        reject("response error");
                    }
                } catch (e) {
                    reject(e.description);
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

    isAlive() {
        var log = this.log;
        log.debug("SamyGO is Alive");
        return new Promise((resolve, reject) => {
            try {
                PiExec.exec("ping -c 1 " + this.config.ip, (out) => {
                    log.debug(out)
                    resolve(true);
                }, (error) => {
                    log.error(error);
                    resolve(false);
                });
            } catch (e) {
                reject(e.message);
            }
        });
    }
}

function executeSoap(action, soapMessage) {
    var log = this.log;
    var config = this.config;

    var http_options = {
        hostname: config.ip,
        port: config.soapPort,
        path: '/upnp/control/RenderingControl1',
        method: 'POST',
        headers: {
            'POST': '/upnp/control/RenderingControl1 HTTP/1.0',
            'Content-Type': 'text/xml; charset="utf-8"',
            'SOAPACTION': `"SoapAction:urn:schemas-upnp-org:service:RenderingControl:1#${action}"`,
            'Cache-Control': 'no-cache',
            'Host': `${config.ip}:${config.soapPort}`,
            'Content-Length': soapMessage.length,
            'Connection': 'Close'
        }
    };

    return new Promise((resolve, reject) => {
        var req = http.request(http_options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (data) => {
                log.debug(`executeSoap response: ${data}`);
                resolve(data);
            });
        });

        req.on('error', (e) => {
            log.error(`executeSoap error: ${e}`);
            reject(e.message);
        });

        req.write(soapMessage);
        req.end();
    });
}

module.exports = Remote;