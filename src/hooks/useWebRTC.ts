import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type Role = "sender" | "receiver";
type ConnectionStatus = "idle" | "waiting" | "connecting" | "connected" | "failed";

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useWebRTC(role: Role) {
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setStatus("idle");
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setStatus("connected");
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        setStatus("failed");
      }
    };

    return pc;
  }, []);

  // SENDER: create room, capture audio, wait for receiver
  const startSender = useCallback(async (stream: MediaStream) => {
    const code = generateRoomCode();
    setRoomCode(code);
    setStatus("waiting");

    // Create room in DB
    const { error: insertError } = await supabase
      .from("rooms")
      .insert({ code });
    if (insertError) {
      console.error("Failed to create room:", insertError);
      setStatus("failed");
      return;
    }

    const pc = createPeerConnection();

    // Add audio tracks
    stream.getAudioTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Collect ICE candidates
    const iceCandidates: Record<string, unknown>[] = [];
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        iceCandidates.push(e.candidate.toJSON() as Record<string, unknown>);
        await supabase
          .from("rooms")
          .update({ sender_candidates: iceCandidates as unknown as Json[] })
          .eq("code", code);
      }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await supabase
      .from("rooms")
      .update({ offer: offer as unknown as Json })
      .eq("code", code);

    // Listen for answer via realtime
    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        async (payload) => {
          const row = payload.new as any;

          // Set remote answer
          if (row.answer && !pc.remoteDescription) {
            setStatus("connecting");
            await pc.setRemoteDescription(new RTCSessionDescription(row.answer));
          }

          // Add receiver ICE candidates
          if (row.receiver_candidates && Array.isArray(row.receiver_candidates)) {
            for (const c of row.receiver_candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch {}
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [createPeerConnection]);

  // RECEIVER: join room, receive audio
  const joinRoom = useCallback(async (code: string) => {
    setRoomCode(code);
    setStatus("connecting");

    // Fetch room
    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !room) {
      console.error("Room not found:", error);
      setStatus("failed");
      return;
    }

    const pc = createPeerConnection();

    // Handle incoming tracks
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || new MediaStream([e.track]));
    };

    // Collect ICE candidates
    const iceCandidates: Record<string, unknown>[] = [];
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        iceCandidates.push(e.candidate.toJSON() as Record<string, unknown>);
        await supabase
          .from("rooms")
          .update({ receiver_candidates: iceCandidates as unknown as Json[] })
          .eq("code", code);
      }
    };

    // Set remote offer
    if (room.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(room.offer as unknown as RTCSessionDescriptionInit));
    }

    // Add sender ICE candidates
    if (room.sender_candidates && Array.isArray(room.sender_candidates)) {
      for (const c of room.sender_candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c as unknown as RTCIceCandidateInit));
        } catch {}
      }
    }

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await supabase
      .from("rooms")
      .update({ answer: answer as unknown as Json })
      .eq("code", code);

    // Listen for sender ICE candidate updates
    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        async (payload) => {
          const row = payload.new as any;
          if (row.sender_candidates && Array.isArray(row.sender_candidates)) {
            for (const c of row.sender_candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch {}
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    roomCode,
    status,
    remoteStream,
    startSender,
    joinRoom,
    cleanup,
  };
}
