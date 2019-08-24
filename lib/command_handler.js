class CommandHandler {
  constructor(mongo) {
    this._mongo = mongo;
  }

  async handle(event) {
    console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
    const [command, ...args] = event.text.trim().split(/\s+/);
    if (!args.length) {
      throw new Error('Bad command, no args');
    }

    switch (command) {
      case 'remind':
        if (args.length < 2) {
          throw new Error('Bad command, not enough args');
        }
        await this.remind(...[event.user, event.channel, ...args]);
        break;
      case 'delete':
        if (args.length < 1) {
          throw new Error('Bad command, issue not pointed');
        }
        await this.delete(...[event.user, ...args]);
        break;
      default:
        throw new Error('Bad command, no handler found');
    }
  };

  async remind(user, channel, issue, status) {
    return this._mongo.eventsCollection.insertMany([{user, channel, issue, status}]);
  }

  async delete(user, issue) {
    return this._mongo.eventsCollection.deleteOne({user, issue});
  }
}

module.exports = CommandHandler;