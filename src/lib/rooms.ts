import { supabase } from "@/integrations/supabase/client";

export const ROOM_SELECT = "*, room_members(user_id, profiles(display_name, avatar_tone))";

export async function joinRoom(roomId: string, userId: string) {
  const { error } = await supabase.from("room_members").insert({ room_id: roomId, user_id: userId });
  if (error && error.code !== "23505") {
    throw new Error(error.message.includes("full") ? "That room just filled up — try another one." : error.message);
  }
}
