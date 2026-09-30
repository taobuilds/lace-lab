export function setupBobbinUI({ getSettings, cases, sync, showPage, toast, loadMotif, openCase, getGeneratedProcess }) {
  const $ = selector => document.querySelector(selector);
  const processes = { '01':'needle', '02':'bobbin', '03':'bobbin', '04':'mixed', '05':'needle', '06':'unverified', '07':'bobbin', '08':'mixed', '09':'removed', '10':'crochet', '11':'tatting', '12':'machine', '13':'needle', '14':'removed' };
  const labels = { bobbin:'Bobbin lace', needle:'Needle lace', crochet:'Crochet', tatting:'Tatting', removed:'Cut & drawn work', mixed:'Mixed construction', machine:'Machine-made', unverified:'Technique unverified' };
  const references = { '02':'genoese', '03':'flanders' };
  Object.assign(getSettings(), { process:'bobbin', reference:'none' });
  $('#patternForm').insertAdjacentHTML('afterbegin', `<div class="making-process"><p class="eyebrow">MAKING PROCESS / FIXED</p><h3>Bobbin lace</h3><p>Cross. Twist. Weave.<br>One process, from motif to ground.</p><label>Same-process image reference<select name="reference"><option value="none">No image · bobbin construction brief</option><option value="genoese">Genoese rose lace · pointed edging</option><option value="flanders">Flanders bobbin lace · floral mesh</option></select></label><p class="micro-copy">A selected museum image is sent with your generation. Other processes stay in the comparison atlas.</p><a href="https://collections.tepapa.govt.nz/topic/1389" target="_blank" rel="noopener">How bobbin lace is made ↗</a></div>`);
  $('#patternForm select[name="reference"]').oninput = event => { getSettings().reference = event.target.value; sync(); };
  $('#surfaceChoices [data-surface="cutwork"]').remove();
  $('#surfaceChoices').closest('fieldset').querySelector('legend').innerHTML = '<span>02</span> Image appearance';
  $('#patternForm select[name="ground"] option[value="none"]').textContent = 'Plait joins · no net';
  $('#patternForm > .micro-copy').textContent = 'Bobbin construction is the fixed brief. A lace maker must still check thread paths, stitch logic and workability.';
  $('#resultNote').textContent = 'Previous AI example · making process unverified. Generate a new bobbin study to apply the fixed brief.';
  $('#atlas .page-heading p:last-child').textContent = 'References organized by how lace is made. Bobbin lace is the focused study; other methods are comparisons.';
  $('.atlas-note').textContent = 'The focused bobbin set excludes mixed construction and unverified techniques. Compare thread pairs, joins, ground and edge within one process. Other methods are comparisons, not generation inputs. Museum records identify techniques; pattern readings remain working observations.';
  const categories = [['bobbin','Bobbin lace · focus'],['needle','Needle lace'],['crochet','Crochet'],['tatting','Tatting'],['removed','Cut & drawn'],['mixed','Mixed techniques'],['machine','Machine-made'],['unverified','Unverified'],['all','All processes']];
  $('#atlasFilters').innerHTML = categories.map(([key,label]) => `<button data-filter="${key}" aria-pressed="${key==='bobbin'}">${label}</button>`).join('');
  function render(filter = 'bobbin') {
    const specimens = cases.filter(c => filter === 'all' || processes[c.id] === filter);
    $('#caseCount').textContent = String(specimens.length).padStart(2,'0') + ' specimens';
    $('#references').replaceChildren();
    for (const c of specimens) {
      const card = document.createElement('article');
      card.className = 'reference-card';
      card.innerHTML = `<div class="image-wrap"><img src="${c.image}" alt="${c.title}" loading="lazy"><span class="image-index">CASE / ${c.id}</span></div><div class="body"><p class="case-method">${labels[processes[c.id]]}</p><p class="eyebrow">${c.meta}</p><h2>${c.title}</h2><div class="pattern-tags">${c.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><p>${c.obs}</p><div class="case-actions"><button class="read-case">Read case ↗</button></div></div>`;
      const read = () => { openCase(c.id); const note = document.createElement('p'); note.className = 'process-reading'; note.textContent = processes[c.id]==='bobbin' ? 'Making process: Bobbin lace. Read thread pairs, woven areas and bobbin-worked joins. Eligible for the focused study.' : `Making process: ${labels[processes[c.id]]}. Comparison only; excluded from bobbin generation inputs.`; $('#caseDetail > div:last-child').append(note); };
      card.querySelector('.read-case').onclick = read;
      card.querySelector('.image-wrap').onclick = read;
      card.querySelector('img').onerror = event => { event.target.hidden = true; event.target.parentElement.insertAdjacentHTML('beforeend','<p class="image-error">Image unavailable · open the collection record</p>'); };
      if (processes[c.id] === 'bobbin') {
        const button = document.createElement('button'); button.textContent = 'Use bobbin grammar ↗';
        button.onclick = () => { loadMotif(c.family); Object.assign(getSettings(),{process:'bobbin',reference:references[c.id]||'none'}); sync(); showPage('studio'); toast(references[c.id]?'Bobbin reference image selected':'Bobbin motif loaded · no reference image'); };
        card.querySelector('.case-actions').prepend(button);
      } else card.querySelector('.case-actions').insertAdjacentHTML('afterbegin','<span class="comparison-only">Comparison only</span>');
      $('#references').append(card);
    }
  }
  for (const button of $('#atlasFilters').querySelectorAll('button')) button.onclick = () => {
    for (const item of $('#atlasFilters').querySelectorAll('button')) item.setAttribute('aria-pressed',String(item===button));
    render(button.dataset.filter);
  };
  const reset = $('#reset').onclick;
  $('#reset').onclick = () => { reset(); Object.assign(getSettings(),{process:'bobbin',reference:'none'}); sync(); };
  const pin = $('#pin').onclick;
  $('#pin').onclick = () => { pin(); const item = $('#historyItems').lastElementChild; if(item) item.querySelector('span').prepend(document.createTextNode(getGeneratedProcess()?'Bobbin study · ':'Process unverified · ')); };
  render();
  return render;
}
