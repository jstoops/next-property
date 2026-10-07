jest.mock('mongoose', () => ({
  set: jest.fn(),
  connect: jest.fn(),
}));

describe('connectDB', () => {
  let consoleLog;

  beforeEach(() => {
    jest.resetModules();
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  function load() {
    const mongoose = require('mongoose');
    mongoose.set.mockClear();
    mongoose.connect.mockReset();
    const connectDB = require('@/config/database').default;
    return { mongoose, connectDB };
  }

  it('connects once and skips subsequent calls', async () => {
    const { mongoose, connectDB } = load();
    mongoose.connect.mockResolvedValue({});

    await connectDB();
    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(consoleLog).toHaveBeenCalledWith('MongoDB is connected');
  });

  it('logs connection errors without throwing', async () => {
    const { mongoose, connectDB } = load();
    const error = new Error('connection refused');
    mongoose.connect.mockRejectedValue(error);

    await expect(connectDB()).resolves.toBeUndefined();
    expect(consoleLog).toHaveBeenCalledWith(error);
  });
});
