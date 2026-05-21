import { createApp } from '../src/app.js';

describe('backend app', () => {
  it('creates express application instance', () => {
    const app = createApp();

    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
