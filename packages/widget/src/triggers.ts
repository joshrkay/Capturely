import type { TriggerConfig } from "@capturely/shared-forms";

/** Set up a trigger and call the callback when it fires. Returns a cleanup function. */
export function setupTrigger(
  config: TriggerConfig,
  callback: () => void
): () => void {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    callback();
  };

  switch (config.type) {
    case "immediate":
      fire();
      return () => {};

    case "delay": {
      const timer = setTimeout(fire, config.delayMs ?? 3000);
      return () => clearTimeout(timer);
    }

    case "scroll": {
      const threshold = (config.scrollPercent ?? 50) / 100;
      const handler = () => {
        const scrolled =
          window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight);
        if (scrolled >= threshold) fire();
      };
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler);
    }

    case "exit_intent": {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 0) fire();
      };
      document.addEventListener("mouseout", handler);
      return () => document.removeEventListener("mouseout", handler);
    }

    case "click": {
      if (!config.clickSelector) return () => {};
      const handler = (e: Event) => {
        const target = e.target as Element;
        if (target.matches(config.clickSelector!)) fire();
      };
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }

    default:
      return () => {};
  }
}
