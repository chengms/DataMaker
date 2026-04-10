import { LoadingState } from "@/components/common/LoadingState";

export default function WorkspaceLoading() {
  return <LoadingState title="正在打开任务..." description="读取工作台内容和历史记录" />;
}
