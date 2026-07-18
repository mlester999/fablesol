-- Fablesol Phase 2A: deterministic system role and permission metadata.
-- Seven approved roles; permissions cover Phase 2A domains only.

insert into public.admin_roles (key, name, description, is_system)
values
  ('super_admin', 'Super Admin', 'Full platform administration and security authority.', true),
  ('game_administrator', 'Game Administrator', 'Broad operational administration without security administration.', true),
  ('live_ops_manager', 'Live Ops Manager', 'Announcements, maintenance, and feature availability operations.', true),
  ('moderator', 'Moderator', 'Player safety and moderation operations (player systems arrive in Phase 2B).', true),
  ('customer_support', 'Customer Support', 'Read-focused investigation for player support.', true),
  ('blockchain_operator', 'Blockchain Operator', 'Blockchain and token operations (enforcement arrives in a later phase).', true),
  ('read_only_analyst', 'Read-only Analyst', 'Non-administrative operational read access.', true)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    is_system = true;

insert into public.admin_permissions
  (key, name, description, category, is_sensitive, is_system)
values
  ('dashboard.view', 'View dashboard', 'View the administrator dashboard.', 'dashboard', false, true),
  ('admins.view', 'View administrators', 'View administrator accounts and invitations.', 'admins', true, true),
  ('admins.invite', 'Invite administrators', 'Create administrator invitations.', 'admins', true, true),
  ('admins.update', 'Update administrators', 'Update administrator account details.', 'admins', true, true),
  ('admins.suspend', 'Suspend administrators', 'Suspend administrator access.', 'admins', true, true),
  ('admins.restore', 'Restore administrators', 'Restore suspended administrator access.', 'admins', true, true),
  ('admins.revoke_invite', 'Revoke invitations', 'Revoke pending administrator invitations.', 'admins', true, true),
  ('admins.resend_invite', 'Resend invitations', 'Resend administrator invitations.', 'admins', true, true),
  ('admins.manage_roles', 'Manage administrator roles', 'Change administrator role assignments.', 'admins', true, true),
  ('players.view', 'View players', 'View player records when the player system exists (Phase 2B).', 'players', false, true),
  ('players.support_view', 'View player support detail', 'View player support detail when the player system exists (Phase 2B).', 'players', false, true),
  ('announcements.view', 'View announcements', 'View announcement drafts and publication state.', 'announcements', false, true),
  ('announcements.create', 'Create announcements', 'Create announcement drafts.', 'announcements', false, true),
  ('announcements.update', 'Update announcements', 'Edit announcement drafts.', 'announcements', false, true),
  ('announcements.publish', 'Publish announcements', 'Publish or schedule announcements.', 'announcements', true, true),
  ('announcements.cancel', 'Cancel announcements', 'Cancel published or scheduled announcements.', 'announcements', true, true),
  ('maintenance.view', 'View maintenance', 'View maintenance configuration and history.', 'maintenance', false, true),
  ('maintenance.manage', 'Manage maintenance drafts', 'Create and edit maintenance drafts.', 'maintenance', true, true),
  ('maintenance.publish', 'Publish maintenance', 'Publish maintenance configuration.', 'maintenance', true, true),
  ('features.view', 'View feature availability', 'View feature availability and version history.', 'features', false, true),
  ('features.update', 'Update feature availability', 'Create and edit feature availability drafts.', 'features', true, true),
  ('features.publish', 'Publish feature availability', 'Publish feature availability changes.', 'features', true, true),
  ('audit.view', 'View audit log', 'View administrator audit history.', 'audit', true, true),
  ('settings.view', 'View settings', 'View game settings and branding configuration.', 'settings', false, true),
  ('settings.update', 'Update settings', 'Create and edit game settings drafts.', 'settings', true, true),
  ('settings.publish', 'Publish settings', 'Publish game settings configuration.', 'settings', true, true),
  ('system.health.view', 'View system health', 'View environment and service health checks.', 'system', false, true),
  ('system.bootstrap', 'Bootstrap system', 'View and operate the Super Admin bootstrap workflow.', 'system', true, true)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    is_sensitive = excluded.is_sensitive,
    is_system = true;

-- Super Admin intentionally receives the entire Phase 2A catalog.
insert into public.admin_role_permissions (role_id, permission_id)
select role.id, permission.id
from public.admin_roles as role
cross join public.admin_permissions as permission
where role.key = 'super_admin'
on conflict (role_id, permission_id) do nothing;

-- Every other role receives an explicit conservative mapping. No wildcards.
with mapping(role_key, permission_key) as (
  values
    ('game_administrator', 'dashboard.view'),
    ('game_administrator', 'admins.view'),
    ('game_administrator', 'players.view'),
    ('game_administrator', 'players.support_view'),
    ('game_administrator', 'announcements.view'),
    ('game_administrator', 'announcements.create'),
    ('game_administrator', 'announcements.update'),
    ('game_administrator', 'announcements.publish'),
    ('game_administrator', 'announcements.cancel'),
    ('game_administrator', 'maintenance.view'),
    ('game_administrator', 'maintenance.manage'),
    ('game_administrator', 'maintenance.publish'),
    ('game_administrator', 'features.view'),
    ('game_administrator', 'features.update'),
    ('game_administrator', 'features.publish'),
    ('game_administrator', 'audit.view'),
    ('game_administrator', 'settings.view'),
    ('game_administrator', 'settings.update'),
    ('game_administrator', 'settings.publish'),
    ('game_administrator', 'system.health.view'),
    ('live_ops_manager', 'dashboard.view'),
    ('live_ops_manager', 'players.view'),
    ('live_ops_manager', 'announcements.view'),
    ('live_ops_manager', 'announcements.create'),
    ('live_ops_manager', 'announcements.update'),
    ('live_ops_manager', 'announcements.publish'),
    ('live_ops_manager', 'announcements.cancel'),
    ('live_ops_manager', 'maintenance.view'),
    ('live_ops_manager', 'maintenance.manage'),
    ('live_ops_manager', 'maintenance.publish'),
    ('live_ops_manager', 'features.view'),
    ('live_ops_manager', 'features.update'),
    ('live_ops_manager', 'features.publish'),
    ('live_ops_manager', 'audit.view'),
    ('live_ops_manager', 'settings.view'),
    ('live_ops_manager', 'system.health.view'),
    ('moderator', 'dashboard.view'),
    ('moderator', 'players.view'),
    ('moderator', 'players.support_view'),
    ('moderator', 'announcements.view'),
    ('moderator', 'maintenance.view'),
    ('moderator', 'features.view'),
    ('customer_support', 'dashboard.view'),
    ('customer_support', 'players.view'),
    ('customer_support', 'players.support_view'),
    ('customer_support', 'announcements.view'),
    ('customer_support', 'maintenance.view'),
    ('customer_support', 'features.view'),
    ('blockchain_operator', 'dashboard.view'),
    ('blockchain_operator', 'announcements.view'),
    ('blockchain_operator', 'maintenance.view'),
    ('blockchain_operator', 'features.view'),
    ('blockchain_operator', 'settings.view'),
    ('blockchain_operator', 'system.health.view'),
    ('read_only_analyst', 'dashboard.view'),
    ('read_only_analyst', 'admins.view'),
    ('read_only_analyst', 'players.view'),
    ('read_only_analyst', 'announcements.view'),
    ('read_only_analyst', 'maintenance.view'),
    ('read_only_analyst', 'features.view'),
    ('read_only_analyst', 'audit.view'),
    ('read_only_analyst', 'settings.view'),
    ('read_only_analyst', 'system.health.view')
)
insert into public.admin_role_permissions (role_id, permission_id)
select role.id, permission.id
from mapping
join public.admin_roles as role on role.key = mapping.role_key
join public.admin_permissions as permission on permission.key = mapping.permission_key
on conflict (role_id, permission_id) do nothing;
