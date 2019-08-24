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
  }

  async init() {
    await this._client.connect();
    this._db = this._client.db(this._options.dbName);
  }

  get db() {
    return this._db;
  }

  async close() {
    return this._client.close();
  }
}

module.exports = Mongo;
