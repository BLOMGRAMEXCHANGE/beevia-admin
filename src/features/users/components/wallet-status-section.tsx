import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatusBadge } from "@/features/users/components/wallet-status-badge";
import type { AppUser } from "@/types/user";

export function WalletStatusSection({ user }: { user: AppUser }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-heading text-base">Wallet status</CardTitle>
        <WalletStatusBadge status={user.walletStatus} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {user.walletStatus === "none"
            ? "No wallet has been set up for this account yet."
            : "Balance and transaction history are managed in the wallets module."}
        </p>
      </CardContent>
    </Card>
  );
}
