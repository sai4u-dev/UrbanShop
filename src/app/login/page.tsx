import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border bg-white p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }}>
        <button className="w-full rounded bg-zinc-900 py-2 text-white">Continue with GitHub</button>
      </form>
      <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
        <button className="w-full rounded border py-2">Continue with Google</button>
      </form>
      <form
        action={async (form: FormData) => {
          "use server";
          await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirectTo: "/" });
        }}
        className="space-y-2 border-t pt-4"
      >
        <input name="email" type="email" required placeholder="Email" className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" required placeholder="Password" className="w-full rounded border px-3 py-2" />
        <button className="w-full rounded border py-2">Sign in with email</button>
      </form>
    </div>
  );
}
