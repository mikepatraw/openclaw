import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageCliHelpers } from "./helpers.js";
import { registerMessageDiscordAdminCommands } from "./register.discord-admin.js";

function createHelpers(runMessageAction: MessageCliHelpers["runMessageAction"]): MessageCliHelpers {
  return {
    withMessageBase: (command) => command.option("--channel <channel>", "Channel"),
    withMessageTarget: (command) => command.option("-t, --target <dest>", "Target"),
    withRequiredMessageTarget: (command) => command.requiredOption("-t, --target <dest>", "Target"),
    runMessageAction,
  };
}

describe("registerMessageDiscordAdminCommands", () => {
  const runMessageAction = vi.fn(
    async (_action: string, _opts: Record<string, unknown>) => undefined,
  );

  beforeEach(() => {
    runMessageAction.mockClear();
  });

  it("registers channel create and routes args to channel-create", async () => {
    const message = new Command().exitOverride();
    registerMessageDiscordAdminCommands(message, createHelpers(runMessageAction));

    await message.parseAsync(
      [
        "channel",
        "create",
        "--channel",
        "discord",
        "--guild-id",
        "guild-1",
        "--name",
        "test-channel",
        "--type",
        "0",
      ],
      { from: "user" },
    );

    expect(runMessageAction).toHaveBeenCalledWith(
      "channel-create",
      expect.objectContaining({
        channel: "discord",
        guildId: "guild-1",
        name: "test-channel",
        type: "0",
      }),
    );
  });

  it("registers channel edit/delete/move actions", async () => {
    const message = new Command().exitOverride();
    registerMessageDiscordAdminCommands(message, createHelpers(runMessageAction));

    await message.parseAsync(["channel", "edit", "--channel-id", "123", "--name", "renamed"], {
      from: "user",
    });
    await message.parseAsync(["channel", "delete", "--channel-id", "123"], { from: "user" });
    await message.parseAsync(["channel", "move", "--channel-id", "123", "--position", "4"], {
      from: "user",
    });

    expect(runMessageAction).toHaveBeenNthCalledWith(
      1,
      "channel-edit",
      expect.objectContaining({ channelId: "123", name: "renamed" }),
    );
    expect(runMessageAction).toHaveBeenNthCalledWith(
      2,
      "channel-delete",
      expect.objectContaining({ channelId: "123" }),
    );
    expect(runMessageAction).toHaveBeenNthCalledWith(
      3,
      "channel-move",
      expect.objectContaining({ channelId: "123", position: "4" }),
    );
  });
});
