import { describe, it, expect } from 'vitest';

describe('Core Endpoints', () => {
  it('health endpoint returns 200', async () => {
    const response = await fetch('http://localhost:3000/health');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  it('api ping endpoint returns 200 with pong', async () => {
    const response = await fetch('http://localhost:3000/api/ping');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('message', 'pong');
  });
});
