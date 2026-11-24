import {$,node,message,busy,statusName} from './shared.js';
import {withEditor} from './editor.js';
const sections={indicacoes:'Vocês indicaram',musicas:'No repeat do time',fora:'Fora do expediente',valeu:'Valeu por essa',pergunta:'A pergunta da semana',missao:'Missão secundária'};
let currentApi,getState,reload;
export function mountEngagement(api,state,load){
 currentApi=api;getState=state;reload=load;
 document.addEventListener('click',event=>{const b=event.target.closest('[data-content-edition]');if(b)openContent(b.dataset.contentEdition);if(event.target.closest('[data-check-closing]'))requestAnimationFrame(()=>$('#editorial-cycle')?.scrollIntoView({block:'start',behavior:'smooth'}));});
}
function openContent(id){
 const state=getState(),edition=state.editions.find(e=>e.id===id);if(!edition)return;
 let dialog=$('#content-dialog');if(!dialog){dialog=node('dialog','form-dialog');dialog.id='content-dialog';document.body.append(dialog)}dialog.replaceChildren();
 const top=node('div','dialog-head'),close=node('button','text-button','Fechar');close.type='button';close.onclick=()=>dialog.close();top.append(node('span','eyebrow','EDIÇÃO '+id),close);dialog.append(top,node('h2','','Os quadros desta edição.'));
 const c=state.edition_content?.find(c=>c.edition_id===id),form=node('form');
 function field(label,value,max=300,textarea=false){const wrap=node('label','',label),input=node(textarea?'textarea':'input');input.value=value||'';input.maxLength=max;if(textarea)input.rows=3;wrap.append(input);form.append(wrap);return input;}
 const headline=field('Chamada principal',c?.headline||edition.title,180);headline.required=true;headline.minLength=3;
 const teasers=field('Até três chamadas, uma por linha',(c?.teasers||[]).join('\n'),550,true);
 const legend=node('fieldset','edition-sections');legend.append(node('legend','','Quadros que entram na edição'));
 const toggles=Object.entries(sections).map(([key,label])=>{const l=node('label',''),input=node('input');input.type='checkbox';input.value=key;input.checked=(c?.sections||Object.keys(sections)).includes(key);l.append(input,document.createTextNode(label));legend.append(l);return input});form.append(legend);
 const prompt=field('Pergunta para continuar na próxima edição',c?.next_prompt||'',300,true),status=node('p','form-status'),save=node('button','primary','Salvar quadros');status.setAttribute('role','status');save.type='submit';form.append(save,status);dialog.append(form);
 form.onsubmit=async event=>{event.preventDefault();const lines=teasers.value.split('\n').map(t=>t.trim()).filter(Boolean);if(lines.length>3||lines.some(t=>t.length>150)){message(status,'Usa até três chamadas de até 150 caracteres.',true);return;}try{await busy(save,()=>withEditor(currentApi,()=>currentApi.engagement('edition_content',{edition_id:id,headline:headline.value.trim(),teasers:lines,sections:toggles.filter(t=>t.checked).map(t=>t.value),next_prompt:prompt.value.trim()})));await reload();message(status,'Quadros e chamadas salvos para esta edição.');}catch(e){message(status,e.message,true)}};dialog.showModal();
}
export function renderEngagement(state){
 const host=$('#editorial-cycle');if(!host)return;host.replaceChildren();
 const rows=state.suggestions,upcoming=state.editions.filter(e=>!e.published).sort((a,b)=>(a.edition_date||'9999').localeCompare(b.edition_date||'9999'))[0],published=rows.filter(r=>r.status==='publicada'),names=new Set(rows.map(r=>(r.first_name+'|'+r.sector).toLocaleLowerCase('pt-BR'))),sectors=[...new Set(rows.map(r=>r.sector).filter(s=>s&&s!=='Não informado'))];
 const top=node('div','section-top');top.append(node('h2','','Fechar o ciclo com o time.'));if(upcoming){const edit=node('button','secondary','Organizar quadros da edição '+upcoming.id);edit.dataset.contentEdition=upcoming.id;top.append(edit);}host.append(top);
 const metrics=node('div','editorial-metrics');for(const [value,label] of [[rows.length,'contribuições recebidas'],[published.length,'chegaram à publicação'],[names.size,'autores informados'],[sectors.length,'setores com contribuições']]){const item=node('p');item.append(node('strong','',String(value)),document.createTextNode(label));metrics.append(item)}host.append(metrics,node('p','fineprint','Os números descrevem as contribuições carregadas, sem ranking individual. A contagem de autores considera o nome e o setor informados.'));
 const coverage=node('p','coverage-copy',sectors.length?'Setores presentes: '+sectors.join(', ')+'.':'Os setores aparecem quando o time os informa.');host.append(coverage);
 const selected=rows.filter(r=>r.status==='selecionada'&&(!upcoming||r.assigned_edition===upcoming.id)),checks=node('ul','closing-checklist');
 const items=[['Edição preparada',!!upcoming],['Contribuições vinculadas',selected.length>0],['Autorizações conferidas',selected.length>0&&selected.every(r=>r.share_consent)],['Mural revisado',selected.length>0&&selected.every(r=>r.show_on_board)],['Pergunta aberta para o time',(state.metrics.poll_results||[]).some(p=>p.is_open&&(!upcoming||p.edition_id===upcoming.id))]];
 for(const [label,done]of items){const li=node('li','',label);li.dataset.done=String(done);li.prepend(node('span','',done?'✓':'○'));checks.append(li)}host.append(checks,node('p','fineprint','O checklist confere os registros da Central. A revisão de fatos, imagens e links continua com a redação.'));
 if(upcoming){const link=node('a','text-link','Abrir prévia como leitor');link.href='https://trafegodaadapt.github.io/adapt_em_pauta/previas/gta-vi.html';link.target='_blank';link.rel='noopener noreferrer';host.append(link)}
 const history=node('div','published-contributions');history.append(node('h3','','O que voltou para o time.'));
 if(!published.length)history.append(node('p','fineprint','Quando uma pauta sair no jornal, marca como Publicada e vincula à edição. O leitor poderá abrir o resultado em “Meus envios”.'));
 for(const r of published){const e=state.editions.find(e=>e.id===r.assigned_edition),item=node('p','',r.first_name+' · '+r.title+' · '+(e?'Edição '+e.id:statusName[r.status]));if(e?.published&&/^https:\/\//.test(e.url||'')){const a=node('a','text-link','Ver no jornal');a.href=e.url;a.target='_blank';a.rel='noopener noreferrer';item.append(a)}history.append(item)}host.append(history);
}
