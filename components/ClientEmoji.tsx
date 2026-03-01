'use client';

import { Emoji } from 'react-apple-emojis';
import { ComponentProps } from 'react';

type EmojiProps = ComponentProps<typeof Emoji>;

export default function ClientEmoji(props: EmojiProps) {
    return <Emoji {...props} />;
}
