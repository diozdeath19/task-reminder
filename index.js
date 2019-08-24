const config = require('config');
const { RTMClient } = require('@slack/rtm-api');
const Promise = require('bluebird');
const Mongo = require('./lib/mongo');
const CommandHandler = require('./lib/command_handler');
const JiraIssueWorker = require('./lib/jira_issue_worker');

let commandHandler;

(async () => {
  const token = config.get('slackToken');
  const rtm = new RTMClient(token);
  const mongo = new Mongo({url: config.get('mongo.url'), dbName: config.get('mongo.dbName')});

  rtm.on('message', (event) => {
    commandHandler.handle(event).then((res) => {
      if (res) {
        return rtm.sendMessage(res, event.channel);
      }
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
    const jiraIssueWorker = new JiraIssueWorker(mongo, rtm);
    setInterval(() => {
      jiraIssueWorker.process().catch(err => {
        console.log(err.message);
      });
    }, config.get('pollingInterval') * 1000);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }

  console.log(`Run main process ${process.pid}`);
})();
