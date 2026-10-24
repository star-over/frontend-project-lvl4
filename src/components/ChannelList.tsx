import { ActionIcon, Group, Menu, NavLink, ScrollArea, Stack, Text, Title } from "@mantine/core";

import type { Channel } from "../api.ts";
import { useUi } from "../stores/ui.ts";

type Props = { channels: Channel[]; currentId: string | undefined };

export const ChannelList = ({ channels, currentId }: Props) => {
  const setCurrentChannel = useUi((state) => state.setCurrentChannel);
  const openModal = useUi((state) => state.openModal);

  return (
    <Stack w={250} p="md" gap="xs" bg="gray.0">
      <Group justify="space-between" wrap="nowrap">
        <Title order={4}>Каналы</Title>
        <ActionIcon variant="outline" size="sm" onClick={() => openModal({ type: "add" })}>
          +
        </ActionIcon>
      </Group>
      <ScrollArea flex={1} scrollbars="y">
        {channels.map((channel) => (
          <Group key={channel.id} gap={0} wrap="nowrap">
            {/* miw={0}: длинное имя обрезается многоточием, кнопка меню остаётся видна. */}
            <NavLink
              flex={1}
              miw={0}
              component="button"
              label={<Text fw={700} truncate>{`# ${channel.name}`}</Text>}
              color="gray"
              active={channel.id === currentId}
              onClick={() => setCurrentChannel(channel.id)}
            />
            {channel.removable && (
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" aria-label="Управление каналом">
                    ▾
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => openModal({ type: "remove", channel })}>
                    Удалить
                  </Menu.Item>
                  <Menu.Item onClick={() => openModal({ type: "rename", channel })}>
                    Переименовать
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        ))}
      </ScrollArea>
    </Stack>
  );
};
