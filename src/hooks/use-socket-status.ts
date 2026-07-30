import { useSocket } from "@/providers/socket-provider";

export function useSocketStatus() {
  const { connected } = useSocket();
  return connected;
}
