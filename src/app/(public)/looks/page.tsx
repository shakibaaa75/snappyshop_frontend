import { LookViewer } from "@/components/seller/looks/LookViewer";

export const metadata = { title: "Try the Look" };

export default async function LookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LookViewer id={id} />;
}
