export const $=(s,root=document)=>root.querySelector(s);
export const $$=(s,root=document)=>[...root.querySelectorAll(s)];
export const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export const formatDate=s=>s?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(s.includes('T')?s:s+'T12:00:00Z')):'Edição especial';
export const number=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
export const statusName={recebida:'Recebida',em_analise:'Em análise',selecionada:'Selecionada',publicada:'Publicada',arquivada:'Arquivada'};
export const kinds=['Reflexão','Livro','Filme ou série','Música','Ideia para o jornal','Bastidor','Fora do expediente','Agradecimento'];
export function message(el,text,isError=false){el.textContent=text;el.classList.toggle('error',isError);el.hidden=false;}
export async function busy(button,job){const before=[...button.childNodes];button.disabled=true;button.textContent='Um instante…';try{return await job();}finally{button.disabled=false;button.replaceChildren(...before);}}
export function demoBanner(api){if(!api.demo)return;const bar=node('div','demo-banner','PRÉVIA INTERATIVA · Dados fictícios. Nenhuma resposta real é enviada.');document.body.prepend(bar);document.body.classList.add('is-demo');}
export async function mountAuth(api,onReady,organizer=false){
 const gate=$('#auth-gate'),app=$('#app');
 if(!api.configured){gate.hidden=false;app.hidden=true;$('#auth-title').textContent='A central está em preparação.';$('#auth-description').textContent='O envio será liberado depois que o banco e os acessos estiverem conectados.';$('#auth-form').hidden=true;$('#demo-link').hidden=false;return;}
 if(api.publicDashboard){gate.hidden=true;app.hidden=false;await onReady(await api.session());return;}
 const user=await api.session();
 if(user){
  if(organizer){const access=await api.access();if(!access.organizer){gate.hidden=false;$('#auth-form').hidden=true;$('#auth-title').textContent='Este acesso é da organização.';$('#auth-description').textContent='Teu e-mail está conectado, mas ainda não foi autorizado a entrar na Central.';$('#logout-gate').hidden=false;$('#logout-gate').onclick=async()=>{await api.signOut();location.reload();};return;}}
  gate.hidden=true;app.hidden=false;await onReady(user);return;
 }
 gate.hidden=false;app.hidden=true;
 const form=$('#auth-form'),code=$('#code-field'),status=$('#auth-status');let pendingEmail='';
 form.addEventListener('submit',async event=>{event.preventDefault();const button=$('button[type=submit]',form);try{await busy(button,async()=>{
  if(!pendingEmail){pendingEmail=$('#auth-email').value.trim().toLowerCase();try{await api.requestLogin(pendingEmail);}catch(e){pendingEmail='';throw e;}code.hidden=false;$('#auth-email').readOnly=true;$('#auth-token').required=true;button.dataset.stage='verify';message(status,'Confere o código no teu e-mail. Se recebeu um link, também pode entrar por ele.');}
  else{await api.verifyLogin(pendingEmail,$('#auth-token').value.trim());location.reload();}
 });if(pendingEmail)button.textContent='Confirmar código';}catch(e){message(status,e.message,true);}});
}
export async function copy(text){await navigator.clipboard.writeText(text);}
export function csv(rows){const clean=value=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\ufeff'+rows.map(row=>row.map(clean).join(';')).join('\r\n');}
export function download(name,text,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
