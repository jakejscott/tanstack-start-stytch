import { useAppSession } from "@/lib/session";
import { useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export const toggleDarkModeFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useAppSession();
  let darkMode = session.data.darkMode ?? "dark";
  darkMode = darkMode == "dark" ? "light" : "dark";
  await session.update({ darkMode: darkMode });
  return {};
});

export function ThemeToggle() {
  const router = useRouter();
  const toggleDarkMode = useServerFn(toggleDarkModeFn);

  const handleToggleDarkMode = async () => {
    try {
      await toggleDarkMode();
      router.invalidate();
    } catch (error) {
      toast.error("Unable to toggle dark mode");
    }
  };

  return (
    <Button variant="outline" size="icon" className="size-7" onClick={handleToggleDarkMode}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
