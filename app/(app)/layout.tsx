import { AppShell } from "@/components/layout/app-shell";
import { ContentArea } from "@/components/layout/content-area";

type AppLayoutProps = RequiredChildren;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell>
      <ContentArea>{children}</ContentArea>
    </AppShell>
  );
}
