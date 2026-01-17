import { $path } from "next-typesafe-url";
import { redirect } from "next/navigation";

export default function RootAppPage() {
  redirect($path({ route: "/projects" }));
}
