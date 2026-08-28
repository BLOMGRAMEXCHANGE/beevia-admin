import { humanizeToken } from "@/lib/format";

export const ACTION_TYPE_LABEL: Record<string, string> = {
  suspend: "Suspended",
  restrict: "Restricted",
  activate: "Activated",
  delete: "Deleted",
};

export function actionTypeLabel(actionType: string): string {
  return ACTION_TYPE_LABEL[actionType] ?? humanizeToken(actionType);
}
