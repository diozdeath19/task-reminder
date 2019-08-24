require('dotenv').config();

const { RTMClient } = require('@slack/rtm-api');
const Promise = require('bluebird');
const Mongo = require('./server/mongo');
const CommandHandler = require('./server/command_handler');

let commandHandler;

(async () => {
  const token = process.env.SLACK_TOKEN;
  const rtm = new RTMClient(token);
  const mongo = new Mongo({url: process.env.MONGO_URL, dbName: process.env.MONGO_DB_NAME});

  rtm.on('message', (event) => {
    commandHandler.handle(event).then(() => {
      return rtm.sendMessage('Accepted', event.channel);
    }).catch((err) => {
      console.log(err.message);
      return rtm.sendMessage(err.message, event.channel);
    }).catch((err) => {
      console.log(err.message);
    });
  });

  try {
    await Promise.all([
      mongo.init(),
      rtm.start(),
    ]);
    commandHandler = new CommandHandler(mongo);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }

  console.log(`Run main process ${process.pid}`);
})();
