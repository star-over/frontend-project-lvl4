import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

import {
  type Channel,
  useAddChannel,
  useChannels,
  useRemoveChannel,
  useRenameChannel,
} from "../api.ts";
import { useUi } from "../stores/ui.ts";

const networkError = () => notifications.show({ color: "red", message: "Ошибка соединения" });

// Форма имени канала общая для добавления и переименования: Enter отправляет её,
// как и кнопка, потому что это обычный <form>.
const ChannelNameForm = (props: {
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
}) => {
  const closeModal = useUi((state) => state.closeModal);
  const names = (useChannels().data ?? []).map(({ name }) => name);
  const form = useForm({
    initialValues: { name: props.initialName },
    validate: {
      name: (value) =>
        hasLength({ min: 3, max: 20 }, "От 3 до 20 символов")(value.trim()) ??
        (names.includes(value.trim()) ? "Должно быть уникальным" : null),
    },
  });

  const inputProps = form.getInputProps("name");

  const onSubmit = form.onSubmit(async ({ name }) => {
    try {
      await props.onSubmit(name.trim());
      closeModal();
    } catch {
      networkError();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextInput
        label="Имя канала"
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
          Отменить
        </Button>
        <Button type="submit" loading={form.submitting}>
          Отправить
        </Button>
      </Group>
    </form>
  );
};

const AddChannel = () => {
  const addChannel = useAddChannel();
  return (
    <ChannelNameForm
      initialName=""
      onSubmit={async (name) => {
        await addChannel.mutateAsync(name);
        notifications.show({ color: "green", message: "Канал создан" });
      }}
    />
  );
};

const RenameChannel = ({ channel }: { channel: Channel }) => {
  const renameChannel = useRenameChannel();
  return (
    <ChannelNameForm
      initialName={channel.name}
      onSubmit={async (name) => {
        await renameChannel.mutateAsync({ id: channel.id, name });
        notifications.show({ color: "green", message: "Канал переименован" });
      }}
    />
  );
};

const RemoveChannel = ({ channel }: { channel: Channel }) => {
  const closeModal = useUi((state) => state.closeModal);
  const removeChannel = useRemoveChannel();

  const onRemove = async () => {
    try {
      await removeChannel.mutateAsync(channel.id);
      closeModal();
      notifications.show({ color: "green", message: "Канал удалён" });
    } catch {
      networkError();
    }
  };

  return (
    <>
      <Text>Уверены?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={closeModal}>
          Отменить
        </Button>
        <Button color="red" loading={removeChannel.isPending} onClick={onRemove}>
          Удалить
        </Button>
      </Group>
    </>
  );
};

const titles = { add: "Добавить канал", rename: "Переименовать канал", remove: "Удалить канал" };

export const ChannelModals = () => {
  const modal = useUi((state) => state.modal);
  const closeModal = useUi((state) => state.closeModal);

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
