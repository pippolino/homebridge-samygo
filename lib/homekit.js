const inherits = require('util').inherits;

module.exports = function (homebridge) {
    const Characteristic = homebridge.hap.Characteristic;

    const CustomCharacteristic = {};

    CustomCharacteristic.Volume = function () {
        Characteristic.call(this, 'Volume', CustomCharacteristic.Volume.UUID);
        this.setProps({
            format: Characteristic.Formats.INT,
            unit: Characteristic.Units.PERCENTAGE,
            maxValue: 100,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    CustomCharacteristic.Volume.UUID = '9E4DD1C0-5C72-11E8-9C2D-FA7AE01BBEBC';
    inherits(CustomCharacteristic.Volume, Characteristic);

    CustomCharacteristic.Channel = function () {
        Characteristic.call(this, 'Channel', CustomCharacteristic.Channel.UUID);
        this.setProps({
            format: Characteristic.Formats.INT,
            unit: Characteristic.Units.NONE,
            maxValue: 100,
            minValue: 1,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    CustomCharacteristic.Channel.UUID = '9E4DD54E-5C72-11E8-9C2D-FA7AE01BBEBC';
    inherits(CustomCharacteristic.Channel, Characteristic);

    CustomCharacteristic.Key = function () {
        Characteristic.call(this, 'Key', CustomCharacteristic.Key.UUID);
        this.setProps({
            format: Characteristic.Formats.STRING,
            unit: Characteristic.Units.NONE,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    CustomCharacteristic.Key.UUID = '9E4DD6D4-5C72-11E8-9C2D-FA7AE01BBEBC';
    inherits(CustomCharacteristic.Key, Characteristic);

    return {Characteristics: CustomCharacteristic};
};