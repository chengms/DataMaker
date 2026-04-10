import { LoadingState } from "@/components/common/LoadingState";

export default function SettingsLoading() {
  return <LoadingState title="正在加载设置..." description="读取平台 Prompt 配置" />;
}
