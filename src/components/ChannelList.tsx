import {
  ActionIcon,
  Box,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

import { useChannels } from "../api.ts";
import { useCurrentChannel, useUi } from "../stores/ui.ts";

export const ChannelList = () => {
  const { t } = useTranslation();
  const channels = useChannels().data ?? [];
  const currentId = useCurrentChannel()?.id;
  const setCurrentChannel = useUi((state) => state.setCurrentChannel);
  const openModal = useUi((state) => state.openModal);

  return (
    <Stack w={250} p="md" gap="xs" bg="gray.0">
      <Group justify="space-between" wrap="nowrap">
        <Title order={4}>{t("channels.title")}</Title>
        <ActionIcon variant="outline" size="sm" onClick={() => openModal({ type: "add" })}>
          +
        </ActionIcon>
      </Group>
      <ScrollArea flex={1} scrollbars="y">
        {channels.map((channel) => (
          <Group key={channel.id} gap={0} wrap="nowrap">
            {/* miw={0}: длинное имя обрезается многоточием, кнопка меню остаётся видна.
                Текст «# имя» один на странице — в заголовке канала (по нему ищет проверка):
                здесь «#» отделён отступом, а имя кнопки для поиска по роли — в aria-label. */}
            <NavLink
              flex={1}
              miw={0}
              component="button"
              aria-label={`# ${channel.name}`}
              label={
                <Text fw={700} truncate>
                  <Box component="span" mr={4}>
                    #
                  </Box>
                  {channel.name}
                </Text>
              }
              color="gray"
              active={channel.id === currentId}
              onClick={() => setCurrentChannel(channel.id)}
            />
            {channel.removable && (
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" aria-label={t("channels.manage")}>
                    ▾
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => openModal({ type: "remove", channel })}>
                    {t("channels.remove")}
                  </Menu.Item>
                  <Menu.Item onClick={() => openModal({ type: "rename", channel })}>
                    {t("channels.rename")}
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
