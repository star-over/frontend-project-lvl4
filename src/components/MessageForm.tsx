import { Button, Group, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useSendMessage } from "../api.ts";
import { censor } from "../profanity.ts";
import { useAuth } from "../stores/auth.ts";

export const MessageForm = ({ channelId }: { channelId: string }) => {
  const { t } = useTranslation();
  const username = useAuth((state) => state.user?.username ?? "");
  const sendMessage = useSendMessage();
  const input = useRef<HTMLInputElement>(null);
  const form = useForm({ initialValues: { body: "" } });

  useEffect(() => {
    input.current?.focus();
  }, [channelId]);

  // Пока запрос висит, кнопка заблокирована; при ошибке текст остаётся в поле для повтора,
  // уведомление показывает слой запросов (src/api.ts).
  const onSubmit = form.onSubmit(async ({ body }) => {
    try {
      await sendMessage.mutateAsync({ body: censor(body.trim()), channelId, username });
      form.reset();
    } catch {
      // уведомление об ошибке уже показано
    }
    form.getInputNode("body")?.focus();
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Group p="md" gap="xs">
        <TextInput
          ref={input}
          flex={1}
          aria-label={t("messages.input")}
          placeholder={t("messages.placeholder")}
          {...form.getInputProps("body")}
        />
        <Button
          type="submit"
          variant="light"
          loading={form.submitting}
          disabled={!form.values.body.trim()}
        >
          {t("buttons.send")}
        </Button>
      </Group>
    </form>
  );
};
