/**
 * @jest-environment node
 */
import connectDB from '@/config/database';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';
import { revalidatePath } from 'next/cache';
import addMessage from '@/app/actions/addMessage';
import deleteMessage from '@/app/actions/deleteMessage';
import markMessageAsRead from '@/app/actions/markMessageAsRead';
import getUnreadMessageCount from '@/app/actions/getUnreadMessageCount';
import { buildForm, sessionUser } from '../fixtures';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/utils/getSessionUser', () => ({
  getSessionUser: jest.fn(),
}));

jest.mock('@/models/Message', () => {
  const MessageModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: MessageModel.save,
  }));

  MessageModel.save = jest.fn();
  MessageModel.findById = jest.fn();
  MessageModel.find = jest.fn();
  MessageModel.countDocuments = jest.fn();

  return { __esModule: true, default: MessageModel };
});

describe('message actions', () => {
  beforeEach(() => {
    connectDB.mockClear();
    getSessionUser.mockReset();
    revalidatePath.mockClear();
    Message.save.mockReset();
    Message.save.mockResolvedValue(undefined);
    Message.findById.mockReset();
    Message.countDocuments.mockReset();
  });

  describe('addMessage', () => {
    const fields = {
      recipient: 'user-2',
      property: 'prop1',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      phone: '555-0199',
      message: 'Is the condo available in June?',
    };

    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(addMessage({}, buildForm(fields))).resolves.toEqual({
        error: 'You must be logged in to send a message',
      });
      expect(Message.save).not.toHaveBeenCalled();
    });

    it('rejects a message sent to yourself', async () => {
      getSessionUser.mockResolvedValue(sessionUser);

      await expect(
        addMessage({}, buildForm({ ...fields, recipient: sessionUser.user.id }))
      ).resolves.toEqual({
        error: 'You can not send a message to yourself',
      });
      expect(Message.save).not.toHaveBeenCalled();
    });

    it('saves a message for another user', async () => {
      getSessionUser.mockResolvedValue(sessionUser);

      await expect(addMessage({}, buildForm(fields))).resolves.toEqual({
        submitted: true,
      });

      expect(Message.save).toHaveBeenCalled();
      expect(Message).toHaveBeenCalledWith({
        sender: 'user-1',
        recipient: 'user-2',
        property: 'prop1',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        phone: '555-0199',
        body: 'Is the condo available in June?',
      });
    });
  });

  describe('deleteMessage', () => {
    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(deleteMessage('m1')).rejects.toThrow('User ID is required');
    });

    it('throws when the message does not exist', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Message.findById.mockResolvedValue(null);

      await expect(deleteMessage('missing')).rejects.toThrow('Message Not Found');
    });

    it('throws when the user is not the recipient', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Message.findById.mockResolvedValue({
        recipient: { toString: () => 'someone-else' },
        deleteOne: jest.fn(),
      });

      await expect(deleteMessage('m1')).rejects.toThrow('Unauthorized');
    });

    it('deletes a message owned by the recipient', async () => {
      const message = {
        recipient: { toString: () => sessionUser.userId },
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };
      getSessionUser.mockResolvedValue(sessionUser);
      Message.findById.mockResolvedValue(message);

      await expect(deleteMessage('m1')).resolves.toBeUndefined();

      expect(revalidatePath).toHaveBeenCalledWith('/messages', 'page');
      expect(message.deleteOne).toHaveBeenCalled();
    });
  });

  describe('markMessageAsRead', () => {
    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue({ userId: 'user-1' });

      await expect(markMessageAsRead('m1')).rejects.toThrow('User ID is required');
    });

    it('throws when the message does not exist', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Message.findById.mockResolvedValue(null);

      await expect(markMessageAsRead('missing')).rejects.toThrow(
        'Message not found'
      );
    });

    it('returns 401 when the user is not the recipient', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      const message = {
        recipient: { toString: () => 'someone-else' },
        save: jest.fn(),
      };
      Message.findById.mockResolvedValue(message);

      const response = await markMessageAsRead('m1');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
      expect(message.save).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it.each([
      [false, true],
      [true, false],
    ])('toggles read from %s to %s', async (initial, expected) => {
      const message = {
        recipient: { toString: () => sessionUser.userId },
        read: initial,
        save: jest.fn().mockResolvedValue(undefined),
      };
      getSessionUser.mockResolvedValue(sessionUser);
      Message.findById.mockResolvedValue(message);

      await expect(markMessageAsRead('m1')).resolves.toBe(expected);

      expect(message.read).toBe(expected);
      expect(revalidatePath).toHaveBeenCalledWith('/messages', 'page');
      expect(message.save).toHaveBeenCalled();
    });
  });

  describe('getUnreadMessageCount', () => {
    it('requires a signed-in user', async () => {
      getSessionUser.mockResolvedValue(null);

      await expect(getUnreadMessageCount()).resolves.toEqual({
        error: 'User ID is required',
      });
    });

    it('counts unread messages for the recipient', async () => {
      getSessionUser.mockResolvedValue(sessionUser);
      Message.countDocuments.mockResolvedValue(3);

      await expect(getUnreadMessageCount()).resolves.toEqual({ count: 3 });
      expect(Message.countDocuments).toHaveBeenCalledWith({
        recipient: 'user-1',
        read: false,
      });
    });
  });
});
