const MongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');

class Mongo {
  constructor(options) {
    this._options = options;
    this._client = new MongoClient(this._options.url, {
      useNewUrlParser: true,
      promiseLibrary: Promise,
      ignoreUndefined: true,
      useUnifiedTopology: true,
    });
    this._collections = {
      events: 'events',
    };
  }

  async init() {
    await this._client.connect();
    this._db = this._client.db(this._options.dbName);
  }

  get eventsCollection() {
    return this._db.collection(this._collections.events);
  }

  async close() {
    return this._client.close();
  }
}

module.exports = Mongo;
