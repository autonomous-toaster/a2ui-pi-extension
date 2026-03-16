import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  console.error("[TEST EXTENSION] Loaded successfully!");
  
  pi.registerCommand("test-a2ui", {
    description: "Simple test command",
    handler: async (_args, ctx) => {
      console.error("[TEST] Handler called!");
      ctx.ui.notify("TEST COMMAND EXECUTED - NOT LLM", "success");
    },
  });
  
  console.error("[TEST EXTENSION] Command registered!");
}
