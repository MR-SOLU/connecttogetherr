-- Active (non-suspended) member check, used to scope who can browse community data.
CREATE OR REPLACE FUNCTION public.is_active_member(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = _uid AND NOT p.is_suspended
  )
$$;

-- Whether _viewer may see _target's profile: always their own; otherwise only when the
-- viewer is an active member and the target takes part in the community (joined a room
-- or team, wrote a message the viewer can read) or is someone the viewer blocked/reported.
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer IS NOT NULL AND (
    _viewer = _target
    OR (
      public.is_active_member(_viewer) AND (
        EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.user_id = _target)
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = _target)
        OR EXISTS (SELECT 1 FROM public.blocks b WHERE b.blocker_id = _viewer AND b.blocked_id = _target)
        OR EXISTS (SELECT 1 FROM public.reports r WHERE r.reporter_id = _viewer AND r.reported_id = _target)
        OR EXISTS (
          SELECT 1 FROM public.messages m
          WHERE m.user_id = _target AND public.is_room_member(m.room_id, _viewer)
        )
      )
    )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Signed-in members can view profiles" ON public.profiles;
CREATE POLICY "Members view own and community profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.can_view_profile(auth.uid(), id));

DROP POLICY IF EXISTS "Signed-in members can view rooms" ON public.rooms;
CREATE POLICY "Active members can view rooms" ON public.rooms
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_active_member(auth.uid()));

DROP POLICY IF EXISTS "Signed-in members can view room membership" ON public.room_members;
CREATE POLICY "Active members can view room membership" ON public.room_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_member(auth.uid()));

DROP POLICY IF EXISTS "Signed-in members can view teams" ON public.teams;
CREATE POLICY "Active members can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_active_member(auth.uid()));

DROP POLICY IF EXISTS "Signed-in members can view team members" ON public.team_members;
CREATE POLICY "Active members can view team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_member(auth.uid()));