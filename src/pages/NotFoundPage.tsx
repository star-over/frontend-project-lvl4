import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export const NotFoundPage = () => (
  <Stack align="center" py="xl">
    <Title order={2} c="dimmed">
      Страница не найдена
    </Title>
    <Text c="dimmed">
      Но вы можете перейти{" "}
      <Anchor component={Link} to="/">
        на главную страницу
      </Anchor>
    </Text>
  </Stack>
);
