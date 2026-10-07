import mongoose from 'mongoose';
import Property from '@/models/Property';
import User from '@/models/User';
import Message from '@/models/Message';

describe('mongoose models', () => {
  it('requires the property fields used to publish a listing', () => {
    const error = new Property({}).validateSync();

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.type).toBeDefined();
    expect(error.errors.beds).toBeDefined();
    expect(error.errors.baths).toBeDefined();
    expect(error.errors.square_feet).toBeDefined();
    expect(error.errors.description).toBeUndefined();
    expect(new Property({}).is_featured).toBe(false);
    expect(Property.schema.path('owner').options.ref).toBe('User');
    expect(Property.schema.options.timestamps).toBe(true);
  });

  it('requires a unique email and username for users', () => {
    const error = new User({}).validateSync();

    expect(error.errors.email.message).toBe('Email is required');
    expect(error.errors.username.message).toBe('Username is required');
    expect(User.schema.path('email').options.unique[0]).toBe(true);
    expect(User.schema.path('email').options.unique[1]).toBe(
      'Email already exists'
    );
    expect(User.schema.path('bookmarks').instance).toBe('Array');
    expect(User.schema.path('bookmarks').caster.options.ref).toBe('Property');
    expect(new User({ email: 'ada@example.com', username: 'ada' }).bookmarks).toEqual(
      []
    );
  });

  it('requires message participants and defaults read to false', () => {
    const error = new Message({}).validateSync();
    const id = () => new mongoose.Types.ObjectId();
    const message = new Message({
      sender: id(),
      recipient: id(),
      property: id(),
      name: 'Ada',
      email: 'ada@example.com',
    });

    expect(error.errors.sender).toBeDefined();
    expect(error.errors.recipient).toBeDefined();
    expect(error.errors.property).toBeDefined();
    expect(error.errors.name.message).toBe('Name is required');
    expect(error.errors.email.message).toBe('Email is required');
    expect(error.errors.phone).toBeUndefined();
    expect(error.errors.body).toBeUndefined();
    expect(message.validateSync()).toBeUndefined();
    expect(message.read).toBe(false);
    expect(Message.schema.path('sender').options.ref).toBe('User');
    expect(Message.schema.path('property').options.ref).toBe('Property');
  });

  it('reuses models that are already compiled', () => {
    [Property, User, Message].forEach((model) => {
      const modulePath = require.resolve(`@/models/${model.modelName}`);
      delete require.cache[modulePath];
      const reloaded = require(modulePath).default;

      expect(reloaded).toBe(model);
      expect(reloaded).toBe(mongoose.models[model.modelName]);
    });
  });
});
