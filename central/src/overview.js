import {$,node,formatDate,number,statusName} from './shared.js';
const statuses=['recebida','em_analise','selecionada','publicada','arquivada'];
const icons={overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',inbox:'M4 4h16v16H4z M4 14h5l2 3h2l2-3h5 M8 8h8 M8 11h5',selected:'M5 5h14v16H5z M9 3h6v4H9z M8 12h8 M8 16h5',editions:'M4 4h13v16H4z M17 8h4v12H4 M7 8h7 M7 12h7 M7 16h4',results:'M4 20V4 M4 20h17 M8 16v-5 M13 16V7 M18 16v-8',polls:'M5 12l4 4L19 6 M4 4h4 M4 4v4 M20 16v4h-4',clock:'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[name]);svg.append(path);return svg;}
export function decorateDashboard(){
 document.querySelectorAll('nav [data-view]').forEach(b=>b.querySelector('span').replaceChildren(icon(b.dataset.view==='mural'?'star':b.dataset.view)));
 document.querySelectorAll('.metric-link').forEach((b,i)=>{const mark=node('span','metric-icon');mark.setAttribute('aria-hidden','true');mark.dataset.tone=['lavender','gold','mint','slate'][i];mark.append(icon(['inbox','clock','selected','star'][i]));b.prepend(mark)});
 const refresh=document.querySelector('#refresh');refresh.prepend(icon('clock'));refresh.setAttribute('aria-label','Atualizar dados do dashboard');
}
function action(label,view){const b=node('button','text-button',label);b.type='button';b.dataset.go=view;return b;}
function empty(text){return node('p','dashboard-empty',text);}
function formatVotes(value){return number(value)+' '+(Number(value)===1?'voto':'votos');}
export function renderOverview(state){
 const rows=state.suggestions,m=state.metrics,editions=state.editions;
 const published=editions.filter(e=>e.published),upcoming=editions.filter(e=>!e.published).sort((a,b)=>a.edition_date.localeCompare(b.edition_date))[0];
 const total=rows.length,globalTotal=Number(m.suggestions);
 $('#pipeline-description').textContent=total<globalTotal?'Distribuição das '+number(total)+' sugestões mais recentes, de '+number(globalTotal)+' recebidas.':'Um retrato das '+number(total)+' '+(total===1?'sugestão recebida.':'sugestões recebidas.');
 const pipeline=$('#overview-pipeline');pipeline.replaceChildren();
 if(!total)pipeline.append(empty('As próximas pautas começam com a primeira ideia do time.'));
 else{
  const stack=node('div','pipeline-stack');stack.setAttribute('role','img');stack.setAttribute('aria-label','Distribuição das sugestões por status');
  statuses.forEach(status=>{const count=rows.filter(r=>r.status===status).length;if(count){const segment=node('span');segment.dataset.state=status;segment.style.width=(count/total*100)+'%';segment.setAttribute('aria-label',statusName[status]+': '+count);stack.append(segment)}});pipeline.append(stack);
  const legend=node('div','pipeline-legend');statuses.forEach(status=>{const count=rows.filter(r=>r.status===status).length,b=node('button','pipeline-filter');b.type='button';b.dataset.triage=status;const dot=node('span','pipeline-dot');dot.dataset.state=status;b.append(dot,node('span','',statusName[status]),node('strong','',String(count)));legend.append(b)});pipeline.append(legend);
 }
 const next=$('#overview-next');next.replaceChildren();
 if(upcoming){next.append(node('div','next-number','Nº '+upcoming.id),node('span','next-state','Em preparação'),node('h2','',upcoming.title),node('p','next-date','Edição prevista para '+formatDate(upcoming.edition_date)));
  const assigned=rows.filter(r=>r.status==='selecionada'&&r.assigned_edition===upcoming.id).length,limited=rows.length<globalTotal;next.append(node('p','fineprint',assigned?assigned+' '+(assigned===1?'pauta vinculada':'pautas vinculadas')+(limited?' entre as sugestões carregadas.':' a esta edição.'):(limited?'Sem pauta vinculada na lista carregada.':'Nenhuma pauta vinculada a esta edição ainda.')),action('Abrir planejamento','selected'));
 }else {next.append(node('span','next-state','REDAÇÃO EM ABERTO'),node('h2','','Qual é a próxima edição?'),node('p','fineprint','Cadastra a data e o tema para vincular as sugestões recebidas.'));const b=node('button','primary','+ Preparar edição');b.dataset.newEdition='';next.append(b);}
 const ratings=$('#overview-ratings');ratings.replaceChildren();
 const results=(m.edition_results||[]).filter(e=>e.published).sort((a,b)=>(a.edition_date||'9999').localeCompare(b.edition_date||'9999'));
 if(!results.length)ratings.append(empty('As edições publicadas aparecerão aqui para acompanhar as avaliações.'));
 else if(!results.some(e=>Number(e.responses)>0)){ratings.append(empty(results.some(e=>e.voting_open)?'As avaliações estão abertas. As médias aparecem quando chegarem as primeiras respostas.':'Ainda não há avaliações. Para receber notas do time, abre a votação de uma edição.'),action('Gerenciar avaliações','results'));}
 else results.forEach(e=>{const b=node('button','edition-score-row');b.type='button';b.dataset.resultEdition=e.id;const label=node('span','edition-score-label','Edição '+e.id);label.append(node('small','',formatDate(e.edition_date)));const visual=node('span','edition-score-visual'),track=node('span','score-track'),fill=node('span','score-fill');const has=Number(e.responses)>0;fill.style.width=(has?Number(e.average)/5*100:0)+'%';track.append(fill);visual.append(track,node('small','',has?number(e.responses)+' '+(Number(e.responses)===1?'avaliação':'avaliações'):'Sem avaliações'));b.append(label,visual,node('strong','',has?number(e.average):'—'));b.setAttribute('aria-label','Edição '+e.id+': '+(has?number(e.average)+' de 5, '+e.responses+' avaliações.':'sem avaliações.')+' Abrir resultados.');ratings.append(b)});
 const chartNote=document.querySelector('.overview-ratings>.chart-note');if(chartNote)chartNote.hidden=!results.some(e=>Number(e.responses)>0);
 const pollHost=$('#overview-poll');pollHost.replaceChildren();const poll=(m.poll_results||[]).find(p=>p.is_open);
 if(!poll)pollHost.append(empty('Nenhuma enquete aberta. Cria uma pergunta para ouvir o time.'),action('Organizar enquetes','polls'));
 else if(poll.hidden_results){pollHost.append(node('h3','',poll.question),node('p','fineprint','Resultado reservado aos editores até a divulgação.'));const unlock=node('button','secondary','Entrar para consultar');unlock.dataset.enterEditor='';pollHost.append(unlock);}
 else{pollHost.append(node('h3','',poll.question),node('p','poll-vote-total',formatVotes(poll.votes)+' registrados'));
  const lead=[...(poll.options||[])].sort((a,b)=>Number(b.votes)-Number(a.votes));lead.forEach(option=>{const pct=Number(poll.votes)?Math.round(Number(option.votes)/Number(poll.votes)*100):0,line=node('div','dashboard-poll-option'),text=node('div','');text.append(node('span','',option.label),node('strong','',pct+'%'));const track=node('div','score-track'),fill=node('div','score-fill');fill.style.width=pct+'%';track.append(fill);line.append(text,track);pollHost.append(line)});
  pollHost.append(node('p','chart-note','Resultados parciais · a votação continua aberta.'));
 }
 const recent=$('#overview-recent');recent.replaceChildren();
 if(!rows.length)recent.append(empty('Ainda não chegaram sugestões. O formulário da área do time é a porta de entrada.'));
 else rows.slice(0,4).forEach(r=>{const b=node('button','recent-idea');b.type='button';b.dataset.suggestion=r.id;const type=node('span','recent-kind',r.kind),copy=node('span','recent-copy');copy.append(node('strong','',r.title),node('small','',r.first_name+' · '+r.sector+' · '+formatDate(r.created_at)));const badge=node('span','badge',statusName[r.status]);badge.dataset.state=r.status;b.append(type,copy,badge);recent.append(b)});
 $('#editions-count').textContent=published.length+' '+(published.length===1?'publicada':'publicadas')+' · '+(editions.length-published.length)+' em preparação';
 const editionHost=$('#editions-list');editionHost.replaceChildren();
 if(!editions.length)editionHost.append(empty('Nenhuma edição cadastrada por enquanto.'));
 else editions.forEach(e=>{const result=(m.edition_results||[]).find(r=>r.id===e.id),card=node('article','edition-card');card.append(node('span','edition-number','Nº '+e.id),node('span','badge',e.published?'Publicada':'Em preparação'),node('h3','',e.title),node('p','fineprint',formatDate(e.edition_date)));if(e.published)card.append(node('p','edition-card-score',result?.responses?number(result.average)+'/5 · '+number(result.responses)+' avaliações':'Ainda sem avaliações'));
  const tools=node('div','edition-card-tools');if(e.published&&e.url){try{const url=new URL(e.url);if(url.protocol==='https:'){const a=node('a','text-link','Abrir jornal');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';tools.append(a)}}catch{}}
  if(e.published){const b=node('button','text-button','Ver resultados');b.type='button';b.dataset.resultEdition=e.id;tools.append(b)}else tools.append(action('Ver planejamento','selected'));const edit=node('button','text-button','Editar cadastro');edit.dataset.editEdition=e.id;tools.append(edit);card.append(tools);editionHost.append(card)});
}
