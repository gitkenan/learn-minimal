create type "public"."task_status" as enum ('pending', 'completed');

create table "public"."calendar_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "content" text not null,
    "plan_id" uuid,
    "section_id" text,
    "item_id" text,
    "status" task_status default 'pending'::task_status,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."calendar_tasks" enable row level security;

create table "public"."discussion_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "discussion_id" uuid,
    "content" text not null,
    "is_ai" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "is_system" boolean default false
);


alter table "public"."discussion_messages" enable row level security;

create table "public"."exam_results" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subject" text not null,
    "difficulty" text not null,
    "messages" jsonb not null,
    "final_analysis" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."exam_results" enable row level security;

create table "public"."plan_discussions" (
    "id" uuid not null default uuid_generate_v4(),
    "plan_id" uuid,
    "user_id" uuid,
    "title" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "context" text
);


alter table "public"."plan_discussions" enable row level security;

create table "public"."plan_item_notes" (
    "id" uuid not null default uuid_generate_v4(),
    "plan_id" uuid,
    "task_id" text not null,
    "content" text not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "user_id" uuid
);


create table "public"."plans" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "topic" text not null,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "progress" integer not null default 0,
    "json_content" jsonb,
    "validation_result" jsonb
);


CREATE UNIQUE INDEX discussion_messages_pkey ON public.discussion_messages USING btree (id);

CREATE UNIQUE INDEX exam_results_pkey ON public.exam_results USING btree (id);

CREATE INDEX exam_results_user_id_idx ON public.exam_results USING btree (user_id);

CREATE INDEX idx_discussion_messages_discussion_id ON public.discussion_messages USING btree (discussion_id);

CREATE INDEX idx_plan_discussions_plan_id ON public.plan_discussions USING btree (plan_id);

CREATE INDEX idx_plan_discussions_user_plan ON public.plan_discussions USING btree (plan_id, user_id);

CREATE INDEX idx_planner_tasks_date_user ON public.calendar_tasks USING btree (date, user_id);

CREATE INDEX idx_planner_tasks_plan ON public.calendar_tasks USING btree (plan_id, section_id, item_id);

CREATE INDEX idx_plans_json_content ON public.plans USING gin (json_content);

CREATE UNIQUE INDEX plan_discussions_pkey ON public.plan_discussions USING btree (id);

CREATE UNIQUE INDEX plan_item_notes_pkey ON public.plan_item_notes USING btree (id);

CREATE INDEX plan_item_notes_plan_id_idx ON public.plan_item_notes USING btree (plan_id);

CREATE INDEX plan_item_notes_task_id_idx ON public.plan_item_notes USING btree (task_id);

CREATE UNIQUE INDEX planner_tasks_pkey ON public.calendar_tasks USING btree (id);

CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX unique_calendar_task ON public.calendar_tasks USING btree (plan_id, section_id, item_id);

CREATE UNIQUE INDEX unique_plan_item_per_day ON public.calendar_tasks USING btree (user_id, plan_id, section_id, item_id, date);

alter table "public"."calendar_tasks" add constraint "planner_tasks_pkey" PRIMARY KEY using index "planner_tasks_pkey";

alter table "public"."discussion_messages" add constraint "discussion_messages_pkey" PRIMARY KEY using index "discussion_messages_pkey";

alter table "public"."exam_results" add constraint "exam_results_pkey" PRIMARY KEY using index "exam_results_pkey";

alter table "public"."plan_discussions" add constraint "plan_discussions_pkey" PRIMARY KEY using index "plan_discussions_pkey";

alter table "public"."plan_item_notes" add constraint "plan_item_notes_pkey" PRIMARY KEY using index "plan_item_notes_pkey";

alter table "public"."plans" add constraint "plans_pkey" PRIMARY KEY using index "plans_pkey";

alter table "public"."calendar_tasks" add constraint "planner_tasks_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL not valid;

alter table "public"."calendar_tasks" validate constraint "planner_tasks_plan_id_fkey";

alter table "public"."calendar_tasks" add constraint "planner_tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."calendar_tasks" validate constraint "planner_tasks_user_id_fkey";

alter table "public"."calendar_tasks" add constraint "unique_calendar_task" UNIQUE using index "unique_calendar_task";

alter table "public"."calendar_tasks" add constraint "unique_plan_item_per_day" UNIQUE using index "unique_plan_item_per_day";

alter table "public"."discussion_messages" add constraint "discussion_messages_discussion_id_fkey" FOREIGN KEY (discussion_id) REFERENCES plan_discussions(id) ON DELETE CASCADE not valid;

alter table "public"."discussion_messages" validate constraint "discussion_messages_discussion_id_fkey";

alter table "public"."exam_results" add constraint "exam_results_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."exam_results" validate constraint "exam_results_user_id_fkey";

alter table "public"."plan_discussions" add constraint "plan_discussions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE not valid;

alter table "public"."plan_discussions" validate constraint "plan_discussions_plan_id_fkey";

alter table "public"."plan_discussions" add constraint "plan_discussions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."plan_discussions" validate constraint "plan_discussions_user_id_fkey";

alter table "public"."plan_item_notes" add constraint "plan_item_notes_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE not valid;

alter table "public"."plan_item_notes" validate constraint "plan_item_notes_plan_id_fkey";

alter table "public"."plan_item_notes" add constraint "plan_item_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."plan_item_notes" validate constraint "plan_item_notes_user_id_fkey";

alter table "public"."plans" add constraint "plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."plans" validate constraint "plans_user_id_fkey";

alter table "public"."plans" add constraint "progress_range" CHECK (((progress >= 0) AND (progress <= 100))) not valid;

alter table "public"."plans" validate constraint "progress_range";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_current_uid()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_plan_tasks()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_version INT;
BEGIN
  -- Extract current version
  SELECT (json_content->>'version')::INT 
  INTO v_current_version 
  FROM plans 
  WHERE id = NEW.plan_id;

  -- Increment version in json_content
  NEW.json_content = jsonb_set(
    NEW.json_content::jsonb,
    '{version}',
    to_jsonb(v_current_version + 1)
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_task_completion(p_plan_id uuid, p_section_id text, p_item_id text, p_json_content jsonb, p_status text, p_current_version integer, p_calendar_task_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(status text, version integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_plan_id UUID;
  v_status_task task_status;
BEGIN
  -- Explicit cast of status
  v_status_task := p_status::task_status;

  -- Update plan and get ID in one step
  UPDATE plans
  SET json_content = p_json_content
  WHERE id = p_plan_id 
  AND (json_content->>'version')::integer = p_current_version
  RETURNING id INTO v_plan_id;

  -- Check for concurrent modification
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Concurrent modification detected'
      USING ERRCODE = 'P2002';
  END IF;

  -- Try to update calendar task if ID is provided
  IF p_calendar_task_id IS NOT NULL THEN
    BEGIN
      UPDATE calendar_tasks
      SET status = v_status_task
      WHERE id = p_calendar_task_id
      AND plan_id = p_plan_id
      AND section_id = p_section_id
      AND item_id = p_item_id;
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail if calendar update fails
      RAISE NOTICE 'Calendar task update failed: %', SQLERRM;
    END;
  END IF;

  -- Return status and new version
  RETURN QUERY SELECT 
    p_status AS status,
    (p_current_version + 1) AS version;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."calendar_tasks" to "anon";

grant insert on table "public"."calendar_tasks" to "anon";

grant references on table "public"."calendar_tasks" to "anon";

grant select on table "public"."calendar_tasks" to "anon";

grant trigger on table "public"."calendar_tasks" to "anon";

grant truncate on table "public"."calendar_tasks" to "anon";

grant update on table "public"."calendar_tasks" to "anon";

grant delete on table "public"."calendar_tasks" to "authenticated";

grant insert on table "public"."calendar_tasks" to "authenticated";

grant references on table "public"."calendar_tasks" to "authenticated";

grant select on table "public"."calendar_tasks" to "authenticated";

grant trigger on table "public"."calendar_tasks" to "authenticated";

grant truncate on table "public"."calendar_tasks" to "authenticated";

grant update on table "public"."calendar_tasks" to "authenticated";

grant delete on table "public"."calendar_tasks" to "service_role";

grant insert on table "public"."calendar_tasks" to "service_role";

grant references on table "public"."calendar_tasks" to "service_role";

grant select on table "public"."calendar_tasks" to "service_role";

grant trigger on table "public"."calendar_tasks" to "service_role";

grant truncate on table "public"."calendar_tasks" to "service_role";

grant update on table "public"."calendar_tasks" to "service_role";

grant delete on table "public"."discussion_messages" to "anon";

grant insert on table "public"."discussion_messages" to "anon";

grant references on table "public"."discussion_messages" to "anon";

grant select on table "public"."discussion_messages" to "anon";

grant trigger on table "public"."discussion_messages" to "anon";

grant truncate on table "public"."discussion_messages" to "anon";

grant update on table "public"."discussion_messages" to "anon";

grant delete on table "public"."discussion_messages" to "authenticated";

grant insert on table "public"."discussion_messages" to "authenticated";

grant references on table "public"."discussion_messages" to "authenticated";

grant select on table "public"."discussion_messages" to "authenticated";

grant trigger on table "public"."discussion_messages" to "authenticated";

grant truncate on table "public"."discussion_messages" to "authenticated";

grant update on table "public"."discussion_messages" to "authenticated";

grant delete on table "public"."discussion_messages" to "service_role";

grant insert on table "public"."discussion_messages" to "service_role";

grant references on table "public"."discussion_messages" to "service_role";

grant select on table "public"."discussion_messages" to "service_role";

grant trigger on table "public"."discussion_messages" to "service_role";

grant truncate on table "public"."discussion_messages" to "service_role";

grant update on table "public"."discussion_messages" to "service_role";

grant delete on table "public"."exam_results" to "anon";

grant insert on table "public"."exam_results" to "anon";

grant references on table "public"."exam_results" to "anon";

grant select on table "public"."exam_results" to "anon";

grant trigger on table "public"."exam_results" to "anon";

grant truncate on table "public"."exam_results" to "anon";

grant update on table "public"."exam_results" to "anon";

grant delete on table "public"."exam_results" to "authenticated";

grant insert on table "public"."exam_results" to "authenticated";

grant references on table "public"."exam_results" to "authenticated";

grant select on table "public"."exam_results" to "authenticated";

grant trigger on table "public"."exam_results" to "authenticated";

grant truncate on table "public"."exam_results" to "authenticated";

grant update on table "public"."exam_results" to "authenticated";

grant delete on table "public"."exam_results" to "service_role";

grant insert on table "public"."exam_results" to "service_role";

grant references on table "public"."exam_results" to "service_role";

grant select on table "public"."exam_results" to "service_role";

grant trigger on table "public"."exam_results" to "service_role";

grant truncate on table "public"."exam_results" to "service_role";

grant update on table "public"."exam_results" to "service_role";

grant delete on table "public"."plan_discussions" to "anon";

grant insert on table "public"."plan_discussions" to "anon";

grant references on table "public"."plan_discussions" to "anon";

grant select on table "public"."plan_discussions" to "anon";

grant trigger on table "public"."plan_discussions" to "anon";

grant truncate on table "public"."plan_discussions" to "anon";

grant update on table "public"."plan_discussions" to "anon";

grant delete on table "public"."plan_discussions" to "authenticated";

grant insert on table "public"."plan_discussions" to "authenticated";

grant references on table "public"."plan_discussions" to "authenticated";

grant select on table "public"."plan_discussions" to "authenticated";

grant trigger on table "public"."plan_discussions" to "authenticated";

grant truncate on table "public"."plan_discussions" to "authenticated";

grant update on table "public"."plan_discussions" to "authenticated";

grant delete on table "public"."plan_discussions" to "service_role";

grant insert on table "public"."plan_discussions" to "service_role";

grant references on table "public"."plan_discussions" to "service_role";

grant select on table "public"."plan_discussions" to "service_role";

grant trigger on table "public"."plan_discussions" to "service_role";

grant truncate on table "public"."plan_discussions" to "service_role";

grant update on table "public"."plan_discussions" to "service_role";

grant delete on table "public"."plan_item_notes" to "anon";

grant insert on table "public"."plan_item_notes" to "anon";

grant references on table "public"."plan_item_notes" to "anon";

grant select on table "public"."plan_item_notes" to "anon";

grant trigger on table "public"."plan_item_notes" to "anon";

grant truncate on table "public"."plan_item_notes" to "anon";

grant update on table "public"."plan_item_notes" to "anon";

grant delete on table "public"."plan_item_notes" to "authenticated";

grant insert on table "public"."plan_item_notes" to "authenticated";

grant references on table "public"."plan_item_notes" to "authenticated";

grant select on table "public"."plan_item_notes" to "authenticated";

grant trigger on table "public"."plan_item_notes" to "authenticated";

grant truncate on table "public"."plan_item_notes" to "authenticated";

grant update on table "public"."plan_item_notes" to "authenticated";

grant delete on table "public"."plan_item_notes" to "service_role";

grant insert on table "public"."plan_item_notes" to "service_role";

grant references on table "public"."plan_item_notes" to "service_role";

grant select on table "public"."plan_item_notes" to "service_role";

grant trigger on table "public"."plan_item_notes" to "service_role";

grant truncate on table "public"."plan_item_notes" to "service_role";

grant update on table "public"."plan_item_notes" to "service_role";

grant delete on table "public"."plans" to "anon";

grant insert on table "public"."plans" to "anon";

grant references on table "public"."plans" to "anon";

grant select on table "public"."plans" to "anon";

grant trigger on table "public"."plans" to "anon";

grant truncate on table "public"."plans" to "anon";

grant update on table "public"."plans" to "anon";

grant delete on table "public"."plans" to "authenticated";

grant insert on table "public"."plans" to "authenticated";

grant references on table "public"."plans" to "authenticated";

grant select on table "public"."plans" to "authenticated";

grant trigger on table "public"."plans" to "authenticated";

grant truncate on table "public"."plans" to "authenticated";

grant update on table "public"."plans" to "authenticated";

grant delete on table "public"."plans" to "service_role";

grant insert on table "public"."plans" to "service_role";

grant references on table "public"."plans" to "service_role";

grant select on table "public"."plans" to "service_role";

grant trigger on table "public"."plans" to "service_role";

grant truncate on table "public"."plans" to "service_role";

grant update on table "public"."plans" to "service_role";

create policy "User access to their tasks"
on "public"."calendar_tasks"
as permissive
for all
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can delete their own tasks"
on "public"."calendar_tasks"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own tasks"
on "public"."calendar_tasks"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own tasks"
on "public"."calendar_tasks"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own tasks"
on "public"."calendar_tasks"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert messages to their discussions"
on "public"."discussion_messages"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM plan_discussions
  WHERE ((plan_discussions.id = discussion_messages.discussion_id) AND (plan_discussions.user_id = auth.uid())))));


create policy "Users can view messages from their discussions"
on "public"."discussion_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM plan_discussions
  WHERE ((plan_discussions.id = discussion_messages.discussion_id) AND (plan_discussions.user_id = auth.uid())))));


create policy "Users can insert their own exam results"
on "public"."exam_results"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can view their own exam results"
on "public"."exam_results"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own discussions"
on "public"."plan_discussions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own discussions"
on "public"."plan_discussions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Authenticated users can insert their own plans"
on "public"."plans"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Enable delete for users based on user_id"
on "public"."plans"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Enable read access for own plans"
on "public"."plans"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Enable update for users based on user_id"
on "public"."plans"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Enable users to view their own data only"
on "public"."plans"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update own plans"
on "public"."plans"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "service_role_all"
on "public"."plans"
as permissive
for all
to service_role
using (true)
with check (true);


CREATE TRIGGER update_planner_tasks_updated_at BEFORE UPDATE ON public.calendar_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


