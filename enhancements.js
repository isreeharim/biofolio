(() => {
  const storageKey = 'biofolio-profile';
  const base = { name:'Amelia Parker', role:'Product designer & illustrator', bio:'Designing thoughtful digital experiences with a soft spot for bold ideas, good type, and a perfectly brewed flat white.', theme:'cream', font:'serif', button:'soft', links:[{title:'My work',url:'https://example.com',icon:'◫'},{title:'Instagram',url:'https://instagram.com',icon:'◎'},{title:'LinkedIn',url:'https://linkedin.com',icon:'in'}] };
  let profile = { ...base, ...(JSON.parse(localStorage.getItem(storageKey) || 'null') || {}) };
  const q = s => document.querySelector(s); const qa = s => [...document.querySelectorAll(s)];
  const initials = () => profile.name.split(/\s+/).map(v=>v[0]).slice(0,2).join('').toUpperCase();
  function save(){ localStorage.setItem(storageKey, JSON.stringify(profile)); q('.save-state').innerHTML='<span class="check">✓</span> All changes saved'; }
  function render(){
    q('#profileName').textContent=profile.name; q('#profileRole').textContent=profile.role; q('#profileInitials').textContent=initials(); q('#previewName').textContent=profile.name; q('#previewRole').textContent=profile.role; q('#previewBio').textContent=profile.bio; q('#bio').value=profile.bio; q('.count').textContent=`${profile.bio.length} / 160`;
    const screen=q('#phoneScreen'); screen.className=`phone-screen theme-${profile.theme} font-${profile.font} button-${profile.button}`;
    qa('.theme-card').forEach(x=>x.classList.toggle('selected',x.dataset.theme===profile.theme)); qa('.font-choice').forEach(x=>x.classList.toggle('selected',x.dataset.font===profile.font)); qa('.button-style').forEach(x=>x.classList.toggle('selected',x.dataset.button===profile.button));
    q('#previewLinks').innerHTML=profile.links.map(x=>`<a href="${x.url}"><span>${x.icon}</span>${x.title}<b>↗</b></a>`).join('');
  }
  function closeEditor(){ q('#editorModal').classList.remove('show'); }
  function openEditor(kind){
    const fields=q('#modalFields'); const profileMode=kind==='profile'; q('#editorEyebrow').textContent=profileMode?'YOUR PROFILE':'NEW DESTINATION'; q('#editorTitle').textContent=profileMode?'Edit your profile':'Add a link'; q('#editorSubmit').textContent=profileMode?'Save changes':'Add link';
    fields.innerHTML=profileMode?`<div class="modal-field"><label>Name</label><input required name="name" value="${profile.name}"></div><div class="modal-field"><label>What you do</label><input required name="role" value="${profile.role}"></div><div class="modal-field"><label>Short bio</label><textarea required name="bio" maxlength="160">${profile.bio}</textarea></div>`:`<div class="modal-field"><label>Link title</label><input required name="title" placeholder="e.g. My newsletter"></div><div class="modal-field"><label>URL</label><input required name="url" type="url" placeholder="https://"></div>`;
    q('#editorForm').dataset.mode=kind; q('#editorModal').classList.add('show');
  }
  qa('.profile-edit-trigger').forEach(x=>x.addEventListener('click',()=>openEditor('profile')));
  q('#addLink').addEventListener('click',event=>{event.stopImmediatePropagation();openEditor('link');},true);
  q('#editorClose').addEventListener('click',closeEditor);
  q('#editorModal').addEventListener('click',e=>{if(e.target===q('#editorModal')) closeEditor();});
  q('#editorForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);if(e.currentTarget.dataset.mode==='profile'){profile.name=data.get('name').trim();profile.role=data.get('role').trim();profile.bio=data.get('bio').trim();}else{profile.links.push({title:data.get('title').trim(),url:data.get('url').trim(),icon:'↗'});}save();render();closeEditor();});
  q('#bio').addEventListener('change',()=>{profile.bio=q('#bio').value;save();render();});
  qa('.theme-card').forEach(x=>x.addEventListener('click',()=>{profile.theme=x.dataset.theme;save();})); qa('.font-choice').forEach(x=>x.addEventListener('click',()=>{profile.font=x.dataset.font;save();})); qa('.button-style').forEach(x=>x.addEventListener('click',()=>{profile.button=x.dataset.button;save();}));
  q('#publishButton').addEventListener('click',save); render();
})();
