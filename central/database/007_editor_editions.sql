begin;
create function aep_hub.edit_edition(p_key text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare rec aep_hub.editions; eid text:=btrim(p_data->>'id'); label text:=btrim(p_data->>'title'); link text:=nullif(btrim(p_data->>'url'),''); pub boolean:=coalesce((p_data->>'published')::boolean,false); day date:=(p_data->>'edition_date')::date;
begin
 if p_key is null or not exists(select 1 from aep_hub.settings where key_hash=encode(extensions.digest(p_key,'sha256'),'hex')) then raise exception 'Informe a chave de edição.' using errcode='42501';end if;
 if eid is null or eid!~'^[A-Za-z0-9_-]{1,24}$' or label is null or length(label) not between 3 and 140 or day is null then raise exception 'Informe número, título e data da edição.';end if;
 if link is not null and (length(link)>2000 or link!~'^https://[^[:space:]]+$') then raise exception 'Use um link HTTPS válido.';end if;
 if pub and link is null then raise exception 'Uma edição publicada precisa do link do jornal.';end if;
 if p_data->>'mode'='create' then
  insert into aep_hub.editions(id,title,edition_date,url,published,voting_open) values(eid,label,day,link,pub,false) returning * into rec;
 elsif p_data->>'mode'='edit' then
  update aep_hub.editions set title=label,edition_date=day,url=link,published=pub,voting_open=case when pub then voting_open else false end where id=eid returning * into rec;
  if not found then raise exception 'Edição não encontrada. Atualize o painel.';end if;
 else raise exception 'Operação inválida.';end if;
 return to_jsonb(rec);
end $$;
create function public.aep2_edit_edition(p_key text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select aep_hub.edit_edition(p_key,p_data)$$;
revoke all on function aep_hub.edit_edition(text,jsonb),public.aep2_edit_edition(text,jsonb) from public;
grant execute on function aep_hub.edit_edition(text,jsonb),public.aep2_edit_edition(text,jsonb) to anon,authenticated;
commit;
