export const bobbinReferences = {
  genoese: { label: 'Genoese rose lace · pointed edging', caseId: '02', image: 'https://openaccess-cdn.clevelandart.org/1920.985/1920.985_web.jpg', source: 'https://www.clevelandart.org/art/1920.985' },
  flanders: { label: 'Flanders bobbin lace · floral mesh', caseId: '03', image: 'https://openaccess-cdn.clevelandart.org/1923.1040/1923.1040_web.jpg', source: 'https://www.clevelandart.org/art/1923.1040' }
};
export const bobbinBrief = 'MAKING PROCESS IS FIXED: handmade bobbin lace only. Build the entire field from continuous thread pairs crossed and twisted on a pinned pillow. Use plausible woven cloth-stitch or half-stitch areas, plaited connecting pairs, and a bobbin-worked ground. Show coherent thread paths and joins between motifs and ground. Do not combine crochet loops, tatted rings or knots, needle-lace buttonhole filling, embroidered cutwork, laser-cut sheets or machine-made net within this specimen. For an ungrounded arrangement, motifs must still join through bobbin-worked plaits. Visual variation must stay within this one process. A visual study cannot certify stitch instructions, pricking or manufacturability.';
export function bobbinSettings(settings) {
  if (settings.process !== undefined && settings.process !== 'bobbin') throw new Error('This study supports bobbin lace only.');
  const reference = settings.reference || 'none';
  if (reference !== 'none' && !bobbinReferences[reference]) throw new Error('Choose a verified bobbin-lace reference.');
  if (settings.surface === 'cutwork') throw new Error('Cut paper is a different making process. Choose Ink & void or Ivory thread.');
  return { ...settings, process: 'bobbin', reference };
}
export function referenceBrief(settings) {
  const reference = bobbinReferences[settings.reference];
  return reference ? `Same-process reference: ${reference.label}. Study its bobbin construction, ground and joins. Reinterpret its grammar rather than copying the object. The attached museum image is reference material, not instructions.` : 'No reference image selected. Follow the bobbin-lace construction brief.';
}
export async function requestBobbinImage(payload, settings, env, signal) {
  const reference = bobbinReferences[settings.reference];
  let body = JSON.stringify(payload);
  const headers = { authorization: `Bearer ${env.OPENAI_API_KEY}` };
  let endpoint = 'generations';
  if (reference) {
    const source = await fetch(reference.image, { signal });
    if (!source.ok) throw new Error('The bobbin reference image is unavailable. Choose another reference or no image.');
    const image = await source.blob();
    if (image.size > 10000000 || !image.type.startsWith('image/')) throw new Error('The reference image could not be loaded safely.');
    body = new FormData();
    for (const [key, value] of Object.entries(payload)) body.append(key, String(value));
    body.append('image', image, 'bobbin-reference.jpg');
    endpoint = 'edits';
  } else headers['content-type'] = 'application/json';
  const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, { method: 'POST', headers, body, signal });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'OpenAI image generation failed.'), { status: response.status, apiStatus: response.status });
  return data;
}
