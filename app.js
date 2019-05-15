'use strict';
var acc = [0, 0]
var acc_020 = 0;
var acc_050 = 0;

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;

Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    throw err;
  } else {
    client.on('error', function (err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized');

        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          filterMessage(client, inputName, msg);
        });
      }
    });
  }
});

function accumulate(item, index) {
  if (item.NodeId == 'ns=1;s=020') {
    acc[0]++;
    acc_020 = acc_020 + item.Value.Value
  } else {
    acc[1]++;
    acc_050 = acc_050 + item.Value.Value
  }
}

// This function just pipes the messages without any change.
// This function filters out messages that report temperatures below the temperature threshold.
// It also adds the MessageType property to the message with the value set to Alert.
function filterMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));
  if (inputName === 'input1') {
    var message = msg.getBytes().toString('utf8');
    var messageBody = JSON.parse(message);
    messageBody.forEach(accumulate);
    let formattedMsg = [{
        "NodeId": "ns=1;s=020",
        "Value": acc_020 / acc[0]
      },
      {
        "NodeId": "ns=1;s=050",
        "Value": acc_050 / acc[1]
      }
    ];
    console.log(formattedMsg);

    var outputMsg = new Message(JSON.stringify(formattedMsg));
    client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
  } else
    console.log('unknown input')
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}