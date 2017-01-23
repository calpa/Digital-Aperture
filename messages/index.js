"use strict";
console.log("index.js is loaded");
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
        appId: process.env['MicrosoftAppId'],
        appPassword: process.env['MicrosoftAppPassword'],
        stateEndpoint: process.env['BotStateEndpoint'],
        openIdMetadata: process.env['BotOpenIdMetadata']
    });

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';
const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);

var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('None', function (session, args) {
        session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
    })

    .matches('greeting', function (session, args) {
        session.beginDialog('/greeting');
    })

    .matches('sleep', function (session, args) {
        // If only include one entities
        var _e = args["entities"];
        if (args["entities"].length >= 1) {
            for (var i = 0; i < _e.length; i++) {
                // Check if person is obtained
                if (_e[i].type === 'person') {
                    session.send('Your %s slept well~', _e[i]["entity"]);
                }
            }
        } else {
            session.send('Something goes wrong...');
            session.send("%s", JSON.stringify(_e));
        }
    })

    .matches('reset', function (session, args) {
        session.send("luisAPIKey: %s", luisAPIKey);
        session.send("luisAppId: %s", luisAppId);
        session.send("luisAPIHostName: %s", luisAPIHostName);
    })

    .matches('heart rate', function (session, args) {
        var title = "Graph of heart rate: ";
        var image = "http://www.shapesense.com/assets/img/main/heartrate.jpg";
        var card = new builder.ThumbnailCard(session)
            .title("%s", title)
            .images([
                builder.CardImage.create(session, image)
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("http://digitalaperture.azurewebsites.net/files/heart_rate.html?days=10");
    })

    .matches('body temperature', function (session, args) {
        var title = "Graph of body temperature: ";
        var image = "https://ae01.alicdn.com/kf/HTB10qfuMpXXXXcCXXXXq6xXFXXX1/Thermometer-Digital-LCD-Display-Portable-Waterproof-Probe-font-b-Body-b-font-font-b-Temperature-b.jpg";
        var card = new builder.ThumbnailCard(session)
            .title("%s", title)
            .images([
                builder.CardImage.create(session, image)
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("http://digitalaperture.azurewebsites.net/files/temperature.html?days=10");
    })

    .matches('exit', function (session) {
        session.beginDialog('/exit');
    })

    .onDefault(function(session) {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text);
    });

bot.dialog('/', intents);

bot.dialog('/greeting', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("Digital Aperture")
            .text("Your bots - personal assistant.")
            .images([
                builder.CardImage.create(session, "http://i.imgur.com/ehKVizt.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send("Hi, I'm Digital Aperture, the assistant of the elderly living separately with their family. I can help you to get the statics of the elderly.");
        session.send(msg);
        session.send("How may I help you?");
        session.endDialog();
    }
]);

bot.dialog('/exit', [
    function (session) {
        session.send("Exit in 3");
        session.send("2");
        session.send("1");
        session.endDialog();
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}
