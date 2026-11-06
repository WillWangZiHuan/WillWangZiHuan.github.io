'use strict';
const runs = JSON.parse(document.querySelector('#runs').textContent);
const matrix = document.querySelector('#matrix');
const models = ['Astra', 'Sol', 'Terra'];
const escape = value => String(value ?? '未记录').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? '未记录' : value.toLocaleString('en-US');
const field = (label, value) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
matrix.innerHTML = '<div class="colhead axishead">高度 / mm</div>' + models.map(m=>`<div class="colhead">${m}</div>`).join('');
const bands = [...new Set(runs.map(r=>Math.floor(r.height_mm / 50)*50))].sort((a,b)=>b-a);
for (const band of bands) {
  const row = document.createElement('section'); row.className='band';
  row.innerHTML = `<div class="tick">${band+50}<br>— ${band}</div>`;
  for (const model of models) {
    const r = runs.find(r=>r.model===model && Math.floor(r.height_mm/50)*50===band);
    const slot = document.createElement('div');
    if(r) {
      slot.className='card'; slot.id=r.model.toLowerCase();
      slot.innerHTML = `<div class="cardtop"><span class="mobile-model">${model}</span><span class="height">${r.height_mm.toFixed(1)}<small>mm</small></span><time class="date">${escape(r.date)}</time></div>
        <div class="screen"><video controls playsinline preload="none" poster="${r.videos[0].poster}" src="${r.videos[0].src}" aria-label="${model} 完整搭建视频"></video></div>
        <div class="views" role="group" aria-label="${model} 视频视角">${r.videos.map((v,i)=>`<button type="button" data-view="${i}" aria-pressed="${i===0}">${escape(v.label)}</button>`).join('')}</div>
        <p class="condition">${escape(r.condition)}</p>
        <dl class="metrics">${field('请求额度',`${r.steps} / ${r.request_budget} 次`)}${field('Token 额度',r.token_budget)}${field(r.token_scope==='known'?'已知 Token 用量':'Token 用量',num(r.tokens))}${field('费用',r.cost_usd==null?'订阅 · 无单独账单':`$${r.cost_usd.toFixed(2)} · API 估算`)}</dl>
        <details><summary>配置与指令</summary><div class="configuration"><dl>${field('模型',r.model_id+' · '+r.effort)}${field('输入',r.inputs)}${field('示范',r.demonstration)}${field('相机内参 / 外参',r.intrinsics+' / '+r.extrinsics)}${field('规划器',r.planner)}${field('状态',r.status)}${field('日期',r.date)}${field('用量口径',r.usage_note)}${field('任务指令',r.instruction)}</dl><details><summary>System prompt</summary><pre>${escape(r.system_prompt)}</pre></details><details><summary>工具与命令</summary><pre>${escape(r.tool_description)}</pre></details></div></details>`;
      const video=slot.querySelector('video');
      slot.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
        if(button.getAttribute('aria-pressed')==='true')return;
        const time=video.currentTime, playing=!video.paused, view=r.videos[Number(button.dataset.view)];
        video.pause(); video.src=view.src; video.poster=view.poster;
        slot.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(time,Math.max(0,video.duration-.05));if(playing)video.play().catch(()=>{});},{once:true});video.load();
      }));
      video.addEventListener('play',()=>document.querySelectorAll('video').forEach(v=>{if(v!==video)v.pause();}));
    }
    row.append(slot);
  }
  matrix.append(row);
}
