import {
  Alert,
  Box,
  Center,
  Container,
  Flex,
  Loader,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useRef } from "react";

import { useChannels, useMessages } from "../api.ts";
import { MessageForm } from "../components/MessageForm.tsx";
import { useUi } from "../stores/ui.ts";

const plural = new Intl.PluralRules("ru");
const messageWords = { one: "сообщение", few: "сообщения", many: "сообщений", other: "сообщений" };
const countMessages = (n: number) =>
  `${n} ${messageWords[plural.select(n) as keyof typeof messageWords]}`;

export const MainPage = () => {
  const channels = useChannels();
  const messages = useMessages();
  const currentChannelId = useUi((state) => state.currentChannelId);
  const setCurrentChannel = useUi((state) => state.setCurrentChannel);
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
        <Alert color="red">Ошибка загрузки данных</Alert>
      </Container>
    );
  }

  const current = channels.data.find(({ id }) => id === currentChannelId) ?? channels.data[0];
  const channelMessages = messages.data.filter(({ channelId }) => channelId === current?.id);

  return (
    <Container size="xl" py="md">
      <Paper withBorder shadow="sm" h="calc(100vh - 100px)">
        <Flex h="100%">
          <Stack w={250} p="md" gap="xs" bg="gray.0">
            <Title order={4}>Каналы</Title>
            {channels.data.map(({ id, name }) => (
              <NavLink
                key={id}
                component="button"
                label={`# ${name}`}
                fw={700}
                color="gray"
                active={id === current?.id}
                onClick={() => setCurrentChannel(id)}
              />
            ))}
          </Stack>
          <Flex direction="column" flex={1}>
            <Box p="md" bg="gray.0">
              <Text fw={700}># {current?.name}</Text>
              <Text c="dimmed" size="sm">
                {countMessages(channelMessages.length)}
              </Text>
            </Box>
            <ScrollArea flex={1} p="md" viewportRef={feed}>
              {channelMessages.map(({ id, username, body }) => (
                <Text key={id} mb="xs">
                  <b>{username}</b>: {body}
                </Text>
              ))}
            </ScrollArea>
            {current && <MessageForm channelId={current.id} />}
          </Flex>
        </Flex>
      </Paper>
    </Container>
  );
};
