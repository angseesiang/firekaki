import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  login,
  logout,
  signup,
  type SessionUser,
  type LoginRequest,
  type SignupRequest,
} from "@workspace/api-client-react";

const ME_KEY = ["/api/auth/me"] as const;

export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await getMe({ credentials: "include" });
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) =>
      login(body, { credentials: "include" }),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SignupRequest) =>
      signup(body, { credentials: "include" }),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => logout({ credentials: "include" }),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
    },
  });
}
