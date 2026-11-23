import {$,message,busy} from './shared.js';
let pending=null,activeApi;
export const canEdit=api=>api.demo||api.hasEditor?.();
export async function withEditor(api,job){
 if(!canEdit(api))await new Promise((resolve,reject)=>{pending={resolve,reject};openEditor();});
 return job();
}
function openEditor(){const unlocked=canEdit(activeApi);$('#editing-form').hidden=unlocked;$('#editor-active').hidden=!unlocked;$('#editing-status').textContent='';if(!$('#editing-dialog').open)$('#editing-dialog').showModal();if(!unlocked)$('#editing-key').focus();}
export async function mountEditor(api){
 activeApi=api;
 const update=()=>{const yes=canEdit(api);document.body.dataset.editing=yes?'on':'off';$('#unlock-editing').textContent=yes?'Edição liberada ✓':'Entrar no modo de edição';$('#access-label').textContent=yes?'Modo de edição':'Modo de consulta';$('#user-label').textContent=api.demo?'Demonstração':yes?'Organizadores · edição liberada':'Consulta pública';$('#access-description').textContent=yes?'Tu pode revisar pautas, gerenciar edições e liberar indicações.':'Para salvar alterações, entra no modo de edição com a chave dos organizadores.';$('#signout-mobile').hidden=!yes;$('#signout').hidden=!yes;};
 window.addEventListener('aep:editor',update);
 $('#unlock-editing').onclick=openEditor;
 $('#editor-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1024)throw Error('Seleciona o arquivo .txt da chave dos organizadores.');const key=(await file.text()).trim();if(key.length<20||/\s/.test(key))throw Error('Esse arquivo não contém uma chave válida.');$('#editing-key').value=key;message($('#editing-status'),'Arquivo carregado. Agora confirma em “Liberar alterações”.');}catch(e){message($('#editing-status'),e.message,true);}finally{event.target.value='';}};
 document.addEventListener('click',event=>{if(event.target.closest('[data-enter-editor]'))openEditor();});
 const lock=async()=>{await api.signOut();update();if($('#editing-dialog').open)$('#editing-dialog').close();};
 for(const id of ['signout','signout-mobile','editor-lock'])$('#'+id).onclick=lock;
 $('#editing-form').onsubmit=async event=>{event.preventDefault();try{await busy($('#editing-form button[type=submit]'),()=>api.setEditorKey($('#editing-key').value,$('#editor-remember').checked));$('#editing-key').value='';const job=pending;pending=null;update();$('#editing-dialog').close();job?.resolve();}catch(e){message($('#editing-status'),e.message,true);}};
 $('#editing-dialog').addEventListener('close',()=>{if(pending){const job=pending;pending=null;job.reject(Error('O preenchimento foi mantido. Entra no modo de edição para salvar.'));}});
 if(api.restoreEditor)await api.restoreEditor();update();
}
export function mountEditionForm(api,getState,onChange){
 function open(id){if(!getState()){message($('#central-status'),'O painel está carregando. Tenta novamente em instantes.');return;}const record=getState().editions.find(e=>e.id===id),form=$('#edition-form');form.reset();form.dataset.mode=record?'edit':'create';$('#edition-dialog-title').textContent=record?'Editar cadastro da edição.':'Preparar uma nova edição.';$('#edition-id').readOnly=!!record;$('#edition-id').value=record?.id||String(Math.max(0,...getState().editions.map(e=>Number(e.id)||0))+1).padStart(3,'0');$('#edition-title').value=record?.title||'';
 const date=new Date();date.setDate(date.getDate()+((5-date.getDay()+7)%7||7));$('#edition-date').value=record?.edition_date||(!record?[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'):'');$('#edition-date').required=!record;$('#edition-state').value=record?.published?'published':'draft';$('#edition-url').value=record?.url||'';$('#edition-url').required=!!record?.published;$('#edition-form-status').textContent='';$('#edition-dialog').showModal();}
 document.addEventListener('click',event=>{const add=event.target.closest('[data-new-edition]'),edit=event.target.closest('[data-edit-edition]');if(add)open();else if(edit)open(edit.dataset.editEdition);});
 $('#edition-state').onchange=()=>{$('#edition-url').required=$('#edition-state').value==='published';};
 $('#edition-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type=submit]'),data={mode:form.dataset.mode,id:$('#edition-id').value.trim(),title:$('#edition-title').value.trim(),edition_date:$('#edition-date').value,url:$('#edition-url').value.trim(),published:$('#edition-state').value==='published'};try{await busy(button,()=>withEditor(api,()=>api.saveEdition(data)));await onChange();window.dispatchEvent(new CustomEvent('aep:editions',{detail:{id:data.id}}));$('#edition-dialog').close();message($('#central-status'),'Cadastro salvo. A edição já está disponível no planejamento.');}catch(e){message($('#edition-form-status'),e.message,true);}};
}
