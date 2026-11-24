begin;
CREATE OR REPLACE FUNCTION aep_hub.manage_internal_v4(p_key text, p_action text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$

declare rec aep_hub.suggestions; result jsonb; opts jsonb;

begin

 if p_key is null or not exists(select 1 from aep_hub.settings where key_hash=encode(extensions.digest(p_key,'sha256'),'hex')) then raise exception 'Informe a chave de edição para alterar dados.' using errcode='42501';end if;

 if p_action='review' then

 update aep_hub.suggestions set status=p_data->>'status',assigned_edition=nullif(p_data->>'edition',''),revision=revision+1 where id=(p_data->>'id')::uuid and revision=(p_data->>'revision')::integer returning * into rec;if not found then raise exception 'Pauta alterada em outra sessão. Atualize.';end if;return to_jsonb(rec)-'reader_hash'-'request_id';

 elsif p_action='publish' then

 update aep_hub.suggestions set show_on_board=(p_data->>'show')::boolean,revision=revision+1 where id=(p_data->>'id')::uuid returning * into rec;if not found then raise exception 'Sugestão não encontrada.';end if;return to_jsonb(rec)-'reader_hash'-'request_id';

 elsif p_action='note' then insert into aep_hub.notes(suggestion_id,body) values((p_data->>'id')::uuid,p_data->>'body');

 elsif p_action='notes' then return coalesce((select jsonb_agg(n order by created_at) from aep_hub.notes n where suggestion_id=(p_data->>'id')::uuid),'[]'::jsonb);

 elsif p_action='create_poll' then

 if jsonb_array_length(p_data->'options') not between 2 and 5 or(select count(distinct lower(btrim(value))) from jsonb_array_elements_text(p_data->'options'))<>jsonb_array_length(p_data->'options') then raise exception 'Use de duas a cinco opções diferentes.';end if;

 if exists(select 1 from jsonb_array_elements_text(p_data->'options') where length(value) not between 1 and 140) then raise exception 'Opção inválida.';end if;

 select jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'label',value,'position',n)) into opts from jsonb_array_elements_text(p_data->'options')with ordinality t(value,n);

 insert into aep_hub.polls(question,options) values(p_data->>'question',opts) returning to_jsonb(aep_hub.polls.*) into result;return result;

 elsif p_action='close_poll' then update aep_hub.polls set is_open=false where id=(p_data->>'id')::uuid;

 elsif p_action='set_voting' then update aep_hub.editions set voting_open=(p_data->>'open')::boolean where id=p_data->>'id' and published;

 else raise exception 'Ação inválida.';end if;return '{"saved":true}'::jsonb;

end $function$;
create or replace function aep_hub.manage(p_key text,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_key is null or not exists(select 1 from aep_hub.settings where key_hash=encode(extensions.digest(p_key,'sha256'),'hex'))then raise exception 'Informe a chave de edição.' using errcode='42501';end if;
 if p_action='review' and p_data->>'status'='publicada' and not exists(select 1 from aep_hub.editions where id=p_data->>'edition' and published and url~'^https://[^[:space:]]+$')then raise exception 'Para marcar como Publicada, vincule a uma edição já publicada com link do jornal.';end if;
 return aep_hub.manage_internal_v4(p_key,p_action,p_data);
end $$;
revoke all on function aep_hub.manage_internal_v4(text,text,jsonb) from public,anon,authenticated;
commit;
