"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  ACTION_LABEL,
  MODULE_LABEL,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModule,
} from "@/features/roles/constants";
import type { PermissionMatrixState } from "@/features/roles/types";

interface PermissionMatrixProps {
  value: PermissionMatrixState;
  onChange: (value: PermissionMatrixState) => void;
}

export function PermissionMatrix({ value, onChange }: PermissionMatrixProps) {
  function toggleCell(
    module: PermissionModule,
    action: PermissionAction,
    checked: boolean
  ) {
    onChange({
      ...value,
      [module]: { ...value[module], [action]: checked },
    });
  }

  function toggleRow(module: PermissionModule, checked: boolean) {
    onChange({
      ...value,
      [module]: PERMISSION_ACTIONS.reduce(
        (actions, action) => {
          actions[action] = checked;
          return actions;
        },
        {} as Record<PermissionAction, boolean>
      ),
    });
  }

  return (
    <div className="max-h-[28rem] overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b">
            <th className="sticky left-0 z-20 bg-card px-3 py-2 text-left font-medium">
              Module
            </th>
            {PERMISSION_ACTIONS.map((action) => (
              <th
                key={action}
                className="px-3 py-2 text-center font-medium whitespace-nowrap"
              >
                {ACTION_LABEL[action]}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium whitespace-nowrap">
              All
            </th>
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((module) => {
            const row = value[module];
            const allChecked = PERMISSION_ACTIONS.every(
              (action) => row[action]
            );
            return (
              <tr key={module} className="border-b last:border-0">
                <td className="sticky left-0 bg-card px-3 py-2 font-medium whitespace-nowrap">
                  {MODULE_LABEL[module]}
                </td>
                {PERMISSION_ACTIONS.map((action) => (
                  <td key={action} className="px-3 py-2 text-center">
                    <Checkbox
                      checked={row[action]}
                      onCheckedChange={(checked) =>
                        toggleCell(module, action, checked === true)
                      }
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(checked) =>
                      toggleRow(module, checked === true)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
