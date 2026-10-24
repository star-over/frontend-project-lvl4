import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import {
  type Channel,
  useAddChannel,
  useChannels,
  useRemoveChannel,
  useRenameChannel,
} from "../api.ts";
import { channelNameError, normalizeChannelName } from "../channelName.ts";
import { useUi } from "../stores/ui.ts";

// Форма имени канала общая для добавления и переименования: Enter отправляет её,
// как и кнопка, потому что это обычный <form>.
const ChannelNameForm = (props: {
  initialName: string;
  onSubmit: (name: string) => Promise<unknown>;
}) => {
  const { t } = useTranslation();
  const closeModal = useUi((state) => state.closeModal);
  const names = (useChannels().data ?? []).map(({ name }) => name);
  const form = useForm({
    initialValues: { name: props.initialName },
    validate: {
      name: (value) => {
        const error = channelNameError(value, names);
        if (error === "length") return t("errors.length");
        if (error === "unique") return t("channels.unique");
        return null;
      },
    },
  });

  const inputProps = form.getInputProps("name");

  // Ошибку и успех показывает слой запросов (src/api.ts); при ошибке модалка остаётся открытой.
  const onSubmit = form.onSubmit(async ({ name }) => {
    try {
      await props.onSubmit(normalizeChannelName(name));
      closeModal();
    } catch {
      // уведомление об ошибке уже показано
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

// Создатель канала сразу переходит в него; остальные узнают о канале из сокета и остаются где были.
const AddChannel = () => {
  const addChannel = useAddChannel();
  const setCurrentChannel = useUi((state) => state.setCurrentChannel);
  return (
    <ChannelNameForm
      initialName=""
      onSubmit={async (name) => setCurrentChannel((await addChannel.mutateAsync(name)).id)}
    />
  );
};

const RenameChannel = ({ channel }: { channel: Channel }) => {
  const renameChannel = useRenameChannel();
  return (
    <ChannelNameForm
      initialName={channel.name}
      onSubmit={(name) => renameChannel.mutateAsync({ id: channel.id, name })}
    />
  );
};

const RemoveChannel = ({ channel }: { channel: Channel }) => {
  const { t } = useTranslation();
  const closeModal = useUi((state) => state.closeModal);
  const removeChannel = useRemoveChannel();

  const onRemove = () => removeChannel.mutate(channel.id, { onSuccess: closeModal });

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
