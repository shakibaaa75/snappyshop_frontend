import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { buyerOrdersApi, type IssueType } from "@/lib/api/buyerOrders";
import { qk } from "@/lib/query/keys";

/** The buyer's orders, newest first, loaded a page at a time. */
export function useBuyerOrders() {
  return useInfiniteQuery({
    queryKey: qk.buyer.orders,
    queryFn: ({ pageParam }) => buyerOrdersApi.list(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
    staleTime: 30_000,
    retry: false,
  });
}

export function useBuyerOrder(id: string) {
  return useQuery({
    queryKey: qk.buyer.order(id),
    queryFn: () => buyerOrdersApi.get(id),
    staleTime: 15_000,
    retry: false,
  });
}

export function useBuyerIssues() {
  return useQuery({
    queryKey: qk.buyer.issues,
    queryFn: buyerOrdersApi.issues,
    staleTime: 30_000,
    retry: false,
  });
}

/** A report or a withdrawal changes the order page, the list badge and the issues list. */
function useRefreshOrders() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.buyer.orders });
    qc.invalidateQueries({ queryKey: qk.buyer.issues });
  };
}

export function useReportIssue(orderId: string) {
  const refresh = useRefreshOrders();
  return useMutation({
    mutationFn: (input: { type: IssueType; message: string }) =>
      buyerOrdersApi.reportIssue(orderId, input),
    onSuccess: refresh,
  });
}

export function useWithdrawIssue() {
  const refresh = useRefreshOrders();
  return useMutation({
    mutationFn: (id: string) => buyerOrdersApi.withdrawIssue(id),
    onSuccess: refresh,
  });
}
