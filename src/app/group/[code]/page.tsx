import { GroupDashboardClient } from "./GroupDashboardClient";
import { loadGroupDashboard } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function GroupDashboardPage({ params }: PageProps) {
  const { code } = await params;
  const data = await loadGroupDashboard(code);
  return <GroupDashboardClient initialData={data} code={code} />;
}
