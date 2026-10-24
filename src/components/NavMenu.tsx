import { Anchor, Button, Container, Group, Paper } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useAuth } from "../stores/auth.ts";
import { pageRoutes } from "../routes.ts";

export const NavMenu = () => {
  const { t } = useTranslation();
  const user = useAuth((state) => state.user);
  const logOut = useAuth((state) => state.logOut);

  return (
    <Paper shadow="xs" radius={0}>
      <Container>
        <Group justify="space-between" h={60}>
          <Anchor component={Link} to={pageRoutes.chat()} fw={700} c="dark" underline="never">
            {t("appName")}
          </Anchor>
          {user && (
            <Button variant="outline" onClick={logOut}>
              {t("buttons.logout")}
            </Button>
          )}
        </Group>
      </Container>
    </Paper>
  );
};
