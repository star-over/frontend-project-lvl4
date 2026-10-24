import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";

import {
  type Channel,
  useAddChannel,
  useChannels,
  useRemoveChannel,
  useRenameChannel,
} from "../api.ts";
import { censor } from "../profanity.ts";
import { useUi } from "../stores/ui.ts";

// Форма имени канала общая для добавления и переименования: Enter отправляет её,
// как и кнопка, потому что это обычный <form>.
const ChannelNameForm = (props: {
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
}) => {
  const { t } = useTranslation();
  const closeModal = useUi((state) => state.closeModal);
  const names = (useChannels().data ?? []).map(({ name }) => name);
  const form = useForm({
    initialValues: { name: props.initialName },
    validate: {
      name: (value) =>
        hasLength({ min: 3, max: 20 }, t("errors.length"))(value.trim()) ??
        // Уникальность — по имени после фильтра: оно и уйдёт на сервер.
        (names.includes(censor(value.trim())) ? t("channels.unique") : null),
    },
  });

  const inputProps = form.getInputProps("name");

  const onSubmit = form.onSubmit(async ({ name }) => {
    try {
      // Фильтр мата — и при создании, и при переименовании канала.
      await props.onSubmit(censor(name.trim()));
      closeModal();
    } catch {
      notifications.show({ color: "red", message: t("errors.network") });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextInput
        label={t("channels.name")}
        data-autofocus
        {...inputProps}
        // При переименовании старое имя выделено — набор сразу его заменяет.
        onFocus={(event) => {
          inputProps.onFocus?.(event);
          event.currentTarget.select();
        }}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={closeModal}>
          {t("buttons.cancel")}
        </Button>
        <Button type="submit" loading={form.submitting}>
          {t("buttons.send")}
        </Button>
      </Group>
    </form>
  );
};

const AddChannel = () => {
  const { t } = useTranslation();
  const addChannel = useAddChannel();
  return (
    <ChannelNameForm
      initialName=""
      onSubmit={async (name) => {
        await addChannel.mutateAsync(name);
        notifications.show({ color: "green", message: t("channels.toasts.added") });
      }}
    />
  );
};

const RenameChannel = ({ channel }: { channel: Channel }) => {
  const { t } = useTranslation();
  const renameChannel = useRenameChannel();
  return (
    <ChannelNameForm
      initialName={channel.name}
      onSubmit={async (name) => {
        await renameChannel.mutateAsync({ id: channel.id, name });
        notifications.show({ color: "green", message: t("channels.toasts.renamed") });
      }}
    />
  );
};

const RemoveChannel = ({ channel }: { channel: Channel }) => {
  const { t } = useTranslation();
  const closeModal = useUi((state) => state.closeModal);
  const removeChannel = useRemoveChannel();

  const onRemove = async () => {
    try {
      await removeChannel.mutateAsync(channel.id);
      closeModal();
      notifications.show({ color: "green", message: t("channels.toasts.removed") });
    } catch {
      notifications.show({ color: "red", message: t("errors.network") });
    }
  };

  return (
    <>
      <Text>{t("channels.confirm")}</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={closeModal}>
          {t("buttons.cancel")}
        </Button>
        <Button color="red" loading={removeChannel.isPending} onClick={onRemove}>
          {t("channels.remove")}
        </Button>
      </Group>
    </>
  );
};

export const ChannelModals = () => {
  const { t } = useTranslation();
  const modal = useUi((state) => state.modal);
  const closeModal = useUi((state) => state.closeModal);
  // Ключи перечислены явно: i18next-cli видит только литеральные ключи, не шаблонные строки.
  const titles = {
    add: t("channels.modals.add"),
    rename: t("channels.modals.rename"),
    remove: t("channels.modals.remove"),
  };

  return (
    <Modal
      opened={modal !== null}
      onClose={closeModal}
      title={modal && titles[modal.type]}
      centered
    >
      {modal?.type === "add" && <AddChannel />}
      {modal?.type === "rename" && <RenameChannel channel={modal.channel} />}
      {modal?.type === "remove" && <RemoveChannel channel={modal.channel} />}
    </Modal>
  );
};
