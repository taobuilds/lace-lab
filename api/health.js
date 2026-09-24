export default {
  fetch(request) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
    return Response.json({
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
    }, { headers: { 'Cache-Control': 'no-store' } });
  }
};
