import service from '../worker/index.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    }
    return service.fetch(request, { ...process.env, IMAGE_OUTPUT_FORMAT: 'webp' });
  }
};
