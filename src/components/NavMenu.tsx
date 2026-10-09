import { Anchor, Container, Group, Paper } from "@mantine/core";
import { Link } from "react-router";

// ponytail: кнопка «Выйти» появится вместе с авторизацией
export const NavMenu = () => (
  <Paper shadow="xs" radius={0}>
    <Container>
      <Group justify="space-between" h={60}>
        <Anchor component={Link} to="/" fw={700} c="dark" underline="never">
          Hexlet Chat
        </Anchor>
      </Group>
    </Container>
  </Paper>
);
