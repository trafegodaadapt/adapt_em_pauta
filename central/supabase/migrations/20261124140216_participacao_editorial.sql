begin;
CREATE OR REPLACE FUNCTION aep_hub.dashboard_internal_v4()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$

select jsonb_build_object('suggestions',coalesce((select jsonb_agg(to_jsonb(s)-'reader_hash'-'request_id' order by created_at desc) from aep_hub.suggestions s),'[]'::jsonb),'editions',coalesce((select jsonb_agg(e order by edition_date desc) from aep_hub.editions e),'[]'::jsonb),'metrics',jsonb_build_object('suggestions',(select count(*) from aep_hub.suggestions),'new_suggestions',(select count(*) from aep_hub.suggestions where status='recebida'),'selected',(select count(*) from aep_hub.suggestions where status='selecionada'),'ratings',(select count(*) from aep_hub.ratings),'average',(select round(avg(score),1) from aep_hub.ratings),'edition_results',coalesce((select jsonb_agg(t order by edition_date desc) from(select e.*,count(r.reader_hash) responses,round(avg(r.score),1) average,count(*)filter(where score=1) score_1,count(*)filter(where score=2) score_2,count(*)filter(where score=3) score_3,count(*)filter(where score=4) score_4,count(*)filter(where score=5) score_5 from aep_hub.editions e left join aep_hub.ratings r on r.edition_id=e.id group by e.id)t),'[]'::jsonb),'poll_results',coalesce((select jsonb_agg(t order by created_at desc) from(select p.id,p.question,p.is_open,p.created_at,(select count(*) from aep_hub.votes v where v.poll_id=p.id) votes,(select jsonb_agg(o||jsonb_build_object('votes',(select count(*) from aep_hub.votes v where v.poll_id=p.id and v.option_id=o->>'id'))) from jsonb_array_elements(p.options)o) options from aep_hub.polls p)t),'[]'::jsonb)))

$function$;

alter table aep_hub.suggestions drop constraint suggestions_kind_check;
alter table aep_hub.suggestions add constraint suggestions_kind_check check(kind in('Reflexão','Livro','Filme ou série','Música','Ideia para o jornal','Bastidor','Fora do expediente','Agradecimento'));
alter table aep_hub.suggestions add column source_edition text references aep_hub.editions, add column editorial_title text check(length(editorial_title) between 3 and 140),add column editorial_body text check(length(editorial_body) between 1 and 4000),add column editorial_url text check(editorial_url is null or(length(editorial_url)<=2000 and editorial_url~'^https://[^[:space:]]+$')),add column cover_url text check(cover_url is null or(length(cover_url)<=2000 and cover_url~'^https://[^[:space:]]+$'));
alter table aep_hub.polls add column edition_id text references aep_hub.editions,add column results_visibility text not null default 'public' check(results_visibility in('public','editors')),add column results_released boolean not null default false;
create table aep_hub.edition_content(edition_id text primary key references aep_hub.editions,headline text not null check(length(headline) between 3 and 180),teasers jsonb not null default '[]' check(jsonb_typeof(teasers)='array' and jsonb_array_length(teasers)<=3),sections jsonb not null default '["indicacoes","musicas","fora","valeu","pergunta","missao"]' check(jsonb_typeof(sections)='array'),next_prompt text not null default '' check(length(next_prompt)<=300),updated_at timestamptz not null default now());
alter table aep_hub.edition_content enable row level security;
revoke all on aep_hub.edition_content from public,anon,authenticated;
create index on aep_hub.polls(edition_id);
create index on aep_hub.suggestions(source_edition);

create or replace function aep_hub.submit(p_reader uuid,p_request uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare h text; rec aep_hub.suggestions;
begin
 if p_reader is null or p_request is null then raise exception 'Identificador de envio inválido.';end if;
 h:=encode(extensions.digest(p_reader::text,'sha256'),'hex');perform pg_advisory_xact_lock(hashtextextended(h,0));
 select * into rec from aep_hub.suggestions where reader_hash=h and request_id=p_request;if found then return jsonb_build_object('id',rec.id);end if;
 if(select count(*) from aep_hub.suggestions where reader_hash=h and created_at>now()-interval '1 hour')>=10 then raise exception 'Limite de envios atingido. Tente mais tarde.';end if;
 insert into aep_hub.suggestions(reader_hash,request_id,first_name,sector,kind,title,body,source_url,share_consent,source_edition) values(h,p_request,split_part(btrim(p_data->>'first_name'),' ',1),coalesce(nullif(btrim(p_data->>'sector'),''),'Não informado'),p_data->>'kind',btrim(p_data->>'title'),btrim(p_data->>'body'),nullif(btrim(p_data->>'source_url'),''),coalesce((p_data->>'share_consent')::boolean,false),(select id from aep_hub.editions where id=p_data->>'source_edition')) returning * into rec;
 return jsonb_build_object('id',rec.id);
end $$;

create or replace function aep_hub.board() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'first_name',s.first_name,'kind',s.kind,'title',coalesce(s.editorial_title,s.title),'body',coalesce(s.editorial_body,s.body),'source_url',coalesce(s.editorial_url,s.source_url),'cover_url',s.cover_url,'assigned_edition',s.assigned_edition,'status',s.status,'publication_url',case when e.published and s.status='publicada' then e.url end) order by s.created_at desc),'[]'::jsonb) from aep_hub.suggestions s left join aep_hub.editions e on e.id=s.assigned_edition where s.show_on_board and s.share_consent and s.status<>'arquivada'
$$;

create or replace function aep_hub.dashboard() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; polls jsonb;
begin
 result:=aep_hub.dashboard_internal_v4();
 select coalesce(jsonb_agg(t.item||jsonb_build_object('edition_id',p.edition_id,'results_visibility',p.results_visibility,'results_released',p.results_released,'hidden_results',p.results_visibility='editors' and not p.results_released,'votes',case when p.results_visibility='editors' and not p.results_released then null else t.item->'votes' end,'options',case when p.results_visibility='editors' and not p.results_released then(select jsonb_agg(o-'votes') from jsonb_array_elements(t.item->'options')o) else t.item->'options' end)),'[]') into polls from jsonb_array_elements(result#>'{metrics,poll_results}')t(item) join aep_hub.polls p on p.id=(t.item->>'id')::uuid;
 result:=jsonb_set(result,'{metrics,poll_results}',polls);
 return result||jsonb_build_object('edition_content',coalesce((select jsonb_agg(c) from aep_hub.edition_content c),'[]'));
end $$;

create function aep_hub.my_submissions(p_reader uuid) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'status',s.status,'edition',s.assigned_edition,'show_on_board',s.show_on_board,'publication_url',case when e.published and s.status='publicada' then e.url end,'created_at',s.created_at)order by s.created_at desc),'[]') from aep_hub.suggestions s left join aep_hub.editions e on e.id=s.assigned_edition where s.reader_hash=encode(extensions.digest(p_reader::text,'sha256'),'hex')
$$;

create function aep_hub.engagement(p_key text,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare rec aep_hub.suggestions; r jsonb; pid uuid;
begin
 if p_key is null or not exists(select 1 from aep_hub.settings where key_hash=encode(extensions.digest(p_key,'sha256'),'hex'))then raise exception 'Informe a chave de edição.' using errcode='42501';end if;
 if p_action='feature' then
 update aep_hub.suggestions set editorial_title=nullif(btrim(p_data->>'title'),''),editorial_body=nullif(btrim(p_data->>'body'),''),editorial_url=nullif(btrim(p_data->>'url'),''),cover_url=nullif(btrim(p_data->>'cover_url'),''),revision=revision+1 where id=(p_data->>'id')::uuid and revision=(p_data->>'revision')::int returning * into rec;
 if not found then raise exception 'Pauta alterada em outra sessão. Atualize.';end if;return to_jsonb(rec)-'reader_hash'-'request_id';
 elsif p_action='create_poll' then
 r:=aep_hub.manage(p_key,'create_poll',p_data);pid:=(r->>'id')::uuid;
 update aep_hub.polls set edition_id=nullif(p_data->>'edition_id',''),results_visibility=coalesce(p_data->>'visibility','public') where id=pid;return r;
 elsif p_action='release_poll' then
 update aep_hub.polls set results_released=coalesce((p_data->>'released')::boolean,false) where id=(p_data->>'id')::uuid and not is_open;
 if not found then raise exception 'Encerre a enquete antes de divulgar o resultado.';end if;
 elsif p_action='poll_results' then
 return aep_hub.dashboard_internal_v4()#>'{metrics,poll_results}';
 elsif p_action='edition_content' then
 if exists(select 1 from jsonb_array_elements_text(p_data->'sections')v where v not in('indicacoes','musicas','fora','valeu','pergunta','missao'))then raise exception 'Quadro inválido.';end if;
 insert into aep_hub.edition_content(edition_id,headline,teasers,sections,next_prompt) values(p_data->>'edition_id',btrim(p_data->>'headline'),p_data->'teasers',p_data->'sections',coalesce(p_data->>'next_prompt','')) on conflict(edition_id) do update set headline=excluded.headline,teasers=excluded.teasers,sections=excluded.sections,next_prompt=excluded.next_prompt,updated_at=now();
 else raise exception 'Ação inválida.';end if;
 return '{"saved":true}'::jsonb;
end $$;

create function public.aep2_my_submissions(p_reader uuid) returns jsonb language sql security invoker set search_path='' as $$select aep_hub.my_submissions(p_reader)$$;
create function public.aep2_engagement(p_key text,p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select aep_hub.engagement(p_key,p_action,p_data)$$;
create or replace function public.aep2_dashboard() returns jsonb language sql security invoker set search_path='' as $$select aep_hub.dashboard()$$;
revoke all on function aep_hub.dashboard_internal_v4() from public,anon,authenticated;
revoke all on function aep_hub.my_submissions(uuid),aep_hub.engagement(text,text,jsonb),public.aep2_my_submissions(uuid),public.aep2_engagement(text,text,jsonb) from public;
grant execute on function aep_hub.my_submissions(uuid),aep_hub.engagement(text,text,jsonb),public.aep2_my_submissions(uuid),public.aep2_engagement(text,text,jsonb) to anon,authenticated;

commit;
