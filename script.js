document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    const pageButtons = document.querySelectorAll('[data-page]');
    function showPage(targetId) {
        const target = document.getElementById(targetId); if (!target) return;
        pages.forEach(page => page.classList.remove('active')); target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (profileModal?.classList.contains('active')) closeProfile();
    }
    pageButtons.forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));

    document.querySelectorAll('.lyrics-button').forEach(button => {
        button.addEventListener('click', async () => {
            const song = button.closest('.song');
            const box = song.querySelector('.lyrics-content');
            if (song.classList.contains('lyrics-open')) {
                song.classList.remove('lyrics-open');
                button.textContent = 'LYRICS +';
                return;
            }
            document.querySelectorAll('.song.lyrics-open').forEach(other => {
                other.classList.remove('lyrics-open');
                other.querySelector('.lyrics-button').textContent = 'LYRICS +';
            });

            if (!box.dataset.loaded) {
                button.textContent = 'LOADING…';
                try {
                    const response = await fetch(encodeURI(button.dataset.lyrics), { cache: 'no-store' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    box.textContent = await response.text();
                    box.dataset.loaded = 'true';
                } catch (err) {
                    console.error('Lyrics load failed:', err);
                    // file:// blocks fetch() in many browsers. Instead of freezing or showing a fake
                    // error, offer the real TXT file as a clickable local fallback.
                    box.innerHTML = '';
                    const note = document.createElement('p');
                    note.textContent = 'Trình duyệt đang chặn đọc TXT trực tiếp. ';
                    const link = document.createElement('a');
                    link.href = button.dataset.lyrics;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    link.textContent = 'MỞ LYRICS ↗';
                    note.appendChild(link);
                    box.appendChild(note);
                }
            }
            song.classList.add('lyrics-open');
            button.textContent = 'HIDE −';
        });
    });

    const audio=document.getElementById('audio'), playerButton=document.getElementById('player-button'), progress=document.getElementById('progress');
    const nowPlaying=document.getElementById('now-playing'), currentTimeEl=document.getElementById('current-time'), durationEl=document.getElementById('duration-display');
    const playerCover=document.getElementById('player-cover'), volume=document.getElementById('volume');
    const playButtons=[...document.querySelectorAll('.play-button')];
    const songs=playButtons.map((button,index)=>{ const card=button.closest('.song'); return {index,button,card,source:button.dataset.song,title:card.querySelector('h3').textContent.trim(),cover:card.querySelector('.cover img').getAttribute('src')}; });
    let currentIndex=-1;
    const fmt=n=>{ n=Number.isFinite(n)?Math.floor(n):0; return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`; };
    function setPlayingUI(playing){ playerButton.textContent=playing?'Ⅱ':'▶'; songs.forEach((s,i)=>{s.card.classList.toggle('is-playing',i===currentIndex);s.button.textContent=i===currentIndex&&playing?'Ⅱ':'▶';}); }
    function loadSong(index,autoplay=true){
        if(!songs.length)return;
        currentIndex=(index+songs.length)%songs.length;
        const s=songs[currentIndex];
        const source=encodeURI(s.source);
        if(audio.getAttribute('src')!==source){
            audio.pause();
            audio.setAttribute('src', source);
            audio.load();
        }
        try{ audio.currentTime=0; }catch(_e){}
        nowPlaying.textContent=s.title;
        playerCover.src=s.cover;
        if(autoplay){
            const playPromise=audio.play();
            if(playPromise && typeof playPromise.catch==='function'){
                playPromise.catch(err=>{
                    console.warn('Audio play was blocked or failed:', err);
                    setPlayingUI(false);
                });
            }
        }
    }
    songs.forEach(s=>s.button.addEventListener('click',e=>{e.stopPropagation(); if(currentIndex===s.index){audio.paused?audio.play():audio.pause();}else loadSong(s.index);}));
    document.querySelectorAll('[data-play-index]').forEach(b=>b.addEventListener('click',()=>loadSong(Number(b.dataset.playIndex))));
    playerButton.addEventListener('click',()=>{ if(currentIndex<0) loadSong(0); else audio.paused?audio.play():audio.pause(); });
    document.getElementById('prev-button').addEventListener('click',()=>loadSong(currentIndex<0?0:currentIndex-1));
    document.getElementById('next-button').addEventListener('click',()=>loadSong(currentIndex<0?0:currentIndex+1));
    document.getElementById('random-button').addEventListener('click',()=>{ if(songs.length<2)return loadSong(0); let n=currentIndex; while(n===currentIndex)n=Math.floor(Math.random()*songs.length); loadSong(n); });
    volume.addEventListener('input',()=>audio.volume=Number(volume.value)); audio.volume=Number(volume.value);
    audio.addEventListener('play',()=>setPlayingUI(true)); audio.addEventListener('pause',()=>setPlayingUI(false)); audio.addEventListener('ended',()=>loadSong(currentIndex+1));
    audio.addEventListener('loadedmetadata',()=>durationEl.textContent=fmt(audio.duration));
    audio.addEventListener('error',()=>{ const s=songs[currentIndex]; nowPlaying.textContent=s ? `${s.title} · Không tìm thấy file: ${s.source}` : 'Không tải được audio'; setPlayingUI(false); });
    audio.addEventListener('timeupdate',()=>{ if(audio.duration)progress.value=(audio.currentTime/audio.duration)*100; currentTimeEl.textContent=fmt(audio.currentTime); durationEl.textContent=fmt(audio.duration); });
    progress.addEventListener('input',()=>{if(audio.duration)audio.currentTime=(Number(progress.value)/100)*audio.duration;});

    document.querySelectorAll('.filter-button').forEach(button=>button.addEventListener('click',()=>{
        document.querySelectorAll('.filter-button').forEach(b=>b.classList.remove('active')); button.classList.add('active');
        const filter=button.dataset.filter; document.querySelectorAll('.song').forEach(song=>song.classList.toggle('is-filtered',filter!=='all'&&song.dataset.category!==filter));
    }));

    const profileModal=document.getElementById('profileModal'), profileImage=document.getElementById('profileModalImage');
    const profileName=document.getElementById('profileModalName'), profileRole=document.getElementById('profileModalRole'), profileFeatured=document.getElementById('profileModalFeatured');
    function openProfile(person){ profileImage.src=person.dataset.profile; profileName.textContent=person.dataset.name||''; profileRole.textContent=person.dataset.role||''; profileFeatured.textContent=person.dataset.featured||''; profileModal.classList.add('active'); profileModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
    function closeProfile(){ profileModal.classList.remove('active'); profileModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    document.querySelectorAll('.profile-person').forEach(p=>p.addEventListener('click',()=>openProfile(p)));
    document.getElementById('profileModalClose').addEventListener('click',closeProfile);
    profileModal.addEventListener('click',e=>{if(e.target===profileModal)closeProfile();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&profileModal.classList.contains('active'))closeProfile();});

    // ===== COMMUNITY GALLERY (SUPABASE) =====
    const uploadModal=document.getElementById('galleryUploadModal');
    const uploadOpen=document.getElementById('galleryUploadOpen');
    const uploadClose=document.getElementById('galleryUploadClose');
    const fileInput=document.getElementById('galleryFile');
    const fileLabel=document.getElementById('galleryFileLabel');
    const uploadBtn=document.getElementById('gallerySubmit');
    const uploadMsg=document.getElementById('galleryUploadMessage');
    const galleryGrid=document.getElementById('galleryGrid');
    const galleryStatus=document.getElementById('galleryStatus');
    const uploaderName=document.getElementById('galleryUploaderName');
    const galleryCaption=document.getElementById('galleryCaption');
    const cfg=window.REALYZE_SUPABASE||{};
    const galleryReady=Boolean(cfg.url&&cfg.anonKey&&window.supabase);
    const sb=galleryReady?window.supabase.createClient(cfg.url,cfg.anonKey):null;
    if(uploadOpen && !galleryReady){ uploadOpen.title='Cần điền Supabase URL + anon key trong supabase-config.js'; }

    function openUpload(){ uploadModal.classList.add('active'); uploadModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; uploadMsg.textContent=galleryReady?'':'Gallery upload chưa được nối Supabase. Xem GALLERY_SETUP.txt trong ZIP.'; }
    function closeUpload(){ uploadModal.classList.remove('active'); uploadModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    uploadOpen?.addEventListener('click',openUpload); uploadClose?.addEventListener('click',closeUpload);
    uploadModal?.addEventListener('click',e=>{if(e.target===uploadModal)closeUpload();});
    fileInput?.addEventListener('change',()=>{ fileLabel.textContent=fileInput.files?.[0]?.name||'CHOOSE IMAGE'; });

    function addGalleryCard(item,prepend=false){
        const fig=document.createElement('figure'); fig.className='gallery-item community-item';
        const img=document.createElement('img'); img.src=item.image_url; img.alt=item.caption||'Community gallery'; img.loading='lazy';
        const cap=document.createElement('figcaption');
        const who=document.createElement('span'); who.textContent=(item.uploader_name||'ANON').toUpperCase();
        const text=document.createElement('span'); text.textContent=item.caption||'COMMUNITY POST';
        cap.append(who,text); fig.append(img,cap); prepend?galleryGrid.prepend(fig):galleryGrid.append(fig);
    }
    async function loadCommunityGallery(){
        if(!galleryReady){ galleryStatus.textContent=''; return; }
        galleryStatus.textContent='Loading community posts…';
        const {data,error}=await sb.from('realyze_gallery').select('id,image_url,caption,uploader_name,created_at').order('created_at',{ascending:false}).limit(60);
        if(error){ console.error(error); galleryStatus.textContent='Không tải được community gallery.'; return; }
        data.forEach(item=>addGalleryCard(item)); galleryStatus.textContent=data.length?`${data.length} community post${data.length>1?'s':''}`:'';
    }
    loadCommunityGallery();

    uploadBtn?.addEventListener('click',async()=>{
        if(!galleryReady){ uploadMsg.textContent='Cần cấu hình Supabase trước. Xem GALLERY_SETUP.txt.'; return; }
        const file=fileInput.files?.[0]; if(!file){ uploadMsg.textContent='Chọn một ảnh trước nhé.'; return; }
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)){ uploadMsg.textContent='Chỉ nhận JPG, PNG hoặc WEBP.'; return; }
        if(file.size>8*1024*1024){ uploadMsg.textContent='Ảnh lớn hơn 8 MB.'; return; }
        uploadBtn.disabled=true; uploadMsg.textContent='Uploading…';
        try{
            const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
            const uid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36);
            const name=`${Date.now()}-${uid}.${ext}`;
            const {error:upErr}=await sb.storage.from('realyze-gallery').upload(name,file,{cacheControl:'3600',upsert:false,contentType:file.type});
            if(upErr) throw upErr;
            const {data:urlData}=sb.storage.from('realyze-gallery').getPublicUrl(name);
            const payload={image_url:urlData.publicUrl,storage_path:name,caption:galleryCaption.value.trim().slice(0,80),uploader_name:(uploaderName.value.trim()||'Anonymous').slice(0,32)};
            const {data:row,error:rowErr}=await sb.from('realyze_gallery').insert(payload).select('id,image_url,caption,uploader_name,created_at').single();
            if(rowErr) throw rowErr;
            addGalleryCard(row,true); uploadMsg.textContent='Đăng ảnh thành công!'; fileInput.value=''; fileLabel.textContent='CHOOSE IMAGE'; galleryCaption.value='';
            setTimeout(closeUpload,700);
        }catch(err){ console.error(err); uploadMsg.textContent='Upload thất bại: '+(err.message||'unknown error'); }
        finally{ uploadBtn.disabled=false; }
    });
});
