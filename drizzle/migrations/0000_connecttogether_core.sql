-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 40),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 400),
  interests text[] NOT NULL DEFAULT '{}',
  city text NOT NULL DEFAULT '' CHECK (char_length(city) <= 60),
  mood text NOT NULL DEFAULT '' CHECK (char_length(mood) <= 40),
  avatar_tone int NOT NULL DEFAULT 0 CHECK (avatar_tone BETWEEN 0 AND 5),
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, bio, interests, city, mood, avatar_tone, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_tone)
  VALUES (
    NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), ''), 40),
    floor(random() * 6)::int
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_profile_ready(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _uid
      AND NOT p.is_suspended
      AND char_length(btrim(p.display_name)) >= 2
      AND char_length(btrim(p.bio)) >= 20
      AND cardinality(p.interests) >= 1
  )
$$;

-- ========== ROOMS ==========
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  subtopic text NOT NULL DEFAULT '',
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 400),
  kind text NOT NULL DEFAULT 'group' CHECK (kind IN ('duo', 'group')),
  max_members int NOT NULL DEFAULT 8 CHECK (max_members BETWEEN 2 AND 50),
  mood text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_starter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ready members can create rooms" ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_profile_ready(auth.uid()) AND is_starter = false);
CREATE POLICY "Creators update own rooms" ON public.rooms FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators delete own rooms" ON public.rooms FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.normalize_room()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kind = 'duo' THEN NEW.max_members := 2; END IF;
  IF NEW.kind = 'group' AND NEW.max_members < 3 THEN NEW.max_members := 3; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rooms_normalize BEFORE INSERT OR UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.normalize_room();

-- ========== ROOM MEMBERS ==========
CREATE TABLE public.room_members (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
CREATE INDEX room_members_user_idx ON public.room_members(user_id);
GRANT SELECT, INSERT, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can view room membership" ON public.room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ready members join rooms themselves" ON public.room_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_profile_ready(auth.uid()));
CREATE POLICY "Members leave rooms themselves" ON public.room_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_room_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cap int; cnt int;
BEGIN
  SELECT max_members INTO cap FROM public.rooms WHERE id = NEW.room_id FOR UPDATE;
  SELECT count(*) INTO cnt FROM public.room_members WHERE room_id = NEW.room_id;
  IF cnt >= cap THEN RAISE EXCEPTION 'This room is full'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER room_members_capacity BEFORE INSERT ON public.room_members FOR EACH ROW EXECUTE FUNCTION public.enforce_room_capacity();

CREATE OR REPLACE FUNCTION public.is_room_member(_room uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = _room AND user_id = _uid)
$$;

-- ========== MESSAGES ==========
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  topic text NOT NULL DEFAULT 'thought' CHECK (topic IN ('idea', 'thought', 'plan', 'mood', 'question', 'experience', 'team')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_room_idx ON public.messages(room_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "Ready room members send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_room_member(room_id, auth.uid()) AND public.is_profile_ready(auth.uid()));
CREATE POLICY "Authors delete own messages" ON public.messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_room_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rooms SET last_activity_at = now() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER messages_touch_room AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_room_activity();

-- ========== TEAMS ==========
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  domain text NOT NULL,
  subtopic text NOT NULL DEFAULT '',
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  goal text NOT NULL DEFAULT '' CHECK (char_length(goal) <= 300),
  needed int NOT NULL DEFAULT 5 CHECK (needed BETWEEN 2 AND 50),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ready members create teams" ON public.teams FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_profile_ready(auth.uid()) AND (room_id IS NULL OR public.is_room_member(room_id, auth.uid())));
CREATE POLICY "Creators update teams" ON public.teams FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators delete teams" ON public.teams FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX team_members_user_idx ON public.team_members(user_id);
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ready members join teams themselves" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_profile_ready(auth.uid()));
CREATE POLICY "Members leave teams themselves" ON public.team_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_team_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cap int; cnt int;
BEGIN
  SELECT needed INTO cap FROM public.teams WHERE id = NEW.team_id FOR UPDATE;
  SELECT count(*) INTO cnt FROM public.team_members WHERE team_id = NEW.team_id;
  IF cnt >= cap THEN RAISE EXCEPTION 'This team is already complete'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER team_members_capacity BEFORE INSERT ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.enforce_team_capacity();

CREATE OR REPLACE FUNCTION public.add_team_creator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id) VALUES (NEW.id, NEW.created_by) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER teams_add_creator AFTER INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION public.add_team_creator();

-- ========== REPORTS & BLOCKS ==========
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('fake', 'spam', 'harassment', 'inappropriate', 'other')),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, reported_id),
  CHECK (reporter_id <> reported_id)
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters view own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Members file reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.auto_suspend_reported()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(DISTINCT reporter_id) FROM public.reports WHERE reported_id = NEW.reported_id) >= 3 THEN
    UPDATE public.profiles SET is_suspended = true WHERE id = NEW.reported_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reports_auto_suspend AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.auto_suspend_reported();

CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own blocks" ON public.blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Users create own blocks" ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Users remove own blocks" ON public.blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- ========== PUBLIC STATS ==========
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (members bigint, connections bigint, teams bigint, teamed_up bigint, messages bigint, rooms bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.profiles WHERE NOT is_suspended),
    (SELECT coalesce(sum(n * (n - 1) / 2), 0)::bigint FROM (SELECT count(*) AS n FROM public.room_members GROUP BY room_id) s),
    (SELECT count(*) FROM public.teams),
    (SELECT count(DISTINCT user_id) FROM public.team_members),
    (SELECT count(*) FROM public.messages),
    (SELECT count(*) FROM public.rooms)
$$;

CREATE OR REPLACE FUNCTION public.get_domain_stats()
RETURNS TABLE (domain text, rooms bigint, people bigint, teams bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.domain,
         count(DISTINCT r.id),
         count(DISTINCT rm.user_id),
         (SELECT count(*) FROM public.teams t WHERE t.domain = r.domain)
  FROM public.rooms r
  LEFT JOIN public.room_members rm ON rm.room_id = r.id
  GROUP BY r.domain
$$;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_stats() TO anon, authenticated;

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;

-- ========== STARTER ROOMS ==========
INSERT INTO public.rooms (domain, subtopic, title, description, kind, max_members, mood, is_starter) VALUES
('travel', 'Backpacking', 'Budget backpacking across Asia', 'Share routes, hostels and money-saving tricks for long trips on a small budget.', 'group', 12, 'Adventurous', true),
('travel', 'Weekend trips', 'Weekend getaways near you', 'Plan short trips together and find travel buddies for the next long weekend.', 'group', 8, 'Excited', true),
('sports', 'Football', 'Weekend 5-a-side football squad', 'Looking for players to form a casual team. Share your position and availability.', 'group', 10, 'Energetic', true),
('sports', 'Cricket', 'Gully cricket team builders', 'Find people nearby to form a cricket team and play on weekends.', 'group', 11, 'Competitive', true),
('music', 'Jamming', 'Find your band mates', 'Guitarists, singers, drummers — meet and start jamming together.', 'group', 6, 'Creative', true),
('music', 'Discovery', 'Song of the day swap', 'Everyone shares one song they love and why it matters to them.', 'group', 15, 'Chill', true),
('tech', 'Web development', 'Build a side project together', 'Pitch small app ideas and team up with people who want to ship.', 'group', 6, 'Focused', true),
('tech', 'AI & ML', 'AI tools we actually use', 'Compare notes on AI tools, workflows and experiments.', 'group', 12, 'Curious', true),
('startups', 'Idea validation', 'Validate your startup idea', 'Pitch your idea in one line and get honest perspectives from others.', 'group', 10, 'Ambitious', true),
('startups', 'Co-founders', 'Looking for a co-founder', 'Talk about your skills and what you want to build — maybe find your co-founder.', 'duo', 2, 'Hopeful', true),
('gaming', 'Multiplayer', 'Squad up for tonight', 'Find teammates for online matches. Share your game and rank.', 'group', 5, 'Hyped', true),
('gaming', 'Game design', 'Indie game ideas lab', 'Brainstorm game concepts and maybe build a tiny game together.', 'group', 6, 'Creative', true),
('books', 'Book club', 'Monthly book circle', 'Pick a book together, read and discuss each chapter.', 'group', 12, 'Thoughtful', true),
('books', 'Writing', 'Writers accountability room', 'Share your writing goals and keep each other going.', 'group', 8, 'Motivated', true),
('fitness', 'Running', 'Morning running buddies', 'Find people to run with and share your weekly goals.', 'group', 10, 'Energetic', true),
('fitness', 'Gym', 'Gym workout partners', 'Talk routines, diet and find a workout partner.', 'duo', 2, 'Determined', true),
('art', 'Illustration', 'Daily sketch challenge', 'Share prompts and sketches, give kind feedback.', 'group', 12, 'Creative', true),
('art', 'UI & design', 'Design critique corner', 'Post your work-in-progress and get perspectives from other designers.', 'group', 8, 'Curious', true),
('movies', 'Recommendations', 'What should I watch next?', 'Swap recommendations based on your mood tonight.', 'group', 15, 'Relaxed', true),
('movies', 'Filmmaking', 'Make a short film together', 'Writers, editors, actors — let us make something small and fun.', 'group', 8, 'Creative', true),
('food', 'Home cooking', 'Recipe swap kitchen', 'Share recipes from your culture and try each other''s dishes.', 'group', 12, 'Happy', true),
('food', 'Food spots', 'Best street food finds', 'Talk about the best local food spots in your city.', 'group', 10, 'Hungry', true),
('study', 'Exam prep', 'Silent study group', 'Set goals, study together and check in on progress.', 'group', 8, 'Focused', true),
('study', 'Languages', 'Language exchange partners', 'Practice a language with someone who speaks it — and teach yours.', 'duo', 2, 'Curious', true),
('photography', 'Street photography', 'Photo walk planners', 'Plan photo walks and share your best shots.', 'group', 10, 'Inspired', true),
('photography', 'Editing', 'Editing tips exchange', 'Compare editing styles, presets and tools.', 'group', 10, 'Curious', true),
('volunteering', 'Community', 'Local clean-up drives', 'Organize and join small community volunteering events.', 'group', 20, 'Hopeful', true),
('volunteering', 'Teaching', 'Teach kids for free', 'Volunteers who want to tutor or mentor students.', 'group', 10, 'Kind', true),
('wellbeing', 'Support', 'A safe space to talk', 'Feeling low or stressed? Talk kindly with people who listen.', 'group', 6, 'Low', true),
('wellbeing', 'Mindfulness', 'Daily mindfulness check-in', 'Share one good thing about your day and a small goal.', 'group', 12, 'Calm', true),
('careers', 'Job hunting', 'Job hunt support crew', 'Share openings, review resumes and prepare for interviews together.', 'group', 10, 'Motivated', true),
('careers', 'Mentorship', 'Find a mentor', 'Talk one-on-one with someone a few steps ahead of you.', 'duo', 2, 'Hopeful', true),
('science', 'Space', 'Space & astronomy talk', 'News, stargazing plans and big questions about the universe.', 'group', 15, 'Curious', true),
('science', 'Experiments', 'Science projects together', 'Team up for school or hobby science projects.', 'group', 6, 'Excited', true),
('fashion', 'Styling', 'Outfit ideas exchange', 'Share outfit ideas for events, seasons and budgets.', 'group', 12, 'Playful', true),
('fashion', 'Sustainable fashion', 'Thrift & swap circle', 'Talk thrifting, upcycling and clothing swaps.', 'group', 10, 'Inspired', true);