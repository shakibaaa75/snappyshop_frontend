import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buyerApi,
  type BuyerAddressInput,
  type BuyerProfile,
  type HomeTheme,
  type UpdateBuyerProfileInput,
} from "@/lib/api/buyer";
import { qk } from "@/lib/query/keys";

/** Pass enabled=false until we know the visitor is a signed-in buyer. */
export function useBuyerProfile(enabled = true) {
  return useQuery({
    queryKey: qk.buyer.profile,
    queryFn: buyerApi.profile,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateBuyerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBuyerProfileInput) => buyerApi.updateProfile(input),
    onSuccess: (profile) => {
      qc.setQueryData(qk.buyer.profile, profile);
      // The name also lives on the signed-in user (header, menu).
      qc.invalidateQueries({ queryKey: qk.auth.me });
    },
  });
}

/**
 * Saves the home page theme on the buyer's account. The screen switches at
 * once (the cached profile is updated first) and goes back if the save fails.
 */
export function useSetHomeTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (theme: HomeTheme) => buyerApi.setHomeTheme(theme),
    onMutate: async (theme) => {
      await qc.cancelQueries({ queryKey: qk.buyer.profile });
      const prev = qc.getQueryData<BuyerProfile>(qk.buyer.profile);
      if (prev) {
        qc.setQueryData<BuyerProfile>(qk.buyer.profile, {
          ...prev,
          homeTheme: theme,
        });
      }
      return { prev };
    },
    onError: (_err, _theme, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.buyer.profile, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.buyer.profile }),
  });
}

export function useBuyerAddresses(enabled = true) {
  return useQuery({
    queryKey: qk.buyer.addresses,
    queryFn: buyerApi.addresses,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

/** Any address change refreshes the list and the profile's address count. */
function useAddressMutation<TVars, TData>(fn: (v: TVars) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyer.addresses });
      qc.invalidateQueries({ queryKey: qk.buyer.profile });
    },
  });
}

export const useAddAddress = () =>
  useAddressMutation((input: BuyerAddressInput) => buyerApi.addAddress(input));

export const useUpdateAddress = () =>
  useAddressMutation((v: { id: string; input: BuyerAddressInput }) =>
    buyerApi.updateAddress(v.id, v.input),
  );

export const useSetDefaultAddress = () =>
  useAddressMutation((id: string) => buyerApi.setDefaultAddress(id));

export const useDeleteAddress = () =>
  useAddressMutation((id: string) => buyerApi.deleteAddress(id));