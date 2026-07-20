-- Fablesol Phase 2B: player administration permission catalog additions.
-- Read-only visibility permissions only. Phase 2B deliberately creates no
-- player mutation permissions: no manual eligibility grants, no balance
-- edits, and no new suspension powers.

insert into public.admin_permissions
  (key, name, description, category, is_sensitive, is_system)
values
  ('players.access_history.view', 'View player access history', 'View player $FABLE access evaluations and access-session history.', 'players', false, true),
  ('players.security_events.view', 'View player security events', 'View player wallet verification and security event history.', 'players', true, true)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    is_sensitive = excluded.is_sensitive,
    is_system = true;

-- Refresh the Phase 2A player permission descriptions now the system exists.
update public.admin_permissions
set description = 'View the player directory and player profile records.'
where key = 'players.view';

update public.admin_permissions
set description = 'View player support detail, including the full linked wallet address.'
where key = 'players.support_view';

-- Super Admin receives the whole catalog, consistent with Phase 2A.
insert into public.admin_role_permissions (role_id, permission_id)
select role.id, permission.id
from public.admin_roles as role
cross join public.admin_permissions as permission
where role.key = 'super_admin'
on conflict (role_id, permission_id) do nothing;

-- Conservative explicit mappings for the other roles. No wildcards.
with mapping(role_key, permission_key) as (
  values
    ('game_administrator', 'players.access_history.view'),
    ('game_administrator', 'players.security_events.view'),
    ('moderator', 'players.access_history.view'),
    ('customer_support', 'players.access_history.view'),
    ('read_only_analyst', 'players.access_history.view')
)
insert into public.admin_role_permissions (role_id, permission_id)
select role.id, permission.id
from mapping
join public.admin_roles as role on role.key = mapping.role_key
join public.admin_permissions as permission on permission.key = mapping.permission_key
on conflict (role_id, permission_id) do nothing;
