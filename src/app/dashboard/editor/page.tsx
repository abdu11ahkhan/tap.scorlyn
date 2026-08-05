import { redirect } from "next/navigation";

export default function EditorRedirectPage() {
  // Redirect to the websites page to select a website to edit
  redirect("/dashboard/websites");
}
