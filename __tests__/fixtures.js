export const sessionUser = {
  user: {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    image: 'https://example.com/ada.png',
  },
  userId: 'user-1',
};

export const sampleProperty = {
  _id: 'prop1',
  owner: 'user-2',
  name: 'Seaside Condo',
  type: 'Condo',
  description: 'Ocean views and a bright kitchen.',
  location: {
    street: '1 Bay St',
    city: 'Miami',
    state: 'FL',
    zipcode: '33101',
  },
  beds: 2,
  baths: 2,
  square_feet: 1100,
  amenities: ['Wifi', 'Gym/Fitness Center'],
  rates: {
    nightly: 150,
    weekly: 900,
    monthly: 3000,
  },
  seller_info: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
  },
  images: [
    'https://res.cloudinary.com/demo/image/upload/propertypulse/abc123.jpg',
  ],
  is_featured: true,
};

export function thenableQuery(result) {
  const query = {
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => query),
    populate: jest.fn(() => query),
    lean: jest.fn(() => Promise.resolve(result)),
  };

  query.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return query;
}

export function buildForm(fields) {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
      return;
    }

    if (value != null) {
      formData.append(key, value);
    }
  });

  return formData;
}

export function objectId(value) {
  return {
    toJSON() {
      return value;
    },
    toString() {
      return value;
    },
  };
}
