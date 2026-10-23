import { Anchor, Button, Container, Group, Paper } from "@mantine/core";
import { Link } from "react-router";

import { useAuth } from "../stores/auth.ts";

export const NavMenu = () => {
  const user = useAuth((state) => state.user);
  const logOut = useAuth((state) => state.logOut);

  return (
    <Paper shadow="xs" radius={0}>
      <Container>
        <Group justify="space-between" h={60}>
          <Anchor component={Link} to="/" fw={700} c="dark" underline="never">
            Hexlet Chat
          </Anchor>
          {user && (
            <Button variant="outline" onClick={logOut}>
              Выйти
            </Button>
          )}
        </Group>
      </Container>
    </Paper>
  );
};
