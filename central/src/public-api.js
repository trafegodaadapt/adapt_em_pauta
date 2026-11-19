// Consultation is public. The editing key lives only in memory.
export function makePublicApi(config){
 let editorKey='',reader;
 try{reader=localStorage.getItem('aep-reader-id');if(!/^[0-9a-f-]{36}$/i.test(reader||'')){reader=crypto.randomUUID();localStorage.setItem('aep-reader-id',reader);}}catch{reader=crypto.randomUUID();}
 async function rpc(name,args={}){
  let response;
  try{response=await fetch(config.supabaseUrl+'/rest/v1/rpc/aep2_'+name,{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(20000)});}catch{throw Error('Não foi possível conectar ao banco. Confere a internet e tenta novamente.');}
  const data=await response.json();
  if(!response.ok){if(data.code==='42501')throw Error('Libere a edição com a chave dos organizadores.');if(['23514','23502','22P02','23503'].includes(data.code))throw Error('Confere os campos, os limites de texto e o link HTTPS.');throw Error(data.message||'Não foi possível concluir. Tenta novamente.');}
  return data;
 }
 const manage=(action,data)=>{if(!editorKey)throw Error('Use “Liberar edição” e informe a chave dos organizadores.');return rpc('manage',{p_key:editorKey,p_action:action,p_data:data});};
 const dashboard=()=>rpc('dashboard');
 return {configured:true,demo:false,publicDashboard:true,
  session:async()=>({email:'Consulta pública · sem e-mail'}),access:async()=>({organizer:true}),signOut:async()=>{editorKey='';},
  async setEditorKey(key){editorKey=key.trim();try{await manage('notes',{id:null});}catch(e){editorKey='';throw e;}},
  dashboard,board:()=>rpc('board'),notes:id=>editorKey?manage('notes',{id}):Promise.resolve([]),
  review:(id,revision,status,edition)=>manage('review',{id,revision,status,edition}),
  publishSuggestion:(id,show)=>manage('publish',{id,show}),addNote:(id,body)=>manage('note',{id,body}),
  submitSuggestion:d=>rpc('submit',{p_reader:reader,p_request:d.request_id,p_data:d}),
  editions:async()=>(await dashboard()).editions.filter(e=>e.published&&e.voting_open),
  polls:async()=>(await dashboard()).metrics.poll_results.filter(p=>p.is_open).map(p=>({id:p.id,question:p.question,options:p.options.map(({id,label,position})=>({id,label,position}))})),
  rating:(id,score,comment)=>rpc('respond',{p_reader:reader,p_type:'rating',p_id:id,p_data:{score,comment}}),
  vote:(id,option)=>rpc('respond',{p_reader:reader,p_type:'vote',p_id:id,p_data:{option}}),
  setVoting:(id,open)=>manage('set_voting',{id,open}),createPoll:(question,options)=>manage('create_poll',{question,options}),closePoll:id=>manage('close_poll',{id}),
  comments:id=>rpc('comments',{p_id:id})
 };
}
