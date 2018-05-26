const SamyGoRemote = require('./samygo-remote');
const LibCec = require('./rpi-libcec');
const packageConfig = require('../package.json');

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;

let homebridgeRef;
let characteristicsRef

class SamyGoPlatform {
    constructor(log, config) {
        this.log = log;
        this.config = config || { ip: "127.0.0.1" };
        this.name = this.config["name"] || "SamyGO remote control";
        this.api = homebridgeRef;

        this.log.info("**************************************************************");
        this.log.info("  Homebridge SamyGO v"+packageConfig.version+" By Pippolino   ");
        this.log.info("  GitHub: https://github.com/pippolino/homebridge-samygo      ");
        this.log.info("**************************************************************");
        this.log.info('%s v%s, node %s, homebridge v%s',
            packageConfig.name, packageConfig.version, process.version, this.api.serverVersion
        );
        this.log.info('Accessory %s (%s) initialized...', this.name, this.config.ip);

        PlatformAccessory = this.api.platformAccessory;
        Accessory = this.api.hap.Accessory;
        Service = this.api.hap.Service;
        Characteristic = this.api.hap.Characteristic;

        this.infoService = new Service.AccessoryInformation()
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(Characteristic.Model, 'SamyGO Model')
            .setCharacteristic(Characteristic.SerialNumber, this.config.ip);

        this.remote = new SamyGoRemote(this.log, this.config);
        this.libCec = new LibCec(this.log, this.config);

        this.powerService = new Service.Switch(this.config.name);
        this.powerService.getCharacteristic(Characteristic.On)
            .on('get', getOn.bind(this))
            .on('set', setOn.bind(this));

        this.volumeService = new Service.Lightbulb(`${this.config.name} Volume`);
        this.volumeService.getCharacteristic(Characteristic.On)
            .on('get', getMuteState.bind(this))
            .on('set', setMuteState.bind(this));

        this.volumeService.getCharacteristic(Characteristic.Brightness)
            .on('get', getVolume.bind(this))
            .on('set', setVolume.bind(this));

        /*
        this.volumeService = new Service.Speaker(`${this.config.name} Volume`);
        this.volumeService.addCharacteristic(new Characteristic.Volume())
            .on('get', getVolume.bind(this))
            .on('set', setVolume.bind(this));

        this.volumeService.addOptionalCharacteristic(Characteristic.Mute)
        this.volumeService.getCharacteristic(Characteristic.Mute)
            .on('get', getMuteState.bind(this))
            .on('set', setMuteState.bind(this))
        */
    }

    // Called by homebridge to initialise a static accessory.
    getServices() {
        return [this.infoService, this.powerService, this.volumeService]
    };
}

function getOn(callback) {
    let accessory = this;
    this.remote.isAlive().then((isAlive) => {
        accessory.log.debug('TV is alive: ' + isAlive);
        if(isAlive) {
            accessory.log.debug('TV is alive.');
            callback(null, true);
        } else {
            accessory.log.debug('TV is offline.');
            callback(null, false);
        }
    }).catch((error) => {
        accessory.log.error(error);
        callback(new Error(error));
    });
}

function setOn(on, callback) {
    let accessory = this;
    if (on) {
        this.libCec.adapterOn().then(() => {
            accessory.log.debug('TV successfully turnen on');
            callback();
        }).catch((error) => {
            accessory.log.error('Could not turn TV on: %s', error);
            callback(new Error(error));
        });
    } else {
        this.remote.sendKey('2', true).then(() => {
            this.powerService.getCharacteristic(Characteristic.On).updateValue(false);
            accessory.log.debug('TV successfully turnen off');
            callback();
        }).catch((error) => {
            accessory.log.error('Could not turn TV off: %s', error);
            callback(new Error(error));
        });
    }
}

function getVolume(callback) {
    let accessory = this;
    this.remote.getVolume().then((volume) => {
        accessory.log.debug('TV volume is: %s', volume);
        callback(null, volume);
    }).catch((error) => {
        accessory.log.error(error);
        callback(null, 0);
    });
}

function setVolume(volume, callback) {
    let accessory = this;
    this.remote.setVolume(volume).then(() => {
        accessory.log.debug('TV volume set at: %s', volume);
        if(volume == 0) {
            this.volumeService.getCharacteristic(Characteristic.On).updateValue(false);
        }
        callback();
    }).catch((error) => {
        accessory.log.error(error);
        callback(new Error(error));
    });
}

function getMuteState(callback) {
    let accessory = this;
    this.remote.getVolume().then((volume) => {
        accessory.log.debug('TV volume is: %s', volume);
        callback(null, volume > 0);
    }).catch((error) => {
        accessory.log.error(error);
        callback(null, true);
    });
}

function setMuteState(mute, callback) {
    let accessory = this;
    this.remote.sendKey('15').then(() => {
        accessory.log.debug('TV successfully muted');
        callback();
    }).catch((error) => {
        accessory.log.error('Could not mute TV: %s', error);
        callback(new Error(error));
    });
}

SamyGoPlatform.setHomebridge = (homebridge) => {
    homebridgeRef = homebridge
};

SamyGoPlatform.setCharacteristics = (homebridge) => {
    characteristicsRef = require('./homekit')(homebridge).Characteristics
};

module.exports = SamyGoPlatform;