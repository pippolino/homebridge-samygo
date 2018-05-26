#homebridge-samygo

Samsung TV plugin for [Homebridge](https://github.com/nfarina/homebridge)

This plugin allows you to control your Samsung TV ([SamyGO](https://www.samygo.tv) enabled) with HomeKit and Siri.

## Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-samygo`
3. Update your configuration file. See the sample below.

## Configuration
Example config.json:

```js
    "accessories": [
		{
			"accessory": "SamyGO",
			"name": "TV living room",
			"ip_address": "192.168.1.2"
		}
	],
```

### Configuration fields:

Field           | Description
----------------|------------
**accessory**   | Must always be "SamyGO". (required)
**name**        | The name you want to use to control the TV.
**ip_address**  | The internal ip address of your Samsung TV.