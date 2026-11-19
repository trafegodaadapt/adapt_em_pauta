import {makePublicApi} from './public-api.js';
export function makeApi(){
 const c=window.AEP_CONFIG||{};
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.supabaseUrl||'')||!c.supabasePublishableKey)return {configured:false};
 if(!c.supabasePublishableKey.startsWith('sb_publishable_'))throw Error('Use apenas a chave publicável do projeto.');
 return makePublicApi(c);
}
