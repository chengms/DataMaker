import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <WorkspaceShell taskId={taskId} />;
}
