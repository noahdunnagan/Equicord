/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, findOption } from "@api/Commands";
import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

type ElectronAppLike = {
    setBadgeCount?(count: number): boolean | void;
};

function resolveElectronApp(): ElectronAppLike | null {
    if (typeof DiscordNative !== "undefined" && DiscordNative?.app)
        return DiscordNative.app;

    // Fall back to grabbing Electron directly if the DiscordNative helper is unavailable.
    const electron = tryGetElectronModule();
    if (electron?.app) return electron.app;
    if (electron?.remote?.app) return electron.remote.app;

    return null;
}

function tryGetElectronModule() {
    try {
        const globalRequire = (window as any).__non_webpack_require__ ?? (window as any).require;
        if (typeof globalRequire === "function") {
            return globalRequire("electron");
        }
    } catch {
        // no-op: falls through to returning null
    }

    return null;
}

function setBadgeCount(count: number) {
    const app = resolveElectronApp();
    if (!app?.setBadgeCount) return false;

    // Electron exposes app.setBadgeCount for dock/taskbar badges.
    app.setBadgeCount(Math.max(0, count));
    return true;
}

export default definePlugin({
    name: "BadgeSetterCommand",
    description: "Adds a slash command to set the desktop app's notification badge count.",
    authors: [EquicordDevs.nobody],
    tags: ["badge", "electron", "desktop"],

    commands: [
        {
            name: "setbadge",
            description: "Set the desktop notification badge count.",
            options: [
                {
                    name: "count",
                    description: "Number to show on the dock/taskbar badge.",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: true,
                    minValue: 0
                }
            ],
            execute: (opts: any) => {
                const rawCount = Number(findOption(opts, "count", 0));
                const count = Number.isFinite(rawCount) ? rawCount : 0;

                const updated = setBadgeCount(count);
                if (!updated) {
                    return {
                        content: "Setting the badge count is only available on the desktop (Electron) app."
                    };
                }

                return {
                    content: `Badge count set to ${Math.max(0, count)}.`
                };
            }
        }
    ]
});
