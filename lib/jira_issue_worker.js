const request = require('axios');
const config = require('config').get('jira');
const Promise = require('bluebird');

class JiraIssueWorker {
  constructor(mongo, rtm) {
    this._mongo = mongo;
    this._rtm = rtm;
    this._JIRA_URL = config.get('url');
    this._ISSUE_STATUSES = config.get('issueStatuses');
    this._USER = config.get('user');
    this._TOKEN = config.get('token');
  }

  async process() {
    const events = await this._mongo.eventsCollection.find({}).toArray();
    if (!events.length) {
      return;
    }

    const issuesData = await Promise.map(events, (event) => {
      return request.get(`${this._JIRA_URL}/rest/api/latest/issue/${event.issue}`, {
        params: {
          fields: 'status'
        },
        auth: {
          username: this._USER,
          password: this._TOKEN,
        },
      });
    });

    const doneEvents = events.filter((event, key) => {
      if (issuesData[key].status !== 200) {
        return false;
      }
      const status = issuesData[key].data.fields.status.name;
      if (this._ISSUE_STATUSES[event.status] !== status) {
        return false;
      }
      console.log(`Issue ${event.issue} has remind status ${status}, send message...`);
      return true;
    });

    Promise.map(doneEvents, async (event) => {
      await this._rtm.sendMessage(`Issue ${event.issue} has a ${event.status} status!`, event.channel);
      await this._mongo.eventsCollection.deleteOne({user: event.user, issue: event.issue});
    });
  }
}

module.exports = JiraIssueWorker;
