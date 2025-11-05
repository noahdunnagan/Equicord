/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    addMessagePreSendListener,
    MessageSendListener,
    removeMessagePreSendListener } from "@api/MessageEvents";
import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    enable: {
        type: OptionType.BOOLEAN,
        description: "Enable or disable message rewriting",
        default: true
    }
});

const rewrite: MessageSendListener = async (_channelId, msg) => {
    if (!settings.store.enable) return;

    const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]+/;
    const match = msg.content.match(spotifyRegex);
    if (!match) return;

    try {
        const res = await fetch(
            `https://songlink.up.railway.app/api/songlink?url=${encodeURIComponent(match[0])}`
        );
        const data = await res.json();
        const id = data.entityUniqueId;
        const entity = data.entitiesByUniqueId[id];

        if (!entity?.title || !entity?.artistName) {
            console.warn("[SpotifyRewrite] No valid entity found:", data);
            return;
        }

        msg.content = `[${entity.title} — ${entity.artistName}](${match})`;
        console.log("[SpotifyRewrite] Success:", msg.content);
    } catch (err) {
        console.error("[SpotifyRewrite] Proxy fetch failed:", err);
    }
};


export default definePlugin({
    name: "Spotify Link Cleaner",
    description: "Replaces spotify links with a hyperlinked version including artist name and song name.",
    authors: [EquicordDevs.Noah],
    dependencies: ["MessageEventsAPI"],
    start: () => addMessagePreSendListener(rewrite),
    stop: () => removeMessagePreSendListener(rewrite),
    settings
});
