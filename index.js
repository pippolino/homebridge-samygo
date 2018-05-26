const SamyGoPlatform = require('./lib/platform');

module.exports = function (homebridge) {
    SamyGoPlatform.setCharacteristics(homebridge);
    SamyGoPlatform.setHomebridge(homebridge);

    const dynamic = true;
    homebridge.registerAccessory("homebridge-samygo", "SamyGO", SamyGoPlatform, dynamic);
};