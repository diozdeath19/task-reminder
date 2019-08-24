const assert = require('assert').ok;
const sinon = require('sinon');
const MongoCollection = require('mongodb').Collection;

const Mongo = require('../lib/mongo');
const CommandHandler = require('../lib/command_handler');

describe('Test command handler', () => {
  beforeEach(() => {
    this.sandbox = sinon.createSandbox();
    this.mongo = this.sandbox.createStubInstance(Mongo);
    this.commandHandler = new CommandHandler(this.mongo);
    this.mongoCollection = this.sandbox.createStubInstance(MongoCollection);
    this.sandbox.stub(this.mongo, 'eventsCollection').get(() => this.mongoCollection);
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should resolves when received remind command', async () => {
    const event = {user: 'test', channel: 'test', text: '  remind   issue done '};
    const spy = this.sandbox.spy(this.commandHandler, 'remind');
    this.mongoCollection.insertMany.resolves();

    await this.commandHandler.handle(event);
    assert(spy.calledWith('test', 'test', 'issue', 'done'));
    assert(this.mongoCollection.insertMany.calledWith([{
      user: 'test',
      channel: 'test',
      issue: 'issue',
      status: 'done'
    }]));
  });

  it('Should resolves when received delete command', async () => {
    const event = {user: 'test', channel: 'test', text: 'delete issue'};
    const spy = this.sandbox.spy(this.commandHandler, 'delete');
    this.mongoCollection.deleteOne.resolves();

    await this.commandHandler.handle(event);
    assert(spy.calledWith('test', 'issue'));
    assert(this.mongoCollection.deleteOne.calledWith({
      user: 'test',
      issue: 'issue',
    }));
  });

  it('Should return help info when received help command', async () => {
    const event = {user: 'test', channel: 'test', text: 'help'};
    const helpInfo = await this.commandHandler.handle(event);
    assert(typeof helpInfo === 'string');
  });

  it('Should throw when received not enough args on remind', async () => {
    const event = {user: 'test', channel: 'test', text: 'remind issue'};
    await this.commandHandler.handle(event).catch((err) => {
      assert(err.message, 'Bad command, not enough args');
    });
  });

  it('Should throw when received not enough args on delete', async () => {
    const event = {user: 'test', channel: 'test', text: 'delete'};
    await this.commandHandler.handle(event).catch((err) => {
      assert(err.message, 'Bad command, issue not pointed');
    });
  });

  it('Should throw when no handler for command', async () => {
    const event = {user: 'test', channel: 'test', text: 'test'};
    await this.commandHandler.handle(event).catch((err) => {
      assert(err.message, 'Bad command, no handler found');
    });
  });
});
