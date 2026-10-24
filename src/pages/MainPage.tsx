import {
  Alert,
  Box,
  Center,
  Container,
  Flex,
  Loader,
  Paper,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useChannels, useMessages } from "../api.ts";
import { ChannelList } from "../components/ChannelList.tsx";
import { ChannelModals } from "../components/ChannelModals.tsx";
import { MessageForm } from "../components/MessageForm.tsx";
import { useUi } from "../stores/ui.ts";

export const MainPage = () => {
  const { t } = useTranslation();
  const channels = useChannels();
  const messages = useMessages();
  const currentChannelId = useUi((state) => state.currentChannelId);
  const feed = useRef<HTMLDivElement>(null);

  // Новое сообщение или смена канала — лента прокручивается к последнему сообщению.
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [messages.data, currentChannelId]);

  if (channels.isPending || messages.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (channels.isError || messages.isError) {
    return (
      <Container py="xl">
        <Alert color="red">{t("errors.loading")}</Alert>
      </Container>
    );
  }

  const current = channels.data.find(({ id }) => id === currentChannelId) ?? channels.data[0];
  const channelMessages = messages.data.filter(({ channelId }) => channelId === current?.id);

  return (
    <Container size="xl" py="md">
      <Paper withBorder shadow="sm" h="calc(100vh - 100px)">
        <Flex h="100%">
          <ChannelList channels={channels.data} currentId={current?.id} />
          {/* miw={0} даёт колонке сжиматься, иначе длинное имя канала распирает вёрстку. */}
          <Flex direction="column" flex={1} miw={0}>
            <Box p="md" bg="gray.0">
              <Title order={5} lineClamp={1}>
                # {current?.name}
              </Title>
              <Text c="dimmed" size="sm">
                {t("messages.count", { count: channelMessages.length })}
              </Text>
            </Box>
            <ScrollArea flex={1} p="md" viewportRef={feed}>
              {channelMessages.map(({ id, username, body }) => (
                <Text key={id} mb="xs" style={{ overflowWrap: "anywhere" }}>
                  <b>{username}</b>: {body}
                </Text>
              ))}
            </ScrollArea>
            {current && <MessageForm channelId={current.id} />}
          </Flex>
        </Flex>
      </Paper>
      <ChannelModals />
    </Container>
  );
};
